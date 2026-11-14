# UGC safety — report / block / support contact — GitHub #317

## Guideline 1.2 (User-Generated Content)

Chat and reviews are UGC-like. Required: report, block, and a published contact.

## Shipped

| Surface | Behavior |
| --- | --- |
| Chat session flag menu | Report → `POST /support/requests` (`report_user`); Block → `POST /users/blocks` + ticket |
| Experts list | Filters server-synced blocked pandit IDs |
| Settings → Support | **Contact Us** shows `admininfo@pandittalk.com` on-screen (mailto still works) |

## Backend

- `user_pandit_blocks` table + `GET/POST/DELETE /users/blocks`
- Reports remain `support_requests` (`report_user` / `block_user`) — ops queue via DB/admin

## Ops query (manual queue)

```sql
SELECT id, user_id, category, message, status, created_at
FROM support_requests
WHERE category IN ('report_user', 'block_user')
ORDER BY created_at DESC
LIMIT 100;
```

## Out of scope (see #45)

- Per-message / per-review report UI
- Admin dashboard SLA clocks / appeals
- Audio/video session safety chrome
