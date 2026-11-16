# Backend deployment (ECS Fargate)

Production backend deploys via GitHub Actions ([`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml)). The workflow builds the `pandittalk-backend` image, runs Prisma migrations as a one-off ECS task, rolls the service, and verifies the public health and booking-catalogue routes.
**No static AWS access keys in GitHub.** Authentication uses OIDC → `pandittalk-github-deploy-role`.

## Architecture

1. Push to `main` under `pandittalk-backend/**` (or manual `workflow_dispatch` from `main`)
2. OIDC assumes `pandittalk-github-deploy-role` for `ij-roy/pandittalk`
3. Build Docker image → push to ECR (`git` SHA tag + `latest`)
4. Register ECS task definition from [`infra/task-def.json`](infra/task-def.json) (image injected at deploy time)
5. **Run `prisma migrate deploy`** as a one-off Fargate task (same VPC subnets/SG as `pandittalk-service`)
6. Fail deploy if migration exit code ≠ 0
7. `update-service` with new task definition revision
8. [`infra/poll-ecs-task.py`](infra/poll-ecs-task.py) waits until service is RUNNING/healthy

RDS is in-VPC; migrations cannot run from the GitHub runner directly.

## One-time AWS setup

Run these once from an admin principal (break-glass). **Do not use `pandittalk-admin` as the CI role.**

### 1. Create GitHub OIDC provider

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab07f30609f7cf8dc69815dbbe71
```

### 2. Create deploy role

```bash
aws iam create-role \
  --role-name pandittalk-github-deploy-role \
  --assume-role-policy-document file://pandittalk-backend/infra/github-deploy-trust-policy.json \
  --description "GitHub Actions OIDC deploy role for PanditTalk backend (ECR + ECS)"
```

### 3. Attach deploy permissions policy

```bash
aws iam put-role-policy \
  --role-name pandittalk-github-deploy-role \
  --policy-name pandittalk-github-deploy \
  --policy-document file://pandittalk-backend/infra/github-deploy-policy.json
```

### 4. Verify

```bash
aws iam get-role --role-name pandittalk-github-deploy-role
aws iam get-role-policy --role-name pandittalk-github-deploy-role --policy-name pandittalk-github-deploy
```

No GitHub secrets required for AWS. The role ARN is referenced directly in the workflow.

## IAM actions (exact list)

### Trust ([`github-deploy-trust-policy.json`](infra/github-deploy-trust-policy.json))

| Principal | Action | Condition |
|-----------|--------|-----------|
| `arn:aws:iam::576557633000:oidc-provider/token.actions.githubusercontent.com` | `sts:AssumeRoleWithWebIdentity` | `aud` = `sts.amazonaws.com`; `sub` = `repo:ij-roy/pandittalk:ref:refs/heads/main` |

### Permissions ([`github-deploy-policy.json`](infra/github-deploy-policy.json))

| Sid | Actions | Resource |
|-----|---------|----------|
| `ECRAuth` | `ecr:GetAuthorizationToken` | `*` (required by ECR) |
| `ECRPush` | `ecr:BatchCheckLayerAvailability`, `ecr:GetDownloadUrlForLayer`, `ecr:BatchGetImage`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, `ecr:DescribeImages`, `ecr:DescribeRepositories` | `arn:aws:ecr:ap-south-1:576557633000:repository/pandittalk-user-service` |
| `ECSRegisterTaskDef` | `ecs:RegisterTaskDefinition`, `ecs:DescribeTaskDefinition` | `*` (AWS API requirement for register) |
| `ECSClusterOps` | `ecs:UpdateService`, `ecs:DescribeServices` | `arn:aws:ecs:ap-south-1:576557633000:cluster/pandittalk-cluster`, `arn:aws:ecs:ap-south-1:576557633000:service/pandittalk-cluster/pandittalk-service` |
| `ECSRunTask` | `ecs:RunTask` | `arn:aws:ecs:ap-south-1:576557633000:cluster/pandittalk-cluster`, `arn:aws:ecs:ap-south-1:576557633000:task-definition/pandittalk-user-service:*` (AWS requires both cluster and task-definition ARNs) |
| `ECSDescribeTasks` | `ecs:DescribeTasks`, `ecs:ListTasks` | `*` (task ARNs are dynamic; required for migration wait + `poll-ecs-task.py`) |
| `PassRoleToECS` | `iam:PassRole` | `arn:aws:iam::576557633000:role/pandittalk-ecs-execution-role`, `arn:aws:iam::576557633000:role/pandittalk-ecs-task-role` with `iam:PassedToService` = `ecs-tasks.amazonaws.com` |
| `PollScriptENI` | `ec2:DescribeNetworkInterfaces` | `*` (used by `poll-ecs-task.py`) |
| `MigrationLogs` | `logs:GetLogEvents`, `logs:DescribeLogStreams` | `arn:aws:logs:ap-south-1:576557633000:log-group:/ecs/pandittalk-user-service:*` |

**Explicitly excluded:** broad `iam:*`, `secretsmanager:*`, `rds:*`, `s3:*`, use of `pandittalk-admin`, and any `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in GitHub.

## Source of truth

- Task definition template: [`infra/task-def.json`](infra/task-def.json) (secrets, roles, health check, log config)
- Image tag injected at deploy: `576557633000.dkr.ecr.ap-south-1.amazonaws.com/pandittalk-user-service:<git-sha>`
- Network for migration RunTask: read live from `pandittalk-service` (`describe-services`) — no drift if subnets change

## Manual deploy

Use GitHub Actions → **Deploy backend (ECS)** → `workflow_dispatch` (must run from `main` branch for OIDC).

## Rollback

1. Find previous image tag / task definition revision in ECR or ECS console
2. Re-run workflow from the known-good commit SHA on `main`, **or**
3. `aws ecs update-service --cluster pandittalk-cluster --service pandittalk-service --task-definition pandittalk-user-service:<N>`

Migrations are idempotent; re-running on an already-migrated DB is safe.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| OIDC assume role fails | OIDC provider exists; trust policy `sub` matches `main`; workflow has `id-token: write`; workflow runs from `main` |
| Migration exit ≠ 0 | CloudWatch `/ecs/pandittalk-user-service` for the RunTask stream; verify `DATABASE_URL` secret |
| Service never stabilizes | Run `python3 infra/poll-ecs-task.py` locally with admin creds; check target group health |
| CORS regression | Ensure `ALLOWED_ORIGINS` remains in `task-def.json` secrets list |
