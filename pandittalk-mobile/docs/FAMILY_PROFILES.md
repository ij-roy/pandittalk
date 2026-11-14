# Family profiles

Issue #267. One account can keep up to 8 birth profiles (spouse, child, parent, or other) and reuse them on the free Kundli form.

Child dates are stored as given. The account 18+ date-of-birth gate does not apply to these profiles.

## API

Authenticated routes on the users controller:

- `GET /users/family-members`
- `POST /users/family-members` with `relation`, `name`, `dob` (`YYYY-MM-DD`), `timeOfBirth` (`HH:mm`), `placeOfBirth`, optional `coordinates`
- `DELETE /users/family-members/:id`

Migration `20260930190000_family_members` must be applied before these routes are used.

## App

Settings → Family profiles lists, adds, and removes profiles. On the Kundli screen, a signed-in user sees a chip per saved name; tapping it fills first name, last name, date, time, and place.
