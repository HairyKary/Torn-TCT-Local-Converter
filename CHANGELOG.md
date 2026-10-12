# Changelog

## [1.4.0-beta.1] - 2026-10-12 — Mobile/PDA testing branch

- Added tap-to-convert for ordinary timestamp text on touchscreens.
- Added approximately 450 ms long-press conversion for timestamps inside links/buttons; ordinary link taps still work.
- Added a touch-friendly closable tooltip and screen-edge positioning.
- Added touch-movement and scroll cancellation to avoid interfering with scrolling.
- Suppressed emulated mouse events immediately after touch interactions to avoid duplicate tooltips.
- Added mobile-focused regression tests and Torn PDA installation guidance.
- Kept desktop hover, 24-hour formatting, automatic device time zone, and no API/network requirements.
- **Beta only:** `main` / Greasy Fork remain on stable v1.3.0 pending physical-device testing.

## [1.3.0] - 2026-10-12 — First stable desktop release

- Cleaned up the timestamp parsing, formatting, and tooltip logic.
- Validated dates before converting to avoid silently correcting invalid calendar dates.
- Improved timezone abbreviations (including EDT/EST) and DST handling.
- Improved tooltip positioning near screen edges, plus dismissal on scroll, click, and window blur.
- Recognized time values in `aria-label` attributes as well as the previously supported attributes and text.
- Prevented duplicate injected tooltips within the same page.
- Kept hover-only behavior, the 24-hour format, existing timestamp support, and zero API/network requirements.

## [1.2.0] - 2026-10-12 — Beta

- Removed persistent clocks; show the converter only when hovering over a recognized timestamp.
- Switched TCT and local displays to 24-hour time.
- Added common full-date, ISO, and time-only timestamp formats.
- Added GitHub metadata and Tampermonkey auto-update URLs.

## [1.1.0] - Prototype

- Added a draggable on-screen clock.

## [1.0.0] - Prototype

- Introduced TCT/local clock and time conversion functionality.