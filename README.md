# Torn TCT + Local Hover Converter

**v1.4.2 — Stable desktop and mobile/Torn PDA release**

A lightweight, unofficial userscript for [Torn](https://www.torn.com/) that displays Torn City Time (TCT / UTC) alongside your device's local time only when you interact with a timestamp. No permanent clock, API key, external libraries, or network requests.

## Features

- **Desktop:** hover over a recognized timestamp.
- **Mobile / Torn PDA:** tap ordinary timestamp text, or **long-press a linked/button timestamp for about 0.45 seconds**. Quick taps on links continue navigating normally.
- The compact popup shows **TCT and device-local time in 24-hour format**, with automatic daylight saving time adjustments, and never changes the original page content.
- Close a mobile popup using **×**, by tapping elsewhere, or by scrolling. Movement cancels an unfinished long press.
- Supports time-only values, Torn-style dates, ISO timestamps, and common tooltip attributes, including `datetime`, `title`, and `aria-label`.
- **Resource HUD:** does not convert energy, nerve, happiness, or life regeneration countdowns as clock times.
- **Torn flight screens:** ignores countdown durations (such as `Remaining Flight Time - 03:14:38`) but converts actual landing clock times (such as `Landing at 23:45:50`) to your device time.

## Install on desktop

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or a compatible userscript manager).
2. [Install from Greasy Fork](https://greasyfork.org/en/scripts/599932-torn-tct-local-hover-converter) or [install the script from GitHub](https://raw.githubusercontent.com/HairyKary/Torn-TCT-Local-Converter/main/torn-tct-local-converter.user.js).
3. Refresh Torn and hover over a timestamp.

Disable or remove previously installed copies before adding a new one to avoid two copies running simultaneously. A script installed from GitHub uses `main` for its updates; Greasy Fork installations use Greasy Fork's update process.

## Install in Torn PDA on iPhone or Android

1. In Torn PDA, open **Settings → Advanced Browser Settings**.
2. Enable **Custom User Scripts** and open **Manage Scripts**. Menus can differ by Torn PDA version.
3. Add the script using the **stable GitHub source URL** below and save it. If your version of PDA does not load remote URLs, paste the contents of the `.user.js` file into the script editor.
4. Open Torn inside PDA and tap a regular timestamp or press and hold a linked one.

Stable source:

```text
https://raw.githubusercontent.com/HairyKary/Torn-TCT-Local-Converter/main/torn-tct-local-converter.user.js
```

**If you installed `v1.4.0-beta.1` from `feature/pda-mobile-touch`:** replace that beta script's remote source with the stable `main` URL above (or disable/delete the beta and install the stable version). Otherwise PDA could stay pinned to the old beta branch.

The iPhone/Torn PDA beta has been reported working by the project maintainer. **Android/Torn PDA has not yet been confirmed on a physical device**; feedback is welcome.

## Example

For `20:00:00 - 12/10/26` viewed on a device using US Eastern Time on October 12, 2026:

```text
TCT:   12 Oct 2026, 20:00 UTC
Local: 12 Oct 2026, 16:00 EDT
```

A full timestamp near midnight may convert to a different local calendar date. The converter reads your device/browser's configured time zone (not your Torn account or IP address); reload Torn after changing your device's time zone.

## Supported formats and limitations

- Examples: `20:00:00 - 12/10/26`, `12/10/26 20:00`, `2026-10-12 20:00`, ISO timestamps with explicit offsets, `20:00`, `20:00 TCT`, and `TCT 20:00`.
- Torn-style dates are interpreted as **DD/MM/YY** or **DD/MM/YYYY**, not MM/DD.
- Bare clock times without a date are assumed to be **today in UTC/TCT** and are marked with a note. If the time actually refers to tomorrow, conversion may be wrong because the date was missing.
- **Flight landing clocks without a date** are treated as the **next occurrence of that time in UTC/TCT** (within the next 24 hours), with a note that the date is inferred. Countdown durations are *not* UTC clock times, even when written as `HH:MM:SS`.
- The script assumes unmarked timestamps are TCT/UTC; timestamps explicitly in another time zone might not convert as expected.
- It cannot recognize every text format or timestamp rendered inside inaccessible page elements.

## Feedback / testing

Please share issues via [GitHub Issues](https://github.com/HairyKary/Torn-TCT-Local-Converter/issues), especially from Android. Include device/OS, Torn PDA version, page type, timestamp sample, and steps to reproduce. **Do not share Torn API keys or other private details.**

The included Node regression suite can be run with:

```bash
TZ=America/New_York node tests/test-mobile.js
node --check torn-tct-local-converter.user.js
```

These checks do not replace testing in the actual browser or Torn PDA webview. This is a community-made, unofficial project, not affiliated with Torn or Torn PDA. Released under the [MIT License](LICENSE).