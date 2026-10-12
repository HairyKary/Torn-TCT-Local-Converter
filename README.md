# Torn TCT + Local Hover Converter

**v1.4.0-beta.1 — Mobile / Torn PDA test build (not yet released to Greasy Fork)**

A lightweight, unofficial userscript for [Torn](https://www.torn.com/) that converts Torn City Time (TCT/UTC) timestamps to the device's local time. No permanent clocks, API key, external libraries, or network requests.

> **Important:** This development branch is for mobile testing. The [stable desktop version (v1.3.0)](https://github.com/HairyKary/Torn-TCT-Local-Converter/blob/main/README.md) remains on `main` and continues to be distributed through [Greasy Fork](https://greasyfork.org/en/scripts/599932-torn-tct-local-hover-converter). Do not merge this branch until Torn PDA / mobile testing succeeds.

## How to use

| Device / situation | Action |
| --- | --- |
| Desktop browser | Hover over a recognized timestamp. |
| Mobile: plain timestamp text | Tap the timestamp to show TCT and local time. |
| Mobile: timestamp in a link or button | Press and hold for about **0.45 seconds**; a quick tap still follows the link. |
| Mobile: close converter | Tap **×**, tap elsewhere, or scroll. |

Times are in **24-hour format**, based on the device/browser's time zone (including applicable daylight saving time). Full timestamps can convert to the preceding or following local calendar day.

## Install the mobile beta in Torn PDA

1. In Torn PDA, open **Settings → Advanced Browser Settings**.
2. Enable **Custom User Scripts** and choose **Manage Scripts**.
3. Add a new script and paste the **remote URL** below; fetch/load the script and save it. Depending on your Torn PDA version, a direct `.user.js` URL may also prompt installation.
4. Open a Torn page inside the PDA browser and try a tap on a timestamp.

Beta script URL:

```text
https://raw.githubusercontent.com/HairyKary/Torn-TCT-Local-Converter/feature/pda-mobile-touch/torn-tct-local-converter.user.js
```

Do **not** install both the stable and mobile beta scripts in the same Torn PDA script manager: disable the stable copy while testing to avoid duplicate tooltips. This beta uses branch-specific `@updateURL`/`@downloadURL` metadata, so it does not automatically publish to Greasy Fork.

If Torn PDA refuses the remote URL, copy the beta script from the branch into PDA's script editor instead. That fallback may not provide remote update notifications.

## Install the beta in a mobile browser

Use a mobile userscript manager compatible with your mobile browser, then install the same branch URL. Browser extension and userscript support differs by platform; we have not verified every iOS/Android browser.

## Existing parsing support

- `20:00:00 - 12/10/26` (Torn day/month/year)
- `12/10/26 20:00`
- `2026-10-12 20:00` and ISO timestamps with explicit UTC offsets
- Bare `20:00`, `20:00 TCT`, and `TCT 20:00`
- Timestamps in text, `title`, `aria-label`, and `datetime` attributes

For a time **without a date**, the script assumes **today in UTC/TCT** and clearly notes that assumption. Ambiguous dates or times already shown in another time zone might convert incorrectly.

## What to test on mobile

- Faction pages, forums, war screens, and organized crime pages.
- Plain timestamps: quick tap shows the popup, × and tapping elsewhere close it.
- Links containing timestamps: quick tap continues navigating; long-press shows the conversion.
- Scroll gestures don't accidentally open the popup.
- Late-night timestamps show the correct **local date** as well as the hour.

Please report missing timestamps or unexpected interactions to [GitHub issue #1](https://github.com/HairyKary/Torn-TCT-Local-Converter/issues/1). Include your platform (Android/iOS), Torn PDA version if available, the page type, and a safe example timestamp. **Never share Torn API keys.**

## Development and testing

The beta deliberately uses only standard web APIs (`touchstart`, `touchmove`, `touchend`, `contextmenu`, and DOM APIs) and does not depend on Tampermonkey-specific `GM_*` methods. A zero-dependency Node-based interaction test is included:

```bash
TZ=America/New_York node tests/test-mobile.js
node --check torn-tct-local-converter.user.js
```

Local tests can verify event handling but do **not** substitute for testing in Torn PDA's actual webview. See [CHANGELOG.md](CHANGELOG.md). Released under the [MIT License](LICENSE). Not affiliated with Torn or Torn PDA.