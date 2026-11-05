#!/usr/bin/env python3
"""Numera la decisión D-NEW de una rama de la fábrica (factory-doc/DECISIONES.md, «D-NEW»).

Uso: python3 factory/renumerar.py <worktree> [rama-base]   (base: main)

El siguiente número libre es el mayor `### D-nn` de docs/DECISIONS.md en la base más uno. Sustituye `D-NEW` solo en
las líneas que la rama añade respecto a la base (git diff -U0), así el `D-NEW` de la prosa de CLAUDE.md o de los agentes no se toca. Imprime los ficheros cambiados y el número; sale con 3 si la rama no trae ningún D-NEW.
"""
import pathlib, re, subprocess, sys

wt = pathlib.Path(sys.argv[1]).resolve()
base = sys.argv[2] if len(sys.argv) > 2 else "main"


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(wt), *args], capture_output=True, text=True, check=True).stdout


decisions = git("show", f"{base}:docs/DECISIONS.md")
n = max(int(m) for m in re.findall(r"^### D-(\d+)", decisions, re.M)) + 1
changed = 0
for name in git("diff", "--name-only", f"{base}...HEAD").split("\n"):
    path = wt / name
    if not name or not path.is_file():
        continue
    added: set[int] = set()
    for m in re.finditer(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@", git("diff", "-U0", f"{base}...HEAD", "--", name), re.M):
        start, count = int(m.group(1)), int(m.group(2)) if m.group(2) is not None else 1
        added.update(range(start, start + count))
    try:
        lines = path.read_text().split("\n")
    except UnicodeDecodeError:
        continue
    hit = False
    for i in added:
        if i <= len(lines) and "D-NEW" in lines[i - 1]:
            lines[i - 1] = lines[i - 1].replace("D-NEW", f"D-{n}")
            hit = True
    if hit:
        path.write_text("\n".join(lines))
        changed += 1
        print(name)
print(f"D-{n}" if changed else "sin D-NEW")
sys.exit(0 if changed else 3)
