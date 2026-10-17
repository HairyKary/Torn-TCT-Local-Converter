# Changelog

## [1.4.3] - 2026-10-17 — Chain countdown detection patch

- Ignore chain countdown timers instead of converting their remaining minutes and seconds as UTC.
- Detect chain timer labels, counters next to chain totals, and dedicated `bar-timeleft` timer elements.
- Preserve dated and explicit TCT timestamps, including scheduled chain events.
- Add regression cases for desktop hover and Torn PDA/mobile chain timer interactions.

## [1.4.2] - 2026-10-17 — Resource timer detection patch

- Skip energy, nerve, happiness, and life HUD countdowns even if formatted as HH:MM or HH:MM:SS.
- Skip tooltip regeneration durations (for example, `Full energy in 04:53:13`) and attribute-only timers inside resource rows.
- Preserve normal dated and TCT-labeled timestamps, travel landing time detection, and desktop/mobile behavior.
- Add regression fixtures for resource bars and timers; correct a duplicated-text issue in the test DOM.

## [1.4.1] - 2026-10-12 — Flight screen countdown detection patch

- Ignore travel/flight countdown durations such as `Remaining Flight Time - 03:14:38` instead of interpreting them as TCT clock times.
- Recognize `Landing at 23:45:50` as a TCT arrival clock and show its equivalent local time.
- When the landing time has no explicit date, use its next occurrence in TCT (including next-day rollovers) and label the inferred date.
- Avoid converting a nearby countdown when multiple clock values share a flight panel.
- Added regression tests for separate countdown/landing elements, inline labels, and midnight crossing; retain desktop and Torn PDA touch support.

## [1.4.0] - 2026-10-12 — Stable desktop and mobile/Torn PDA release

- Promoted the tested v1.4.0 mobile beta to the stable release, with iPhone Torn PDA testing reported successful.
- Retained familiar desktop hover behavior while adding mobile tap conversion and long-press conversion for linked timestamps.
- Added a closable touch tooltip, scroll/movement cancellation, and safeguards against synthetic mouse events after touch.
- Preserved 24-hour output, device-local time zone/DST conversion, and no API key or network access.
- Restored the regular script name and `main`-branch automatic update URLs for GitHub and Greasy Fork distribution.
- Added desktop and mobile installation instructions and included Node-based regression tests.
- Android Torn PDA remains unverified on a physical device; community testing is welcome.

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