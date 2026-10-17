// ==UserScript==
// @name         Torn TCT + Local Hover Converter
// @namespace    https://github.com/HairyKary/Torn-TCT-Local-Converter
// @version      1.4.2
// @author       HairyKary
// @license      MIT
// @description  Convert TCT timestamps to device-local time: hover on desktop, tap or long-press on mobile.
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
  // A clock display is not always a clock *time*: travel timers are durations.
  const FLIGHT_ARRIVAL = /\b(?:landing(?:\s+(?:at|time))?|arriv(?:al|ing)(?:\s+(?:at|time))?|arrives?\s+at|lands?\s+at)\s*[:–—-]?\s*$/i;
  const DURATION_LABEL = /\b(?:remaining\s+(?:(?:flight|travel)\s+)?time|(?:flight|travel)\s+time\s+remaining|time\s+(?:left|remaining)|countdown|cooldown|duration|elapsed(?:\s+time)?|flight\s+duration|travel\s+duration|(?:starts?|ends?|finishes?)\s+in)\s*[:–—-]?\s*$/i;
  // A resource bar's HH:MM[:SS] is time remaining, not a time of day.
  const RESOURCE_DURATION_LABEL = /\b(?:(?:full|max(?:imum)?)\s+(?:energy|nerve|happy(?:ness)?|life)\s+in|(?:energy|nerve|happy(?:ness)?|life)\s*:\s*\d+\s*\/\s*\d+(?:\s+(?:remaining|left|in))?|(?:energy|nerve|happy(?:ness)?|life)\s+(?:refills?|regenerates?|recovers?|restores?)\s+in)\s*[:–—-]?\s*$/i;
  // For resource timers stored in title/aria-label attributes with no text time.
  const RESOURCE_STATUS_ROW = /^(?:energy|nerve|happy(?:ness)?|life)\s*:?\s*\d+\s*\/\s*\d+(?:\s+(?:(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?|full))?$/i;
  const HOLD_MS = 450;
  const MOVE_TOLERANCE = 12;
  const SYNTHETIC_MOUSE_DELAY_MS = 1500;
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // All displayed dates use the device time zone; TCT is always UTC.
  function makeFormatter(timeZone) {
    const stamp = new Intl.DateTimeFormat('en-GB', {
      timeZone, day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    const zoneName = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' });
    return date => {
      const label = zoneName.formatToParts(date)
        .find(part => part.type === 'timeZoneName')?.value || timeZone;
      return `${stamp.format(date)} ${label}`;
    };
  }
  const formatTCT = makeFormatter('UTC');
  const formatLocal = makeFormatter(localZone);

  // Date.UTC silently normalizes impossible dates; reject them instead.
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

    // ISO 8601 with Z / numeric offset specifies an exact instant.
    match = text.match(/\b(20\d{2})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)(?!\w)/i);
    if (match && utcDate(+match[1], +match[2], +match[3], +match[4], +match[5], +(match[6] || 0))) {
      date = new Date(match[0]);
      if (Number.isFinite(date.getTime())) return { date, inferred: false };
    }

    // YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM, interpreted as UTC.
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

    // Labels like "Landing at 23:45:50" are absolute TCT times, not countdowns.
    match = text.match(new RegExp('\\b(?:landing(?:\\s+(?:at|time))?|arriv(?:al|ing)(?:\\s+(?:at|time))?|arrives?\\s+at|lands?\\s+at)\\s*[:–—-]?\\s*' + TIME + '\\b', 'i'));
    if (!match) match = text.match(new RegExp('^' + TIME + '\\s*(?:TCT|UTC)?$', 'i'));
    if (!match && (isTimeElement || /\b(?:TCT|UTC)\b/i.test(text))) {
      match = text.match(new RegExp('\\b' + TIME + '\\s*(?:TCT|UTC)\\b', 'i')) ||
        text.match(new RegExp('\\b(?:TCT|UTC)\\s*[:–-]?\\s*' + TIME + '\\b', 'i'));
    }
    if (match) {
      const now = new Date();
      date = utcDate(now.getUTCFullYear(), now.getUTCMonth() + 1,
        now.getUTCDate(), +match[1], +match[2], +(match[3] || 0));
      if (date) {
        const clock = `${String(+match[1]).padStart(2, '0')}:${match[2]}` +
          (match[3] == null ? '' : `:${match[3]}`);
        return { date, inferred: true, clock };
      }
    }
    return null;
  }

  function init() {
    if (document.getElementById(TOOLTIP_ID) || !document.body) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${TOOLTIP_ID} {
        position: fixed; z-index: 2147483640; display: none;
        pointer-events: none; box-sizing: border-box;
        width: max-content; max-width: min(320px, calc(100vw - 20px));
        padding: 8px 10px; border: 1px solid #596575; border-radius: 7px;
        background: #171b22; color: #eef1f5; box-shadow: 0 4px 18px #0008;
        font: 12px/1.5 Arial, sans-serif; overflow-wrap: anywhere;
      }
      #${TOOLTIP_ID}.tct-touch { pointer-events: auto; }
      #${TOOLTIP_ID} .tct-local-line { color: #b4f2c1; font-weight: 700; }
      #${TOOLTIP_ID} .tct-local-note { color: #b8bdc6; font-size: 11px; }
      #${TOOLTIP_ID} .tct-close {
        display: none; float: right; margin: -5px -5px 0 7px;
        padding: 2px 6px; border: 0; border-radius: 4px;
        background: transparent; color: #eef1f5; font: 16px/1.2 Arial, sans-serif;
        cursor: pointer; touch-action: manipulation;
      }
      #${TOOLTIP_ID}.tct-touch .tct-close { display: block; }
    `;
    (document.head || document.documentElement).appendChild(style);

    const tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    tooltip.setAttribute('role', 'tooltip');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'tct-close';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Close time conversion');
    const tctLine = document.createElement('div');
    const localLine = document.createElement('div');
    localLine.className = 'tct-local-line';
    const noteLine = document.createElement('div');
    noteLine.className = 'tct-local-note';
    tooltip.append(close, tctLine, localLine, noteLine);
    document.body.appendChild(tooltip);

    // Match the label immediately BEFORE a clock, not a neighboring time.
    // Torn flight panels often contain both a countdown and a landing time.
    function clockKind(text, clock) {
      const source = String(text || '').replace(/\s+/g, ' ');
      if (!clock) return null;
      // Handle 3:14:38 and 03:14:38 consistently.
      const components = clock.split(':');
      const variants = [clock, `${Number(components[0])}:${components.slice(1).join(':')}`];
      let index = -1;
      for (const variant of variants) {
        const found = source.indexOf(variant);
        if (found !== -1 && (index === -1 || found < index)) index = found;
      }
      if (index < 0) return null;
      let preceding = source.slice(Math.max(0, index - 110), index);
      // A previous clock marks the beginning of a *different* field/label.
      let lastClockEnd = 0;
      for (const match of preceding.matchAll(new RegExp('\\b' + TIME + '\\b', 'g'))) {
        lastClockEnd = match.index + match[0].length;
      }
      preceding = preceding.slice(lastClockEnd);
      if (DURATION_LABEL.test(preceding) || RESOURCE_DURATION_LABEL.test(preceding)) return 'duration';
      if (FLIGHT_ARRIVAL.test(preceding)) return 'arrival';
      return null;
    }

    function contextKind(node, candidate, clock) {
      const direct = clockKind(candidate, clock);
      if (direct) return direct;
      // Some HUD timers exist only in attributes; neighboring text shows the
      // resource value, so the clock is never visible in element.textContent.
      for (let current = node, depth = 0; current && current !== document.body && depth < 3;
        current = current.parentElement, depth++) {
        const row = (current.textContent || '').replace(/\s+/g, ' ').trim();
        if (row.length <= 100 && RESOURCE_STATUS_ROW.test(row)) return 'duration';
      }
      // Restrict the search to close-by containers; don't absorb unrelated rows.
      for (let parent = node.parentElement, depth = 0; parent && depth < 3;
        parent = parent.parentElement, depth++) {
        const content = (parent.textContent || '').trim();
        if (content.length > 320) break;
        const kind = clockKind(content, clock);
        if (kind) return kind;
      }
      return null;
    }

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
        const wholeText = node.textContent || '';
        // If a wrapper has multiple clock values, hovering the wrapper should
        // not accidentally select a different child (e.g., flight countdown).
        if (wholeText.length < 160 &&
            [...wholeText.matchAll(new RegExp('\\b' + TIME + '\\b', 'g'))].length <= 1) {
          candidates.push(wholeText);
        }
        for (const candidate of candidates) {
          const match = parseTimestamp(candidate, node.tagName === 'TIME');
          if (!match) continue;
          if (!match.inferred || !match.clock) return match;
          const kind = contextKind(node, candidate, match.clock);
          if (kind === 'duration') return null;
          if (kind === 'arrival') {
            const now = new Date();
            const next = new Date(match.date);
            // Landing is the NEXT occurrence of that TCT clock time (within 24h).
            if (next.getTime() < now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
            return { date: next, inferred: true,
              note: 'Landing clock: next occurrence in TCT (date inferred).' };
          }
          return match;
        }
      }
      return null;
    }

    function hide() {
      tooltip.style.display = 'none';
      tooltip.classList.remove('tct-touch');
    }

    function position(x, y, touch = false) {
      const pad = 10;
      const width = tooltip.offsetWidth;
      const height = tooltip.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const left = Math.max(pad, Math.min(x + (touch ? -width / 2 : 15), viewportWidth - width - pad));
      const below = y + (touch ? 24 : 18);
      const above = y - height - (touch ? 20 : 12);
      const top = touch ? (above >= pad ? above : below)
        : (below + height <= viewportHeight - pad ? below : above);
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${Math.max(pad, Math.min(top, viewportHeight - height - pad))}px`;
    }

    function show(match, x, y, touch = false) {
      tctLine.textContent = `TCT: ${formatTCT(match.date)}`;
      localLine.textContent = `Local: ${formatLocal(match.date)}`;
      noteLine.textContent = match.note || (match.inferred ? 'No date shown; assuming today in TCT.' : '');
      noteLine.style.display = match.inferred ? 'block' : 'none';
      tooltip.classList.toggle('tct-touch', touch);
      tooltip.style.display = 'block';
      position(x, y, touch);
    }

    close.addEventListener('click', hide);

    // Desktop behavior stays unchanged. Ignore synthesized mouse events after touch.
    let lastTouchAt = 0;
    document.addEventListener('mouseover', event => {
      if (Date.now() - lastTouchAt < SYNTHETIC_MOUSE_DELAY_MS) return;
      if (!(event.target instanceof Element)) return hide();
      const match = hoveredTimestamp(event.target);
      if (match) show(match, event.clientX, event.clientY);
      else hide();
    }, true);
    document.addEventListener('mousemove', event => {
      if (Date.now() - lastTouchAt >= SYNTHETIC_MOUSE_DELAY_MS && tooltip.style.display === 'block') {
        position(event.clientX, event.clientY);
      }
    }, { passive: true });
    document.addEventListener('mouseout', event => {
      if (Date.now() - lastTouchAt >= SYNTHETIC_MOUSE_DELAY_MS && !event.relatedTarget) hide();
    }, true);

    let gesture = null;
    let swallowClickTarget = null;
    let swallowClickUntil = 0;

    function cancelGesture() {
      if (gesture?.timer != null) window.clearTimeout(gesture.timer);
      gesture = null;
    }

    function interactiveAncestor(element) {
      return element.closest('a[href], button, [role="button"], [role="link"], summary, label, [onclick]');
    }

    document.addEventListener('touchstart', event => {
      lastTouchAt = Date.now();
      cancelGesture();
      if (event.touches.length !== 1 || !(event.target instanceof Element)) return;
      if (tooltip.contains(event.target)) return;
      hide();

      const match = hoveredTimestamp(event.target);
      if (!match) return;
      const touch = event.touches[0];
      const interactive = interactiveAncestor(event.target);
      const current = {
        target: event.target, actionTarget: interactive || event.target, match,
        x: touch.clientX, y: touch.clientY, active: false,
        interactive: Boolean(interactive), timer: null
      };
      gesture = current;
      current.timer = window.setTimeout(() => {
        if (gesture !== current) return;
        current.active = true;
        show(current.match, current.x, current.y, true);
      }, HOLD_MS);
    }, { passive: true });

    document.addEventListener('touchmove', event => {
      lastTouchAt = Date.now();
      if (!gesture) return;
      const touch = event.touches[0];
      if (!touch || event.touches.length !== 1 ||
          Math.hypot(touch.clientX - gesture.x, touch.clientY - gesture.y) > MOVE_TOLERANCE) {
        if (gesture.active) hide();
        cancelGesture();
      }
    }, { passive: true });

    document.addEventListener('touchend', event => {
      lastTouchAt = Date.now();
      if (!gesture) return;
      const current = gesture;
      cancelGesture();
      if (event.changedTouches.length !== 1 || event.touches.length) return;
      if (current.active && current.interactive) {
        // Suppress only the synthetic click generated by this long press.
        swallowClickTarget = current.actionTarget;
        swallowClickUntil = Date.now() + 1000;
      } else if (!current.active && !current.interactive) {
        show(current.match, current.x, current.y, true);
      }
    }, { passive: true });

    document.addEventListener('touchcancel', () => {
      lastTouchAt = Date.now();
      cancelGesture();
      hide();
    }, { passive: true });

    document.addEventListener('click', event => {
      if (!swallowClickTarget) return;
      if (Date.now() > swallowClickUntil) {
        swallowClickTarget = null;
        return;
      }
      if (swallowClickTarget.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        swallowClickTarget = null;
      }
    }, true);

    document.addEventListener('contextmenu', event => {
      if (gesture?.active && gesture.actionTarget.contains(event.target)) event.preventDefault();
    }, true);

    document.addEventListener('scroll', () => {
      cancelGesture();
      hide();
    }, true);
    document.addEventListener('mousedown', event => {
      if (Date.now() - lastTouchAt >= SYNTHETIC_MOUSE_DELAY_MS) hide();
    }, true);
    window.addEventListener('blur', () => {
      cancelGesture();
      hide();
    });
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init, { once: true });
})();