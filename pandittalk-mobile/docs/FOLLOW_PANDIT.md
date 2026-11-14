# Follow a pandit

Issue #247: there was no way to keep a pandit for a later visit.

A signed-in user can follow from the pandit profile. The heart is filled while they follow that pandit. The same account can open Experts and choose Following to see those pandits again. Search still narrows that list.

Follows are stored in `pandit_follows` (`user_id`, `pandit_id`). Apply migration `20260930180000_pandit_follows` before deploy.

- `GET /experts/following`
- `GET /experts/:id/follow`
- `PUT /experts/:id/follow`
- `DELETE /experts/:id/follow`

Tracks #247.
