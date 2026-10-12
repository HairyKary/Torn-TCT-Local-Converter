# Torn TCT + Local Hover Converter

**v1.3.0 — First stable desktop release**

A lightweight, unofficial [Tampermonkey](https://www.tampermonkey.net/) userscript for [Torn](https://www.torn.com/) that shows the **local equivalent of TCT (UTC) timestamps when you hover over them**. No permanent clocks, extra controls, API keys, or network requests.

## Features

- Shows **TCT and local time in 24-hour format** only when hovering over a recognized timestamp.
- Automatically uses the **device/browser's configured time zone**, including daylight saving time (EDT/EST where applicable).
- Understands Torn-style date/time formats such as `20:00:00 - 12/10/26` and `12/10/26 20:00`, ISO timestamps, and time-only `20:00` / `20:00 TCT`.
- Detects timestamps in visible text and common tooltip/date attributes, including `<time datetime="...">`.
- Does not change Torn's existing page content or prevent normal mouse interactions.
- No Torn API key, special userscript privileges, tracking, or external network calls.

## Install on desktop

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or another compatible userscript manager).
2. Open [**Install the current script**](https://raw.githubusercontent.com/HairyKary/Torn-TCT-Local-Converter/main/torn-tct-local-converter.user.js).
3. Approve the installation and refresh Torn.
4. Hover over a time or date/time on Torn.

If you have an older manually installed copy, **disable or delete it first** to avoid duplicate tooltips. The published script has `@updateURL` and `@downloadURL` set to this repository's `main` branch. Versioned updates are picked up during your userscript manager's update checks.

## Example

Hovering over `20:00:00 - 12/10/26` in US Eastern time on October 12, 2026:

```text
TCT:   12 Oct 2026, 20:00 UTC
Local: 12 Oct 2026, 16:00 EDT
```

A full timestamp can correctly produce a **different local calendar date**. For example, `01:00 TCT` on October 12 is `21:00 EDT` on October 11.

## Time zones and dates

- TCT is UTC. The converter relies on the browser's **configured time zone**, not your IP address or Torn account settings.
- If you travel or change the device's time zone, reload Torn to refresh the time-zone setting.
- When hovering over a **time without a date**, the script assumes today's date **in UTC/TCT** and shows a warning. An event intended for tomorrow cannot be inferred from `20:00` alone.
- Recognized full timestamps are interpreted as TCT/UTC unless an ISO timestamp carries an explicit numeric offset.
- Dates in Torn-style `DD/MM/YY` and `DD/MM/YYYY` formats use **day/month/year**, not month/day/year.

## Compatibility

- **Desktop browser with Tampermonkey:** stable, with user testing on Torn pages and automated parser / UI checks.
- **Torn PDA, iOS, Android, touchscreen:** not yet validated. Torn PDA supports custom scripts, but this version currently uses mouse hover and does not implement tap/long-press. A touch-friendly implementation is planned; please do not assume the desktop script works in PDA.

## Troubleshooting and reporting issues

If a time doesn't convert or converts incorrectly, open a [GitHub issue](https://github.com/HairyKary/Torn-TCT-Local-Converter/issues) with the Torn page, the exact timestamp text, your device's time zone, and the expected conversion. Avoid including API keys, private account information, or private faction data.

## Updates and contribution

The script is maintained on `main`, with a version bump and [changelog](CHANGELOG.md) for each published release. Contributions and bug reports are welcome. See the [MIT License](LICENSE).

This is an unofficial fan-made tool and is not affiliated with Torn.