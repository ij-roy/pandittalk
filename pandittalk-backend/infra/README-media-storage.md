# PanditTalk media storage (S3 + CloudFront)

Private S3 bucket `pandittalk-media` in `ap-south-1`, fronted by CloudFront OAC for HTTPS delivery. Backend writes via IAM; clients read via CDN.

## Object key layout

```
avatars/users/{userId}.jpg      — user profile photos
avatars/pandits/{panditId}.jpg  — pandit portrait images
```

Extension is fixed to `.jpg` for predictable CDN keys; backend may transcode on upload.

## Public URL pattern

After app wiring:

```
{MEDIA_CDN_URL}/avatars/users/{userId}.jpg
{MEDIA_CDN_URL}/avatars/pandits/{panditId}.jpg
```

`MEDIA_CDN_URL` has no trailing slash (e.g. `https://d1234abcd.cloudfront.net`).

## Environment variables (Secrets Manager: `pandittalk/prod`)

| Key | Example |
|-----|---------|
| `S3_MEDIA_BUCKET` | `pandittalk-media` |
| `S3_MEDIA_REGION` | `ap-south-1` |
| `MEDIA_CDN_URL` | `https://<cloudfront-domain>` |
| `AVATAR_STORAGE` | `s3` |

## Access model

- S3: all public access blocked; no public-read ACLs.
- CloudFront OAC: bucket policy allows `s3:GetObject` only from the distribution ARN.
- Backend IAM (ECS task role `ecs-task-policy.json`): `PutObject`, `DeleteObject` on `arn:aws:s3:::pandittalk-media/*`.

## CORS

Permissive (`AllowedOrigins: *`) for future presigned PUT uploads. Tighten to app domains in Phase 5.

## Pandit portraits

Seeded pandits use **stable UUIDs** (see `PANDIT_STABLE_IDS` in `apps/user-service/prisma/pandit-seed.ts`) so S3 keys and CDN URLs survive DB resets.

### Stable ID table

| Pandit | Phone | Portrait filename |
|--------|-------|-------------------|
| Pt. Rahul Nandkumar Joshi | +918898615327 | `c40d952e-0290-4548-8472-a41ceffe8139.jpg` |
| Pt. Rahul Suresh Ghogare Joshi | +919594899347 | `5c08795d-3fc0-40c6-b596-c9080646e755.jpg` |
| Pt. Hemanshu Tirupati Joshi | +917045895918 | `233ec30a-b8a7-4343-9439-cde3e9d324d4.jpg` |
| Pt. Akshay Rajkumar Joshi | +919359611524 | `4d1d298d-8a49-40b0-93ca-85bb42a7f754.jpg` |
| Pt. Sridhar Joshi | +919015078297 | `87be82ae-8436-4299-9de3-36a61b547438.jpg` |
| Pandita Soniya Bajaj | +919592609275 | `fe08379b-84f4-4a8b-b13b-ba074c559e7b.jpg` |
| Pt. Srinath Joshi | +919810985097 | `a0d9a11d-c6c0-4a75-8d45-f8a632668b68.jpg` |
| Pt. Mahendra Joshi | +919871176764 | `9ba68d64-e817-40d4-b39f-2f9650c0550d.jpg` |

### Upload script

**Prerequisites**

- `.env` in `apps/backend` with `DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_MEDIA_BUCKET`, `S3_MEDIA_REGION`, `MEDIA_CDN_URL`.
- DB seeded (`npx prisma db seed`) so pandit rows exist with stable IDs.
- Eight JPEG portraits named `{stablePanditId}.jpg` in a local folder (convert from PNG if needed).

**Run** (from `apps/backend`):

```bash
npm run upload:pandit-portraits -- "C:/path/to/portraits"
# or
PANDIT_PORTRAITS_DIR="C:/path/to/portraits" npm run upload:pandit-portraits
```

The script uploads each file to `avatars/pandits/{panditId}.jpg` (private ACL, `Content-Type: image/jpeg`), sets `pandits.image_url` to `{MEDIA_CDN_URL}/avatars/pandits/{panditId}.jpg?v={timestamp}`, and reports unmatched files or missing portraits. Re-running is idempotent (overwrites S3 objects and refreshes cache-buster).

**Verify**

```bash
curl -I "https://d3ffeab65q7qta.cloudfront.net/avatars/pandits/b2f4e8a1-3c6d-4f9e-a1b2-c8d3e4f5a6b7.jpg"
```

Confirm `pandits.image_url` in the database and that the mobile experts list/detail show portraits instead of placeholders.
