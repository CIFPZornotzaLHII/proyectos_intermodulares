#!/usr/bin/env node
// ponytail-inject.js — inyecta el ruleset de ponytail en la sesión y en el subagente builder.
//
// Sustituye a los hooks del plugin oficial (DietrichGebert/ponytail, MIT) para que el repo
// no dependa de nada instalado fuera de él. Lo registra .claude/settings.json en dos eventos:
//
//   SessionStart   → contexto para la sesión principal (la que ejecuta /factory)
//   SubagentStart  → contexto para los subagentes cuyo nombre case con el `matcher`
//                    de settings.json (por defecto solo `builder`, que es el único que escribe código)
//
// Fuente de verdad del nivel: factory/config.json → "ponytail": { "level": "off|lite|full|ultra" }.
// Fuente de verdad de las reglas: .claude/skills/ponytail/SKILL.md (solo se conserva la fila
// de la tabla "Levels" del nivel activo, igual que hace el plugin original).
//
// Nunca bloquea: cualquier error → sale sin inyectar nada. Lee stdin con un tope de 1 s.

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CONFIG = path.join(ROOT, 'factory', 'config.json');
const SKILL = path.join(ROOT, '.claude', 'skills', 'ponytail', 'SKILL.md');
const LEVELS = ['lite', 'full', 'ultra'];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; }
}

// Quita el frontmatter y deja solo la fila de la tabla de niveles que corresponde.
function rulesFor(level) {
  const body = fs.readFileSync(SKILL, 'utf8').replace(/^---[\s\S]*?---\s*/, '');
  return body.split(/\r?\n/).filter((line) => {
    const m = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|/);
    if (m && LEVELS.includes(m[1].trim().toLowerCase())) return m[1].trim().toLowerCase() === level;
    return !line.startsWith('<!--');
  }).join('\n').trim();
}

function emit(event, text) {
  // Salida síncrona: el proceso termina justo después y un write asíncrono podría perderse.
  fs.writeSync(1, JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
}

function run(input) {
  const cfg = (readJson(CONFIG) || {}).ponytail || {};
  const level = String(cfg.level || 'full').trim().toLowerCase();
  if (!LEVELS.includes(level)) return; // "off" o valor desconocido: no se inyecta nada

  let payload = {};
  try { payload = JSON.parse(input.replace(/^﻿/, '')); } catch (e) { /* sin stdin: se asume SessionStart */ }
  const event = payload.hook_event_name || process.argv[2] || 'SessionStart';

  if (event === 'SessionStart' && cfg.session === false) return;
  if (event !== 'SessionStart' && event !== 'SubagentStart') return;

  const header = 'PONYTAIL MODE ACTIVE — level: ' + level +
    ' (configurado en factory/config.json; reglas en .claude/skills/ponytail/SKILL.md)\n\n';
  emit(event, header + rulesFor(level));
}

let input = '';
let done = false;
function finish() {
  if (done) return;
  done = true;
  try { run(input); } catch (e) { /* nunca bloquear la sesión por un hook */ }
  process.exit(0);
}
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', finish);
process.stdin.on('error', finish);
setTimeout(finish, 1000);
