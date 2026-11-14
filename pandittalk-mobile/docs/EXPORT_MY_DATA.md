# Export my data — GitHub #266

## Behavior

Settings → Account → **Export my data** confirms, then `POST /support/requests` with
`category: data_export`. Ops fulfills manually (email package) until a full export
pipeline exists.

## Files

- `apps/mobile/app/settings/index.tsx` — UI + confirm/success alerts
- `apps/mobile/lib/supportApi.ts` — `requestDataExport`

## Ops

```sql
SELECT id, user_id, message, status, created_at
FROM support_requests
WHERE category = 'data_export'
ORDER BY created_at DESC;
```
