# Torn TCT + Local Hover Converter

A small [Tampermonkey](https://www.tampermonkey.net/) userscript for [Torn](https://www.torn.com/) that converts supported Torn City Time (TCT/UTC) timestamps to your browser's local time when you hover over them.

> **Beta (v1.2.0):** Timestamp formats vary across Torn pages. This script has not yet been tested on every page; report missed or incorrectly interpreted timestamps in [Issues](https://github.com/HairyKary/Torn-TCT-Local-Converter/issues).

## Features

- **Hover-only** display: no persistent clock, toolbar, or overlay covering Torn chat.
- Shows **TCT and local time in 24-hour format** in a compact tooltip.
- Detects your time zone automatically using your browser, including daylight saving time.
- Recognizes several date/time patterns, including `20:00:00 - 12/10/26`, `12/10/26 20:00:00`, and `2026-10-12 20:00`.
- Recognizes stand-alone `HH:MM` / `HH:MM:SS` values and times explicitly marked `TCT`/`UTC`.
- **No Torn API key** and no external network requests.
- Does not change the displayed timestamp or page content.

## Installation

1. Install **Tampermonkey** in a supported desktop browser.
2. Open the script's [raw install link](https://raw.githubusercontent.com/HairyKary/Torn-TCT-Local-Converter/main/torn-tct-local-converter.user.js) (once this repository is published).
3. Choose **Install** when Tampermonkey prompts you.
4. Refresh Torn and hover over a timestamp.

Alternatively, open Tampermonkey's dashboard, create a new script, and paste the contents of [`torn-tct-local-converter.user.js`](torn-tct-local-converter.user.js).

If you previously installed an earlier copy manually, **disable or remove the old version** to prevent two copies from running simultaneously.

## Example

Hovering over `20:00:00 - 12/10/26` produces this in US Eastern time on October 12, 2026:

```text
TCT:   12 Oct 2026, 20:00 UTC
Local: 12 Oct 2026, 16:00 EDT
```

In winter, the local time adjusts automatically to EST. In other time zones the script uses that device's local setting.

## Known limitations

- When a time appears **without a date**, the script assumes *today's date in TCT (UTC)*. A time intended for tomorrow may therefore convert incorrectly if no date is displayed.
- It assumes recognized timestamps are **TCT/UTC**; timestamps actually presented in another time zone could be misinterpreted.
- Torn uses dynamic interface components, and some timestamps may not be exposed as readable text or standard HTML attributes. Please include the Torn page and a timestamp example when reporting an issue.
- The script targets the desktop browser version of Torn. Mobile apps and browser extensions have not been validated.

## Updates

The userscript header includes `@updateURL` and `@downloadURL` pointing at the **main** branch. Once the GitHub repository and script are live, Tampermonkey can check for published updates. Increase `@version` when releasing a new script revision.

## Contributing

Bug reports and suggestions are welcome through [GitHub Issues](https://github.com/HairyKary/Torn-TCT-Local-Converter/issues). Please avoid including private account or faction information in screenshots.

## License

Released under the [MIT License](LICENSE). This is a fan-made, unofficial tool and is not affiliated with Torn.