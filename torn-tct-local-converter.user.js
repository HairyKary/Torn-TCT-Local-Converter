// ==UserScript==
// @name         Torn TCT + Local Hover Converter
// @namespace    https://github.com/HairyKary/Torn-TCT-Local-Converter
// @version      1.3.0
// @author       HairyKary
// @license      MIT
// @description  Convert Torn timestamps to your device's local time on hover (24-hour format).
// @homepageURL  https://github.com/HairyKary/Torn-TCT-Local-Converter
// @supportURL   https://github.com/HairyKary/Torn-TCT-Local-Converter/issues
// @updateURL    https://raw.githubusercontent.com/HairyKary/Torn-TCT-Local-Converter/main/torn-tct-local-converter.user.js
// @downloadURL  https://raw.githubusercontent.com/HairyKary/Torn-TCT-Local-Converter/main/torn-tct-local-converter.user.js
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const TOOLTIP_ID = 'tct-local-hover-tooltip';
  const STYLE_ID = 'tct-local-hover-style';
  const TIME = '([01]?\\d|2[0-3]):([0-5]\\d)(?::([0-5]\\d))?';
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Prevent duplicate overlays if a userscript manager injects more than once.
  if (document.getElementById(TOOLTIP_ID)) return;

  // A separate zone formatter gives reliable EDT/EST names in en-US browsers.
  function makeFormatter(timeZone) {
    const stamp = new Intl.DateTimeFormat('en-GB', {
      timeZone, day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    const zoneName = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' });
    return date => {
      const abbreviation = zoneName.formatToParts(date)
        .find(part => part.type === 'timeZoneName')?.value || timeZone;
      return `${stamp.format(date)} ${abbreviation}`;
    };
  }
  const formatTCT = makeFormatter('UTC');
  const formatLocal = makeFormatter(localZone);

  // Validate explicitly: Date.UTC otherwise silently normalizes invalid days.
  function utcDate(year, month, day, hour, minute, second = 0) {
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day && date.getUTCHours() === hour &&
      date.getUTCMinutes() === minute && date.getUTCSeconds() === second ? date : null;
  }

  function yearOf(value) {
    return String(value).length === 2 ? 2000 + Number(value) : Number(value);
  }

  function parseTimestamp(value, isTimeElement = false) {
    const text = String(value ?? '').trim().replace(/\s+/g, ' ');
    if (!text || text.length > 180) return null;
    let match;
    let date;

    // ISO 8601 with explicit UTC zone or offset. Preserve its actual instant.
    match = text.match(/\b(20\d{2})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)(?!\w)/i);
    if (match && utcDate(+match[1], +match[2], +match[3], +match[4], +match[5], +(match[6] || 0))) {
      date = new Date(match[0]);
      if (Number.isFinite(date.getTime())) return { date, inferred: false };
    }

    // YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM, interpreted as TCT (UTC).
    match = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})[ T]([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/);
    if (match) {
      date = utcDate(+match[1], +match[2], +match[3], +match[4], +match[5], +(match[6] || 0));
      if (date) return { date, inferred: false };
    }

    // Torn's HH:MM:SS - DD/MM/YY (or DD/MM/YYYY).
    match = text.match(new RegExp('\\b' + TIME + '\\s*(?:[-–—,]\\s*|\\s+)(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4}|\\d{2})\\b'));
    if (match) {
      date = utcDate(yearOf(match[6]), +match[5], +match[4], +match[1], +match[2], +(match[3] || 0));
      if (date) return { date, inferred: false };
    }

    // DD/MM/YY HH:MM:SS (or DD/MM/YYYY HH:MM).
    match = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4}|\d{2})[,\s]+([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/);
    if (match) {
      date = utcDate(yearOf(match[3]), +match[2], +match[1], +match[4], +match[5], +(match[6] || 0));
      if (date) return { date, inferred: false };
    }

    // Bare clock times are assumed to mean TODAY in TCT; warn in tooltip.
    match = text.match(new RegExp('^' + TIME + '\\s*(?:TCT|UTC)?$', 'i'));
    if (!match && (isTimeElement || /\b(?:TCT|UTC)\b/i.test(text))) {
      match = text.match(new RegExp('\\b' + TIME + '\\s*(?:TCT|UTC)\\b', 'i')) ||
        text.match(new RegExp('\\b(?:TCT|UTC)\\s*[:–-]?\\s*' + TIME + '\\b', 'i'));
    }
    if (match) {
      const now = new Date();
      date = utcDate(now.getUTCFullYear(), now.getUTCMonth() + 1,
        now.getUTCDate(), +match[1], +match[2], +(match[3] || 0));
      if (date) return { date, inferred: true };
    }
    return null;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${TOOLTIP_ID} {
      position: fixed;
      z-index: 2147483640;
      display: none;
      pointer-events: none;
      box-sizing: border-box;
      width: max-content;
      max-width: min(320px, calc(100vw - 20px));
      padding: 8px 10px;
      border: 1px solid #596575;
      border-radius: 7px;
      background: #171b22;
      color: #eef1f5;
      box-shadow: 0 4px 18px #0008;
      font: 12px/1.5 Arial, sans-serif;
      overflow-wrap: anywhere;
    }
    #${TOOLTIP_ID} .tct-local-line { color: #b4f2c1; font-weight: 700; }
    #${TOOLTIP_ID} .tct-local-note { color: #b8bdc6; font-size: 11px; }
  `;
  (document.head || document.documentElement).appendChild(style);

  const tooltip = document.createElement('div');
  tooltip.id = TOOLTIP_ID;
  tooltip.setAttribute('role', 'tooltip');
  const tctLine = document.createElement('div');
  const localLine = document.createElement('div');
  localLine.className = 'tct-local-line';
  const noteLine = document.createElement('div');
  noteLine.className = 'tct-local-note';
  tooltip.append(tctLine, localLine, noteLine);
  document.body.appendChild(tooltip);

  function hoveredTimestamp(element) {
    if (element.closest(`#${TOOLTIP_ID}, input, textarea, select, [contenteditable]`)) return null;

    for (let node = element, depth = 0;
      node && node !== document.body && depth < 4;
      node = node.parentElement, depth++) {
      const directText = Array.from(node.childNodes)
        .filter(child => child.nodeType === Node.TEXT_NODE)
        .map(child => child.textContent).join(' ').trim();
      const candidates = [
        node.getAttribute('datetime'), node.getAttribute('data-original-title'),
        node.getAttribute('title'), node.getAttribute('aria-label'), directText
      ];
      if ((node.textContent || '').length < 160) candidates.push(node.textContent);

      for (const candidate of candidates) {
        const parsed = parseTimestamp(candidate, node.tagName === 'TIME');
        if (parsed) return parsed;
      }
    }
    return null;
  }

  function hide() { tooltip.style.display = 'none'; }

  function position(event) {
    const pad = 10;
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const left = Math.max(pad, Math.min(event.clientX + 15, window.innerWidth - width - pad));
    const below = event.clientY + 18;
    const top = below + height <= window.innerHeight - pad
      ? below : Math.max(pad, event.clientY - height - 12);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(pad, Math.min(top, window.innerHeight - height - pad))}px`;
  }

  document.addEventListener('mouseover', event => {
    if (!(event.target instanceof Element)) return hide();
    const matched = hoveredTimestamp(event.target);
    if (!matched) return hide();

    tctLine.textContent = `TCT: ${formatTCT(matched.date)}`;
    localLine.textContent = `Local: ${formatLocal(matched.date)}`;
    noteLine.textContent = matched.inferred ? 'No date shown; assuming today in TCT.' : '';
    noteLine.style.display = matched.inferred ? 'block' : 'none';
    tooltip.style.display = 'block';
    position(event);
  }, true);

  document.addEventListener('mousemove', event => {
    if (tooltip.style.display === 'block') position(event);
  }, { passive: true });
  document.addEventListener('mouseout', event => {
    if (!event.relatedTarget) hide();
  }, true);
  document.addEventListener('scroll', hide, true);
  document.addEventListener('mousedown', hide, true);
  window.addEventListener('blur', hide);
})();