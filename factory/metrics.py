#!/usr/bin/env python3 -I
"""Métricas por job de la fábrica -> factory/metrics.json (lo lee el dashboard; ignorado por git) y una tabla por stdout.

Lee los transcripts de Claude Code de este repo (~/.claude/projects/<slug del repo>/**/*.jsonl). Atribución por sesión, no por
mención: cada sesión que empezó con /factory (las demás no cuentan: una charla que cita jobs no es trabajo de ninguno)
se asigna al job que más veces nombra; si ningún job pasa de la mitad de las menciones, se reparte en proporción (shared).
Las fechas de job.json no sirven para el tiempo: un job que espera al cron o al humano acumula días.

Campos: minutes = del primer al último evento de las sesiones del job (tiempo de pared que corrió); turns = respuestas del
modelo; output_tokens = generados; input_tokens = leídos en total (caché + nuevos); ctx_max / ctx_avg = tamaño del prompt
en el turno mayor y en el medio; models = turnos por modelo.
Uso: python3 -I factory/metrics.py   (lo llama el cron tras cada vuelta; también vale a mano)
"""
import glob, json, os, re, collections
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Claude Code guarda los transcripts bajo la ruta del repo con todo lo que no es letra o número cambiado por '-'
SESS = os.path.expanduser('~/.claude/projects/' + re.sub(r'[^A-Za-z0-9]', '-', ROOT))
OUT = os.path.join(ROOT, 'factory', 'metrics.json')
ts = lambda s: datetime.fromisoformat(s.replace('Z', '+00:00'))
JOBRE = re.compile(r'\b(\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*)')


def sessions():
    """{id de sesión raíz: [ficheros jsonl]} — <SESS>/<id>.jsonl y <SESS>/<id>/**/*.jsonl (subagentes)."""
    out = collections.defaultdict(list)
    for f in glob.glob(SESS + '/**/*.jsonl', recursive=True):
        rel = os.path.relpath(f, SESS)
        out[rel.split('/')[0].replace('.jsonl', '')].append(f)
    return out


def is_factory(files):
    root = min(files, key=len)  # <id>.jsonl, no los subagentes
    for line in open(root, errors='replace'):
        if '"type":"user"' not in line and '"type": "user"' not in line:
            continue
        try:
            c = json.loads(line).get('message', {}).get('content', '')
        except ValueError:
            return False
        return '<command-name>/factory' in (c if isinstance(c, str) else json.dumps(c))
    return False


def measure(files, job_ids):
    m = dict(a=None, b=None, turns=0, out=0, inp=0, ctx=[], models=collections.Counter(), jobs=collections.Counter())
    for f in files:
        for line in open(f, errors='replace'):
            try:
                d = json.loads(line)
            except ValueError:
                continue
            if d.get('timestamp'):
                x = ts(d['timestamp']); m['a'] = min(m['a'] or x, x); m['b'] = max(m['b'] or x, x)
            for jid in JOBRE.findall(line):
                if jid in job_ids:
                    m['jobs'][jid] += 1
            msg = d.get('message')
            u = msg.get('usage') if isinstance(msg, dict) else None
            if d.get('type') == 'assistant' and u:
                ctx = u.get('cache_read_input_tokens', 0) + u.get('cache_creation_input_tokens', 0) + u.get('input_tokens', 0)
                m['turns'] += 1; m['out'] += u.get('output_tokens', 0); m['inp'] += ctx; m['ctx'].append(ctx)
                m['models'][(msg.get('model') or '?').replace('claude-', '')] += 1
    return m


def main():
    jobs = {}
    for j in sorted(glob.glob(ROOT + '/factory/jobs/*/job.json')):
        d = json.load(open(j))
        jobs[d['id']] = dict(stage=d.get('stage', '?'), round=d.get('round', '?'),
                             min=0, turns=0, out=0, inp=0, ctx=[], models=collections.Counter(), sessions=0, shared=0)
    for sid, files in sessions().items():
        if not is_factory(files):
            continue
        m = measure(files, jobs)
        if m['turns'] == 0 or not m['jobs']:
            continue
        total = sum(m['jobs'].values()); top, n = m['jobs'].most_common(1)[0]
        minutes = (m['b'] - m['a']).total_seconds() / 60 if m['a'] and m['b'] else 0
        shares = {top: 1.0} if n * 2 >= total else {k: v / total for k, v in m['jobs'].items()}
        for jid, w in shares.items():
            J = jobs[jid]
            J['min'] += minutes * w; J['turns'] += m['turns'] * w; J['out'] += m['out'] * w; J['inp'] += m['inp'] * w
            J['ctx'] += m['ctx']; J['sessions'] += 1; J['shared'] += 0 if w == 1.0 else 1
            for k, v in m['models'].items():
                J['models'][k] += v * w
    rows = []
    print('| Job | Etapa | Rondas | Sesiones | Min | Turnos | Salida (tok) | Entrada (M tok) | ctx máx | ctx medio | Modelos |')
    print('|---|---|---|---|---|---|---|---|---|---|---|')
    for jid, J in jobs.items():
        ctxmax = max(J['ctx']) if J['ctx'] else 0; ctxavg = sum(J['ctx']) // len(J['ctx']) if J['ctx'] else 0
        models = {k: round(v) for k, v in sorted(J['models'].items(), key=lambda kv: -kv[1]) if round(v) > 0 and k != '<synthetic>'}
        rows.append(dict(id=jid, stage=J['stage'], round=J['round'], sessions=J['sessions'], shared=J['shared'],
                         minutes=round(J['min']), turns=round(J['turns']), output_tokens=round(J['out']),
                         input_tokens=round(J['inp']), ctx_max=ctxmax, ctx_avg=ctxavg, models=models))
        print(f"| {jid} | {J['stage']} | {J['round']} | {J['sessions']}{'~' if J['shared'] else ''} | {round(J['min'])} | {round(J['turns'])} | "
              f"{round(J['out']):,} | {J['inp']/1e6:.1f} | {ctxmax:,} | {ctxavg:,} | {', '.join(f'{k}×{v}' for k, v in models.items())} |")
    json.dump(dict(updated=datetime.now().isoformat(timespec='seconds'), jobs=rows),
              open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
