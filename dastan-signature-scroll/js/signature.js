/* ─── Dastan Signature Scroll  v1.1.0 ────────────────────────────────────── */
/* Works with Elementor, Divi, and any theme that sets overflow:hidden on     */
/* body/html by using position:fixed + scroll-driven group translation.       */
(function () {
    'use strict';

    /* ── Settings (overridden by wp_localize_script in PHP) ─────────────────── */
    var cfg = window.dssSettings || {};
    var STROKE_COLOR   = cfg.strokeColor      || '#c8a96e';
    var STROKE_WIDTH   = cfg.strokeWidth      || 2;
    var GLOW_COLOR     = cfg.glowColor        || 'rgba(200,169,110,0.35)';
    var CIRCLE_MARGIN  = cfg.circleMargin     || 28;
    var HEADLINE_SEL   = cfg.headlineSelector || 'h1, h2, h3';
    var INITIAL_REVEAL = cfg.initialReveal    || 0.06;

    var NS = 'http://www.w3.org/2000/svg';

    /* ── Module state ─────────────────────────────────────────────────────── */
    var svgEl    = null;
    var groupEl  = null;
    var glowEl   = null;
    var pathEl   = null;
    var totalLen = 0;

    /* ════════════════════════════════════════════════════════════════════════
       SIGNATURE PATH  — single-stroke cursive "Dastan", ~230 × 115 coord space
    ════════════════════════════════════════════════════════════════════════ */
    function signaturePath(ox, oy, sc) {
        function p(x, y) {
            return (ox + x * sc).toFixed(1) + ',' + (oy + y * sc).toFixed(1);
        }
        function M(x, y)               { return 'M '  + p(x, y); }
        function L(x, y)               { return 'L '  + p(x, y); }
        function C(x1,y1,x2,y2,ex,ey) { return 'C '  + p(x1,y1) + ' ' + p(x2,y2) + ' ' + p(ex,ey); }

        return [
            /* D */
            M(10,92),
            C(2,72, 2,38, 14,18),
            C(28,2, 58,0, 72,18),
            C(86,36, 84,72, 70,88),
            C(54,98, 24,98, 10,90),
            C(24,90, 44,84, 52,76),
            /* a */
            C(62,62, 78,60, 80,72),
            C(83,58, 96,56, 99,68),
            C(103,80, 98,92, 88,92),
            C(78,93, 68,86, 70,76),
            L(99,70),
            /* s */
            C(110,60, 124,56, 122,68),
            C(120,76, 108,80, 110,90),
            C(112,98, 126,98, 128,88),
            /* t — ascender up, crossbar loop, back down */
            C(132,74, 136,44, 140,24),
            C(143,14, 146,14, 148,24),
            C(152,44, 152,70, 150,84),
            C(148,72, 130,70, 124,72),
            C(130,70, 146,68, 156,72),
            /* a */
            C(165,62, 178,60, 180,72),
            C(184,60, 196,58, 198,70),
            C(202,82, 196,94, 186,93),
            C(176,94, 167,86, 170,76),
            L(198,70),
            /* n */
            C(206,60, 218,58, 220,70),
            C(222,80, 218,92, 210,92),
            C(216,85, 226,80, 228,90),
            L(230,108),  /* ← tail / endpoint */
        ].join(' ');
    }

    /* ════════════════════════════════════════════════════════════════════════
       CONNECTION PATH — curves + elliptical loops around each headline
    ════════════════════════════════════════════════════════════════════════ */
    function buildConnectionPath(startX, startY, headlines, pageW, pageH) {
        var parts = [];
        var cx = startX;
        var cy = startY;
        var m  = CIRCLE_MARGIN;

        function fmt(n) { return n.toFixed(1); }

        headlines.forEach(function (el) {
            var rect    = el.getBoundingClientRect();
            var scrollY = window.pageYOffset || document.documentElement.scrollTop;

            var top  = rect.top    + scrollY;
            var bot  = rect.bottom + scrollY;
            var left = rect.left;
            var right= rect.right;
            var midX = (left + right) / 2;
            var midY = (top  + bot)   / 2;
            var hw   = (right - left) / 2;
            var hh   = (bot   - top)  / 2;

            /* approach */
            var ex   = left - m;
            var ey   = midY;
            var drop = 0.55;
            parts.push(
                'C ' + fmt(cx + 40)       + ',' + fmt(cy + (ey - cy) * drop) +
                ' '  + fmt(ex - 30)       + ',' + fmt(ey - 45) +
                ' '  + fmt(ex)            + ',' + fmt(ey)
            );

            /* elliptical loop */
            var lx = left  - m;
            var rx = right + m;
            var ty = top   - m * 0.8;
            var by = bot   + m * 0.8;

            parts.push(
                'C ' + fmt(lx - 10)         + ',' + fmt(ey - hh * 0.5) +
                ' '  + fmt(midX - hw * 0.6) + ',' + fmt(ty - 8) +
                ' '  + fmt(midX)            + ',' + fmt(ty),

                'C ' + fmt(midX + hw * 0.6) + ',' + fmt(ty - 8) +
                ' '  + fmt(rx + 10)         + ',' + fmt(ey - hh * 0.5) +
                ' '  + fmt(rx)              + ',' + fmt(ey),

                'C ' + fmt(rx + 10)         + ',' + fmt(ey + hh * 0.5) +
                ' '  + fmt(midX + hw * 0.6) + ',' + fmt(by + 8) +
                ' '  + fmt(midX)            + ',' + fmt(by),

                'C ' + fmt(midX - hw * 0.6) + ',' + fmt(by + 8) +
                ' '  + fmt(lx + 8)          + ',' + fmt(ey + hh * 0.5) +
                ' '  + fmt(lx)              + ',' + fmt(by - 8)
            );

            cx = lx;
            cy = by - 8;
        });

        /* tail to page bottom */
        var tX = pageW * 0.5;
        parts.push(
            'C ' + fmt(cx + 50) + ',' + fmt(cy + 120) +
            ' '  + fmt(tX)      + ',' + fmt(pageH - 160) +
            ' '  + fmt(tX)      + ',' + fmt(pageH - 60)
        );

        return parts.join(' ');
    }

    /* ════════════════════════════════════════════════════════════════════════
       HELPERS
    ════════════════════════════════════════════════════════════════════════ */
    function pageHeight() {
        return Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );
    }
    function pageWidth() {
        return document.documentElement.clientWidth;
    }
    function mkEl(tag, attrs) {
        var el = document.createElementNS(NS, tag);
        Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
        return el;
    }

    /* ════════════════════════════════════════════════════════════════════════
       SETUP
       Elementor fix: SVG is position:FIXED (not absolute).
       A <g> group inside the SVG is translateY'd by -scrollY on every tick,
       making the path appear anchored to page content without being clipped
       by overflow:hidden on body/html (which Elementor always sets).
    ════════════════════════════════════════════════════════════════════════ */
    function setup() {
        if (svgEl && svgEl.parentNode) { svgEl.parentNode.removeChild(svgEl); }

        var pW  = pageWidth();
        var pH  = pageHeight();
        var mob = pW < 768;

        /* ── SVG: fixed, full viewport, overflow visible ─────────────────── */
        svgEl = mkEl('svg', { 'aria-hidden': 'true', 'focusable': 'false' });
        Object.assign(svgEl.style, {
            position      : 'fixed',
            top           : '0',
            left          : '0',
            width         : '100vw',
            height        : '100vh',
            pointerEvents : 'none',
            zIndex        : '9998',
            overflow      : 'visible',
        });

        /* ── Group: offset by scroll so path tracks page content ─────────── */
        groupEl = mkEl('g', { id: 'dastan-sig-group' });
        svgEl.appendChild(groupEl);

        /* ── Signature position / scale ─────────────────────────────────── */
        var sc   = mob ? 0.62 : 0.92;
        var oX   = mob ? pW * 0.06 : pW * 0.07;
        var oY   = 36;
        var endX = oX + 230 * sc;
        var endY = oY + 108 * sc;

        /* ── Headlines ───────────────────────────────────────────────────── */
        var headlines = Array.from(
            document.querySelectorAll(HEADLINE_SEL)
        ).filter(function (el) {
            return el.offsetParent !== null && el.textContent.trim().length > 0;
        });

        /* ── Full path ───────────────────────────────────────────────────── */
        var d = signaturePath(oX, oY, sc) +
                ' ' +
                buildConnectionPath(endX, endY, headlines, pW, pH);

        /* ── Glow (blurred duplicate behind the main stroke) ─────────────── */
        glowEl = mkEl('path', {
            id               : 'dastan-sig-glow',
            d                : d,
            fill             : 'none',
            stroke           : GLOW_COLOR,
            'stroke-width'   : mob ? '7' : '9',
            'stroke-linecap' : 'round',
            'stroke-linejoin': 'round',
        });
        glowEl.style.filter = 'blur(5px)';
        groupEl.appendChild(glowEl);

        /* ── Main ink stroke ─────────────────────────────────────────────── */
        pathEl = mkEl('path', {
            id               : 'dastan-sig-path',
            d                : d,
            fill             : 'none',
            stroke           : STROKE_COLOR,
            'stroke-width'   : mob ? '1.5' : String(STROKE_WIDTH),
            'stroke-linecap' : 'round',
            'stroke-linejoin': 'round',
        });
        groupEl.appendChild(pathEl);

        document.body.appendChild(svgEl);

        /* ── Measure & initialise dash ───────────────────────────────────── */
        totalLen = pathEl.getTotalLength();
        var initOff = totalLen * (1 - INITIAL_REVEAL);
        [pathEl, glowEl].forEach(function (el) {
            el.style.strokeDasharray  = totalLen;
            el.style.strokeDashoffset = initOff;
        });

        tick();
    }

    /* ════════════════════════════════════════════════════════════════════════
       TICK — fires on every scroll event
       1. Translates the group up by scrollY → path stays with page content.
       2. Updates stroke-dashoffset to reveal the path progressively.
    ════════════════════════════════════════════════════════════════════════ */
    function tick() {
        if (!pathEl) { return; }

        var scrollY    = window.pageYOffset || document.documentElement.scrollTop;
        var scrollable = pageHeight() - window.innerHeight;
        var progress   = scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0;

        /* anchor path to page despite fixed SVG */
        groupEl.setAttribute('transform', 'translate(0,' + (-scrollY).toFixed(1) + ')');

        /* reveal stroke */
        var drawFrac = INITIAL_REVEAL + progress * (1 - INITIAL_REVEAL);
        var offset   = (totalLen * (1 - drawFrac)).toFixed(2);
        pathEl.style.strokeDashoffset = offset;
        glowEl.style.strokeDashoffset = offset;
    }

    /* ════════════════════════════════════════════════════════════════════════
       EVENT LISTENERS
    ════════════════════════════════════════════════════════════════════════ */
    window.addEventListener('scroll', tick, { passive: true });

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setup, 280);
    });

    /* Wait for full load so Elementor widgets + images finalise their heights */
    if (document.readyState === 'complete') {
        setup();
    } else {
        window.addEventListener('load', setup);
    }

}());
