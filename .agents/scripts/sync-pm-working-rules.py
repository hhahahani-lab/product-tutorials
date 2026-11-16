#!/usr/bin/env python3
"""Check or synchronize the nine distributable PM working-rules copies."""

import argparse
from pathlib import Path


SKILLS = (
    "pm-analyze-prd", "pm-competitor", "pm-prototype",
    "pm-review-changes", "pm-knowledge", "pm-policy-calc",
    "pm-ux-copy", "pm-tracking", "pm-data-analysis",
)
NOTICE = (
    "<!-- 自动同步副本：本工作区维护源为 .agents/pm-working-rules.md；"
    "请勿单独修改。独立安装此 Skill 时可直接使用本副本。 -->\n\n"
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Update all copies; default is read-only checking")
    args = parser.parse_args()
    agents = Path(__file__).resolve().parent.parent
    expected = NOTICE + (agents / "pm-working-rules.md").read_text(encoding="utf-8")
    targets = [agents / "skills" / name / "references/working-rules.md" for name in SKILLS]
    missing = [p for p in targets if not p.is_file()]
    if missing:
        for path in missing:
            print(f"Missing: {path}")
        return 1
    changed = [p for p in targets if p.read_text(encoding="utf-8") != expected]
    if args.write:
        for path in changed:
            path.write_text(expected, encoding="utf-8")
        print(f"Synchronized {len(changed)} of {len(targets)} copies.")
        return 0
    for path in changed:
        print(f"Out of sync: {path}")
    if not changed:
        print(f"All {len(targets)} copies match the shared source.")
    return int(bool(changed))


if __name__ == "__main__":
    raise SystemExit(main())
