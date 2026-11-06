#!/usr/bin/env node
// Dashboard de la fábrica. Cero dependencias; Node >= 18.
//
//   node factory/dashboard/server.mjs              → http://127.0.0.1:8989  (lee factory/jobs/)
//   node factory/dashboard/server.mjs --examples   → lo mismo con factory/examples/jobs/
//   node factory/dashboard/server.mjs --port 9000
//   node factory/dashboard/server.mjs --host 0.0.0.0   (solo dentro de Docker; expone el puerto)
//
// Sirve index.html y una API de solo lectura:
//   GET /api/state              configuración + todos los jobs con sus veredictos por ronda + backlog + métricas
//   GET /api/file?job=&path=    un fichero markdown/json de la carpeta del job
//   GET /api/diff?job=          el diff de la rama (o del commit de merge si ya se fusionó)
//   GET /api/log?job=           los commits de la rama
//   POST /api/approve?job=      aprueba un job en needs-human (crea factory/approvals/<job>; lo fusiona el cron)
//   POST /api/pause             pone o quita factory/PAUSED (el cron no empieza vueltas mientras exista)
//
// Por defecto solo escucha en 127.0.0.1. Lo único que escribe son esas dos señales (ficheros vacíos); el estado de
// los jobs lo escribe el orquestador. El contrato de datos que sigue cualquier interfaz: factory-doc/DATOS.md.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : dflt; };

const PORT = Number(opt('--port', 8989));
const HOST = opt('--host', '127.0.0.1'); // 0.0.0.0 solo dentro de Docker
const EXAMPLES = flag('--examples');
const JOBS_DIR = path.resolve(ROOT, opt('--jobs', EXAMPLES ? 'factory/examples/jobs' : 'factory/jobs'));
const CONFIG_FILE = path.join(ROOT, 'factory', 'config.json');
const METRICS_FILE = path.join(ROOT, 'factory', 'metrics.json');
const BACKLOG_FILE = path.join(ROOT, 'factory', 'backlog.md');
const PAUSED_FILE = path.join(ROOT, 'factory', 'PAUSED');
const APPROVALS_DIR = path.join(ROOT, 'factory', 'approvals');

const JOB_ID = /^\d{3}-[a-z0-9][a-z0-9-]*$/;
const SAFE_PATH = /^(spec|build|decision|job|rework-\d+)\.(md|json)$|^round-\d+\/review-[a-z-]+\.md$/;

function readText(file) { try { return fs.readFileSync(file, 'utf8'); } catch { return null; } }
function readJson(file) { try { return JSON.parse(readText(file)); } catch { return null; } }
function firstLine(text) { return (text || '').split(/\r?\n/)[0].trim(); }

function verdictOf(text) {
  const m = firstLine(text).match(/^VERDICT:\s*(PASS|CHANGES)$/);
  return m ? m[1] : (text == null ? 'missing' : 'invalid');
}

// Lista recursiva de los .md/.json de un job, en el orden en que apetece leerlos.
function listFiles(dir, prefix = '') {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix + entry.name;
    if (entry.isDirectory()) out = out.concat(listFiles(path.join(dir, entry.name), rel + '/'));
    else if (SAFE_PATH.test(rel)) out.push(rel);
  }
  const rank = (f) => {
    const fixed = ['spec.md', 'build.md', 'decision.md', 'job.json'];
    if (fixed.includes(f)) return [0, fixed.indexOf(f), f];
    if (f.startsWith('rework-')) return [1, 0, f];
    const m = f.match(/^round-(\d+)\//);
    return [2, m ? Number(m[1]) : 0, f];
  };
  return out.sort((a, b) => { const [x, y] = [rank(a), rank(b)]; return x[0] - y[0] || x[1] - y[1] || x[2].localeCompare(y[2]); });
}

function loadJob(id) {
  const dir = path.join(JOBS_DIR, id);
  const job = readJson(path.join(dir, 'job.json'));
  if (!job) return { id, stage: 'invalid', error: 'job.json ausente o ilegible', files: [], rounds: {} };
  const reviewers = Array.isArray(job.reviewers) && job.reviewers.length ? job.reviewers : Object.keys(job.reviews || {});
  const rounds = {};
  for (let n = 1; n <= (job.round || 0); n++) {
    const verdicts = {};
    for (const lens of reviewers) verdicts[lens] = verdictOf(readText(path.join(dir, `round-${n}`, `review-${lens}.md`)));
    rounds[n] = verdicts;
  }
  // La ronda en curso se lee de job.json (el orquestador la actualiza chip a chip).
  if (job.round > 0 && job.stage === 'review') rounds[job.round] = Object.fromEntries(reviewers.map((l) => [l, (job.reviews || {})[l] || 'pending']));
  const decision = firstLine(readText(path.join(dir, 'decision.md')));
  const build = firstLine(readText(path.join(dir, 'build.md'))).replace(/^STATUS:\s*/, '');
  return { ...job, reviewers, rounds, files: listFiles(dir), decision: decision || null, build_status: build || null };
}

// Las líneas `- [ ] <texto>` (pendiente) y `- [x] <texto> → <job-id | claimed>` (reclamada) de backlog.md, en orden
// (DATOS.md §1). Solo las reclamadas llevan job: el texto de una pendiente puede contener flechas.
function backlog() {
  const text = readText(BACKLOG_FILE);
  if (text == null) return null;
  return text.split(/\r?\n/).flatMap((line) => {
    const m = line.trim().match(/^- \[( |x)\] (.*)$/);
    if (!m) return [];
    const done = m[1] === 'x';
    const i = done ? m[2].lastIndexOf(' → ') : -1;
    return [{ text: (i >= 0 ? m[2].slice(0, i) : m[2]).trim(), done, job: i >= 0 ? m[2].slice(i + 3).trim() : null }];
  });
}

function state() {
  const config = readJson(CONFIG_FILE) || {};
  let ids = [];
  try { ids = fs.readdirSync(JOBS_DIR, { withFileTypes: true }).filter((e) => e.isDirectory() && JOB_ID.test(e.name)).map((e) => e.name).sort(); } catch { /* sin carpeta: sin jobs */ }
  const metrics = readJson(METRICS_FILE);
  return { root: ROOT, jobsDir: JOBS_DIR, examples: EXAMPLES, config, paused: fs.existsSync(PAUSED_FILE), metrics, backlog: backlog(), jobs: ids.map(loadJob), generatedAt: new Date().toISOString() };
}

function git(gitArgs) {
  return new Promise((resolve) => {
    execFile('git', gitArgs, { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ ok: !err, out: stdout || '', err: (stderr || (err && err.message) || '').trim() });
    });
  });
}

async function diffFor(job, kind) {
  if (!job) return { ok: false, text: 'Job desconocido.' };
  if (job.merge_commit) {
    const mc = job.merge_commit;
    const r = kind === 'log'
      ? await git(['log', '--oneline', `${mc}^1..${mc}`])
      : await git(['diff', '--stat', '--patch', `${mc}^1`, mc]);
    return r.ok ? { ok: true, text: r.out, source: `commit de merge ${mc.slice(0, 7)}` } : { ok: false, text: `El commit de merge ${mc.slice(0, 7)} no está en este repo (${r.err}).` };
  }
  const branch = job.branch || `factory/${job.id}`;
  const exists = await git(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]);
  if (!exists.ok) return { ok: false, text: `La rama ${branch} no existe en este repo${EXAMPLES ? ' (es un job de ejemplo)' : ''}.` };
  const r = kind === 'log'
    ? await git(['log', '--oneline', `main..${branch}`])
    : await git(['diff', '--stat', '--patch', `main...${branch}`]);
  return r.ok ? { ok: true, text: r.out, source: `rama ${branch}` } : { ok: false, text: r.err };
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return send(res, 200, readText(path.join(HERE, 'index.html')), 'text/html; charset=utf-8');
    }
    if (url.pathname === '/api/state') return send(res, 200, state());
    if (req.method === 'POST' && url.pathname === '/api/pause') {
      if (fs.existsSync(PAUSED_FILE)) fs.unlinkSync(PAUSED_FILE); else fs.writeFileSync(PAUSED_FILE, '');
      return send(res, 200, { paused: fs.existsSync(PAUSED_FILE) });
    }
    const id = url.searchParams.get('job') || '';
    if (url.pathname.startsWith('/api/') && !JOB_ID.test(id)) return send(res, 400, { error: 'job inválido' });
    if (url.pathname === '/api/file') {
      const rel = url.searchParams.get('path') || '';
      if (!SAFE_PATH.test(rel)) return send(res, 400, { error: 'ruta no permitida' });
      const text = readText(path.join(JOBS_DIR, id, rel));
      return text == null ? send(res, 404, { error: 'no existe' }) : send(res, 200, text, 'text/plain; charset=utf-8');
    }
    if (req.method === 'POST' && url.pathname === '/api/approve') {
      if (EXAMPLES) return send(res, 400, { error: 'los ejemplos no se aprueban' });
      const job = readJson(path.join(JOBS_DIR, id, 'job.json'));
      if (!job || job.stage !== 'needs-human') return send(res, 409, { error: 'el job no está en needs-human' });
      fs.mkdirSync(APPROVALS_DIR, { recursive: true });
      fs.writeFileSync(path.join(APPROVALS_DIR, id), '');
      return send(res, 200, { approved: id });
    }
    if (url.pathname === '/api/diff' || url.pathname === '/api/log') {
      const job = readJson(path.join(JOBS_DIR, id, 'job.json'));
      return send(res, 200, await diffFor(job && { ...job, id }, url.pathname.endsWith('log') ? 'log' : 'diff'));
    }
    send(res, 404, { error: 'no encontrado' });
  } catch (e) {
    send(res, 500, { error: String(e && e.message || e) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Dashboard de la fábrica → http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Jobs: ${JOBS_DIR}${EXAMPLES ? '  (ejemplos)' : ''}`);
});
