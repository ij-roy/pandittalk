import json
import subprocess
import sys
import time

REGION = "ap-south-1"
CLUSTER = "pandittalk-cluster"
SERVICE = "pandittalk-service"
MAX_WAIT = 600
INTERVAL = 15


def run(*args):
    return subprocess.run(list(args), capture_output=True, text=True)


start = time.time()
while time.time() - start < MAX_WAIT:
    svc = run(
        "aws",
        "ecs",
        "describe-services",
        "--cluster",
        CLUSTER,
        "--services",
        SERVICE,
        "--region",
        REGION,
        "--output",
        "json",
    )
    if svc.returncode != 0:
        print(svc.stderr or svc.stdout, file=sys.stderr)
        sys.exit(1)

    s = json.loads(svc.stdout)["services"][0]
    elapsed = int(time.time() - start)
    print(
        f"[{elapsed}s] running={s['runningCount']} desired={s['desiredCount']} pending={s['pendingCount']}"
    )
    for event in s.get("events", [])[:2]:
        print("  event:", event.get("message", ""))

    tasks = run(
        "aws",
        "ecs",
        "list-tasks",
        "--cluster",
        CLUSTER,
        "--service-name",
        SERVICE,
        "--region",
        REGION,
        "--output",
        "json",
    )
    arns = json.loads(tasks.stdout).get("taskArns", [])
    if not arns:
        time.sleep(INTERVAL)
        continue

    desc = run(
        "aws",
        "ecs",
        "describe-tasks",
        "--cluster",
        CLUSTER,
        "--tasks",
        *arns,
        "--region",
        REGION,
        "--output",
        "json",
    )
    task = json.loads(desc.stdout)["tasks"][0]
    task_arn = task["taskArn"]
    last = task["lastStatus"]
    health = task.get("healthStatus", "UNKNOWN")
    containers = task.get("containers", [])
    print(f"  task={last} health={health}")
    for c in containers:
        print(
            f"    container {c['name']}: {c.get('lastStatus')} reason={c.get('reason', '')}"
        )

    if last == "STOPPED":
        print("TASK STOPPED")
        print(json.dumps(task, indent=2))
        sys.exit(2)

    if last == "RUNNING":
        all_running = all(c.get("lastStatus") == "RUNNING" for c in containers)
        healthy = health in ("HEALTHY", "UNKNOWN")
        if all_running and healthy:
            eni = None
            for att in task.get("attachments", []):
                for detail in att.get("details", []):
                    if detail.get("name") == "networkInterfaceId":
                        eni = detail.get("value")
            public_ip = None
            if eni:
                eni_out = run(
                    "aws",
                    "ec2",
                    "describe-network-interfaces",
                    "--network-interface-ids",
                    eni,
                    "--region",
                    REGION,
                    "--output",
                    "json",
                )
                if eni_out.returncode == 0:
                    ni = json.loads(eni_out.stdout)["NetworkInterfaces"][0]
                    public_ip = (ni.get("Association") or {}).get("PublicIp")
            print("SUCCESS")
            print("TASK_ARN", task_arn)
            print("PUBLIC_IP", public_ip)
            sys.exit(0)

    time.sleep(INTERVAL)

print("TIMEOUT waiting for RUNNING")
sys.exit(1)
