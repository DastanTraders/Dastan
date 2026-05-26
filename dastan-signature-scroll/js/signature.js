/* ─── Dastan Signature Scroll  v1.0.0 ────────────────────────────────────── */
/* Draws a handwritten "Dastan" signature that unrolls down the page as the   */
/* visitor scrolls, looping gracefully around every headline along the way.   */
(function () {
    'use strict';

    /* ── Settings (overridden by wp_localize_script in PHP) ─────────────────── */
    var cfg = window.dssSettings || {};
    var STROKE_COLOR      = cfg.strokeColor      || '#c8a96e';
    var STROKE_WIDTH      = cfg.strokeWidth      || 2;
    var GLOW_COLOR        = cfg.glowColor        || 'rgba(200,169,110,0.35)';
    var CIRCLE_MARGIN     = cfg.circleMargin     || 28;
    var HEADLINE_SEL      = cfg.headlineSelector || 'h1, h2, h3';
    var INITIAL_REVEAL    = cfg.initialReveal    || 0.06; // show first 6% on load

    /* ── SVG namespace ──────────────────────────────────────────────────────── */
    var NS = 'http://www.w3.org/2000/svg';

    /* ── Module state ───────────────────────────────────────────────────────── */
    var svgEl      = null;
    var glowEl     = null;
    var pathEl     = null;
    var totalLen   = 0;

    /* ════════════════════════════════════════════════════════════════════════
       SIGNATURE PATH
       A single-stroke cursive "Dastan" drawn in a ~230 × 115 coordinate space.
       All strokes are continuous (no pen lifts) so stroke-dashoffset works.
       The endpoint is approximately (222, 108) – where the connecting tail
       to the first headline begins.
    ════════════════════════════════════════════════════════════════════════ */
    function signaturePath(ox, oy, sc) {
        /* ox/oy = document offset;  sc = scale factor */
        function p(x, y) {
            return (ox + x * sc).toFixed(1) + ',' + (oy + y * sc).toFixed(1);
        }
        function M(x, y)                     { return 'M '  + p(x, y); }
        function L(x, y)                     { return 'L '  + p(x, y); }
        function C(x1,y1, x2,y2, ex,ey)     { return 'C '  + p(x1,y1) + ' ' + p(x2,y2) + ' ' + p(ex,ey); }

        return [
            /* ── D (capital) ──────────────────────────────────────────────── */
            M(10, 92),
            C( 2, 72,  2, 38, 14, 18),   // left stem rising
            C(28,  2, 58,  0, 72, 18),   // top arc
            C(86, 36, 84, 72, 70, 88),   // right bowl descending
            C(54, 98, 24, 98, 10, 90),   // base of D back left
            /* tail out of D, gliding right toward 'a' */
            C(24, 90, 44, 84, 52, 76),

            /* ── a ─────────────────────────────────────────────────────────── */
            C(62, 62, 78, 60, 80, 72),   // oval entry
            C(83, 58, 96, 56, 99, 68),   // top of 'a' oval
            C(103,80, 98, 92, 88, 92),   // right & base
            C(78, 93, 68, 86, 70, 76),   // back left inside oval
            L(99, 70),                    // exit stroke toward 's'

            /* ── s ─────────────────────────────────────────────────────────── */
            C(110,60, 124,56, 122,68),   // top of s
            C(120,76, 108,80, 110,90),   // middle pivot
            C(112,98, 126,98, 128,88),   // bottom of s

            /* ── t (tall ascender + crossbar as part of continuous stroke) ── */
            /* Vertical stem: glide up then back down */
            C(132,74, 136,44, 140,24),   // ascending stroke of 't'
            C(143,14, 146,14, 148,24),   // tiny loop at apex
            C(152,44, 152,70, 150,84),   // descending back down
            /* Crossbar: swing left along the stem, then return rightward */
            C(148,72, 130,70, 124,72),   // crossbar going left
            C(130,70, 146,68, 156,72),   // crossbar returning right

            /* ── a (second) ─────────────────────────────────────────────────── */
            C(165,62, 178,60, 180,72),   // oval entry
            C(184,60, 196,58, 198,70),   // top
            C(202,82, 196,94, 186,93),   // right & base
            C(176,94, 167,86, 170,76),   // back left
            L(198,70),                    // exit stroke

            /* ── n ─────────────────────────────────────────────────────────── */
            C(206,60, 218,58, 220,70),   // first hump up
            C(222,80, 218,92, 210,92),   // first hump down
            /* connect into second hump */
            C(216,85, 226,80, 228,90),   // second hump up & over
            L(230,108),                  /* signature tail ↓  ← endpoint */

        ].join(' ');
    }

    /* ════════════════════════════════════════════════════════════════════════
       DYNAMIC CONNECTION PATH
       Flows from the signature tail, curves to each headline, loops around
       it in an elegant ellipse, then continues to the next one.
    ════════════════════════════════════════════════════════════════════════ */
    function buildConnectionPath(startX, startY, headlines, pageW, pageH) {
        var parts = [];
        var cx = startX;
        var cy = startY;
        var m  = CIRCLE_MARGIN;

        function fmt(n) { return n.toFixed(1); }

        headlines.forEach(function (el) {
            var rect  = el.getBoundingClientRect();
            var scrollY = window.pageYOffset || document.documentElement.scrollTop;

            var top   = rect.top    + scrollY;
            var bot   = rect.bottom + scrollY;
            var left  = rect.left;
            var right = rect.right;
            var midX  = (left + right) / 2;
            var midY  = (top  + bot)   / 2;
            var hw    = (right - left) / 2;  // half-width
            var hh    = (bot   - top)  / 2;  // half-height

            /* entry point: left-centre of the bounding ellipse */
            var ex = left - m;
            var ey = midY;

            /* ── flowing approach curve ───────────────────────────────────── */
            var dropRatio = 0.55;
            parts.push(
                'C ' + fmt(cx + 40) + ',' + fmt(cy + (ey - cy) * dropRatio) +
                ' ' + fmt(ex - 30)  + ',' + fmt(ey - 45) +
                ' ' + fmt(ex)       + ',' + fmt(ey)
            );

            /* ── elliptical loop around headline ──────────────────────────── */
            var lx = left  - m;       // loop left edge
            var rx = right + m;       // loop right edge
            var ty = top   - m * 0.8; // loop top
            var by = bot   + m * 0.8; // loop bottom

            parts.push(
                /* up the left side */
                'C ' + fmt(lx - 10)       + ',' + fmt(ey - hh * 0.5) +
                ' ' + fmt(midX - hw * 0.6) + ',' + fmt(ty - 8)       +
                ' ' + fmt(midX)            + ',' + fmt(ty),

                /* along the top */
                'C ' + fmt(midX + hw * 0.6) + ',' + fmt(ty - 8) +
                ' ' + fmt(rx + 10)          + ',' + fmt(ey - hh * 0.5) +
                ' ' + fmt(rx)               + ',' + fmt(ey),

                /* down the right side */
                'C ' + fmt(rx + 10)         + ',' + fmt(ey + hh * 0.5) +
                ' ' + fmt(midX + hw * 0.6)  + ',' + fmt(by + 8) +
                ' ' + fmt(midX)             + ',' + fmt(by),

                /* along the bottom, heading back left */
                'C ' + fmt(midX - hw * 0.6) + ',' + fmt(by + 8) +
                ' ' + fmt(lx + 8)           + ',' + fmt(ey + hh * 0.5) +
                ' ' + fmt(lx)               + ',' + fmt(by - 8)
            );

            cx = lx;
            cy = by - 8;
        });

        /* ── tail to page bottom ─────────────────────────────────────────── */
        var tX = pageW * 0.5;
        parts.push(
            'C ' + fmt(cx + 50) + ',' + fmt(cy + 120) +
            ' ' + fmt(tX)       + ',' + fmt(pageH - 160) +
            ' ' + fmt(tX)       + ',' + fmt(pageH - 60)
        );

        return parts.join(' ');
    }

    /* ════════════════════════════════════════════════════════════════════════
       DOM HELPERS
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
    function createEl(tag, attrs, styles) {
        var el = document.createElementNS(NS, tag);
        Object.keys(attrs  || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
        Object.keys(styles || {}).forEach(function (k) { el.style[k] = styles[k]; });
        return el;
    }

    /* ════════════════════════════════════════════════════════════════════════
       SETUP  – (re)builds the entire SVG overlay
    ════════════════════════════════════════════════════════════════════════ */
    function setup() {
        /* Remove previous instance */
        if (svgEl && svgEl.parentNode) { svgEl.parentNode.removeChild(svgEl); }

        var pW  = pageWidth();
        var pH  = pageHeight();
        var mob = pW < 768;

        /* ── Create SVG container ─────────────────────────────────────────── */
        svgEl = createEl('svg', {
            'xmlns'       : NS,
            'aria-hidden' : 'true',
            'focusable'   : 'false',
        }, {
            position      : 'absolute',
            top           : '0',
            left          : '0',
            width         : '100%',
            height        : pH + 'px',
            pointerEvents : 'none',
            zIndex        : '9998',
            overflow      : 'visible',
        });

        /* body must be relatively positioned to contain the SVG */
        if (window.getComputedStyle(document.body).position === 'static') {
            document.body.style.position = 'relative';
        }

        /* ── Signature position & scale ─────────────────────────────────── */
        var sc  = mob ? 0.62 : 0.92;
        var oX  = mob ? pW * 0.06 : pW * 0.07;
        var oY  = 36;

        /* Approximate endpoint of the "n" tail in signature coordinates */
        var endX = oX + 230 * sc;
        var endY = oY + 108 * sc;

        /* ── Headlines ───────────────────────────────────────────────────── */
        var headlines = Array.from(document.querySelectorAll(HEADLINE_SEL)).filter(function (el) {
            return el.offsetParent !== null && el.textContent.trim().length > 0;
        });

        /* ── Build full path d-string ────────────────────────────────────── */
        var d = signaturePath(oX, oY, sc) +
                ' ' +
                buildConnectionPath(endX, endY, headlines, pW, pH);

        /* ── Glow path (behind, blurred) ─────────────────────────────────── */
        glowEl = createEl('path', {
            id              : 'dastan-sig-glow',
            d               : d,
            fill            : 'none',
            stroke          : GLOW_COLOR,
            'stroke-width'  : mob ? '7' : '9',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
        });
        svgEl.appendChild(glowEl);

        /* ── Main ink path ───────────────────────────────────────────────── */
        pathEl = createEl('path', {
            id              : 'dastan-sig-path',
            d               : d,
            fill            : 'none',
            stroke          : STROKE_COLOR,
            'stroke-width'  : mob ? '1.5' : String(STROKE_WIDTH),
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
        });
        svgEl.appendChild(pathEl);

        document.body.insertBefore(svgEl, document.body.firstChild);

        /* ── Measure total length and initialise dash ────────────────────── */
        totalLen = pathEl.getTotalLength();

        var initOffset = totalLen * (1 - INITIAL_REVEAL); // show a sliver at start
        [pathEl, glowEl].forEach(function (el) {
            el.style.strokeDasharray  = totalLen;
            el.style.strokeDashoffset = initOffset;
        });

        tick(); // align to current scroll position
    }

    /* ════════════════════════════════════════════════════════════════════════
       TICK  – maps scroll progress → stroke-dashoffset
    ════════════════════════════════════════════════════════════════════════ */
    function tick() {
        if (!pathEl) { return; }

        var scrolled   = window.pageYOffset || document.documentElement.scrollTop;
        var scrollable = pageHeight() - window.innerHeight;
        var progress   = scrollable > 0 ? Math.min(scrolled / scrollable, 1) : 0;

        /* Map 0→1 scroll to (initReveal)→1 draw fraction */
        var drawFraction = INITIAL_REVEAL + progress * (1 - INITIAL_REVEAL);
        var offset = (totalLen * (1 - drawFraction)).toFixed(2);

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

    /* Run after everything (images, fonts, lazy blocks) has loaded so all
       element heights are finalised before we measure positions. */
    if (document.readyState === 'complete') {
        setup();
    } else {
        window.addEventListener('load', setup);
    }

}());
