# Duplicate stack titles — GitHub #72

## Problem

Tools screens showed the native stack header title **and** an in-screen H1 with the
same (or conflicting) text — especially visible on iOS.

## Fix

Keep the tools Stack header (back + wallet) as the single title source:

- Removed in-screen `styles.title` H1s from horoscope, compatibility, palm, tarot,
  monthly-horoscope entry/report phases
- Aligned stack titles: Palm / Tarot / Monthly no longer flip to “Astrology Tools”

Subtitles remain for context under the nav bar.

## Verify

- Open Daily Horoscope / Compatibility / Palm / Tarot / Monthly → one title only
- Back chevron and wallet header actions still present
