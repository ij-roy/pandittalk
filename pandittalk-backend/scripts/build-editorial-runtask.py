"""Build ASCII-only ECS RunTask input JSON for the editorial import."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "upsert-editorial-articles-ecs-job.cjs"
OUT = ROOT / "scripts" / "editorial-articles-runtask.json"


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: build-editorial-runtask.py <articles-url>")
    articles_url = sys.argv[1]
    script = SCRIPT.read_text(encoding="utf-8")
    net_raw = subprocess.check_output(
        [
            "aws",
            "ecs",
            "describe-services",
            "--cluster",
            "pandittalk-cluster",
            "--services",
            "pandittalk-service",
            "--region",
            "ap-south-1",
            "--query",
            "services[0].networkConfiguration",
            "--output",
            "json",
        ],
        text=True,
    )
    net = json.loads(net_raw)
    payload = {
        "cluster": "pandittalk-cluster",
        "taskDefinition": "pandittalk-user-service:11",
        "launchType": "FARGATE",
        "networkConfiguration": net,
        "overrides": {
            "containerOverrides": [
                {
                    "name": "pandittalk-user-service",
                    "command": ["node", "-e", script],
                    "environment": [
                        {"name": "EDITORIAL_ARTICLES_URL", "value": articles_url}
                    ],
                }
            ]
        },
    }
    OUT.write_text(
        json.dumps(payload, ensure_ascii=True, separators=(",", ":")),
        encoding="ascii",
    )
    print(f"wrote {OUT} bytes={OUT.stat().st_size}")


if __name__ == "__main__":
    main()
