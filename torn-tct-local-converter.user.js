// ==UserScript==
// @name         Torn TCT + Local Hover Converter
// @namespace    https://github.com/HairyKary/Torn-TCT-Local-Converter
// @version      1.2.0
// @author       HairyKary
// @license      MIT
// @homepageURL  https://github.com/HairyKary/Torn-TCT-Local-Converter
// @supportURL   https://github.com/HairyKary/Torn-TCT-Local-Converter/issues
// @updateURL    https://raw.githubusercontent.com/HairyKary/Torn-TCT-Local-Converter/main/torn-tct-local-converter.user.js
// @downloadURL  https://raw.githubusercontent.com/HairyKary/Torn-TCT-Local-Converter/main/torn-tct-local-converter.user.js
// @description  Hover over Torn timestamps to see local time in 24-hour format. No permanent on-screen clocks.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // Torn City Time is UTC. The browser handles your local timezone and DST.
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const formatIn = timeZone => new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    timeZoneName: 'short'
  });
  const formatTCT = formatIn('UTC');
  const formatLocal = formatIn(zone);

  const style = document.createElement('style');
  style.textContent = `
    #tct-local-hover-tooltip {
      position: fixed; z-index: 2147483640; display: none;
      pointer-events: none; max-width: min(320px, calc(100vw - 20px));
      padding: 8px 10px; border: 1px solid #596575; border-radius: 7px;
      background: #171b22; color: #eef1f5; box-shadow: 0 4px 18px #0008;
      font: 12px/1.5 Arial, sans-serif; white-space: nowrap;
    }
    #tct-local-hover-tooltip .local-time {
      color: #b4f2c1; font-weight: 700;
    }
    #tct-local-hover-tooltip .time-note {
      color: #b8bdc6; font-size: 11px; white-space: normal;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  const tooltip = document.createElement('div');
  tooltip.id = 'tct-local-hover-tooltip';
  const utcLine = document.createElement('div');
  const localLine = document.createElement('div');
  localLine.className = 'local-time';
  const note = document.createElement('div');
  note.className = 'time-note';
  tooltip.append(utcLine, localLine, note);
  document.body.appendChild(tooltip);

  function utcDate(year, month, day, hour, minute, second = 0) {
    const d = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    return d.getUTCFullYear() === year &&
      d.getUTCMonth() + 1 === month && d.getUTCDate() === day &&
      d.getUTCHours() === hour && d.getUTCMinutes() === minute &&
      d.getUTCSeconds() === second ? d : null;
  }
  function yearOf(value) {
    return String(value).length === 2 ? 2000 + Number(value) : Number(value);
  }

  function parseTimestamp(value, isTimeElement = false) {
    const text = String(value || '').trim().replace(/\s+/g, ' ');
    if (!text || text.length > 150) return null;
    let m, date;

    // ISO 8601 with Z or an explicit numeric UTC offset.
    m = text.match(/\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})(?!\w)/i);
    if (m) {
      date = new Date(m[0]);
      if (!Number.isNaN(date.getTime())) return { date, inferred: false };
    }

    // 2026-10-12 20:00 or 2026-10-12T20:00:00 (assume TCT).
    m = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})[ T](\d{1,2}):([0-5]\d)(?::([0-5]\d))?\b/i);
    if (m) {
      date = utcDate(+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0));
      if (date) return { date, inferred: false };
    }

    // Torn format: 20:00:00 - 12/10/26 (DD/MM/YY).
    m = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\s*(?:[-–—,]\s*|\s+)(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})\b/);
    if (m) {
      date = utcDate(yearOf(m[6]), +m[5], +m[4], +m[1], +m[2], +(m[3] || 0));
      if (date) return { date, inferred: false };
    }

    // 12/10/26 20:00:00 (DD/MM/YY).
    m = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})[,\s]+([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/);
    if (m) {
      date = utcDate(yearOf(m[3]), +m[2], +m[1], +m[4], +m[5], +(m[6] || 0));
      if (date) return { date, inferred: false };
    }

    // Standalone HH:MM[:SS] and times marked TCT/UTC.
    m = text.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\s*(?:TCT|UTC)?$/i);
    if (!m && (isTimeElement || /\b(?:TCT|UTC)\b/i.test(text))) {
      m = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\s*(?:TCT|UTC)\b/i) ||
          text.match(/\b(?:TCT|UTC)\s*[:–-]?\s*([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/i);
    }
    if (m) {
      const now = new Date();
      date = utcDate(now.getUTCFullYear(), now.getUTCMonth() + 1,
        now.getUTCDate(), +m[1], +m[2], +(m[3] || 0));
      if (date) return { date, inferred: true };
    }
    return null;
  }

  function hoveredTimestamp(element) {
    if (element.closest('#tct-local-hover-tooltip, input, textarea, select, [contenteditable]')) return null;
    for (let node = element, depth = 0;
         node && node !== document.body && depth < 4;
         node = node.parentElement, depth++) {
      // Check the hovered element's attributes and its own direct text first.
      const directText = [...node.childNodes]
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent).join(' ').trim();
      const candidates = [node.getAttribute('datetime'), node.getAttribute('data-original-title'),
        node.getAttribute('title'), directText];
      if ((node.textContent || '').length < 120) candidates.push(node.textContent);
      for (const candidate of candidates) {
        const match = parseTimestamp(candidate, node.tagName === 'TIME');
        if (match) return match;
      }
    }
    return null;
  }

  function hide() { tooltip.style.display = 'none'; }
  function position(event) {
    const pad = 10, dx = 15, dy = 18;
    const width = tooltip.offsetWidth, height = tooltip.offsetHeight;
    const left = Math.max(pad, Math.min(event.clientX + dx, innerWidth - width - pad));
    const top = event.clientY + dy + height > innerHeight
      ? Math.max(pad, event.clientY - height - 12) : event.clientY + dy;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  document.addEventListener('mouseover', event => {
    if (!(event.target instanceof Element)) return hide();
    const match = hoveredTimestamp(event.target);
    if (!match) return hide();
    utcLine.textContent = `TCT: ${formatTCT.format(match.date)}`;
    localLine.textContent = `Local: ${formatLocal.format(match.date)}`;
    note.textContent = match.inferred ? 'Date not shown: assuming today in TCT.' : '';
    note.style.display = match.inferred ? 'block' : 'none';
    tooltip.style.display = 'block';
    position(event);
  }, true);
  document.addEventListener('mousemove', event => {
    if (tooltip.style.display === 'block') position(event);
  }, { passive: true });
  document.addEventListener('scroll', hide, true);
  document.addEventListener('mousedown', hide, true);
})();