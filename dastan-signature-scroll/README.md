# Dastan Signature Scroll – WordPress Plugin

Draws a handwritten cursive **Dastan** signature at the top of every page.
As the visitor scrolls, the ink trail flows downward, looping elegantly around every `h1 / h2 / h3` headline it encounters, until it reaches the footer.

## Installation

1. Upload the `dastan-signature-scroll/` folder to `/wp-content/plugins/`.
2. Activate **Dastan Signature Scroll** in *Plugins → Installed Plugins*.
3. Done — the animation appears on every front-end page automatically.

## Customisation

### Via filter (PHP — add to `functions.php`)

```php
add_filter( 'dss_settings', function ( $s ) {
    $s['strokeColor']      = '#b8860b';   // change ink colour
    $s['strokeWidth']      = 2.5;         // thicker stroke
    $s['circleMargin']     = 32;          // more space around headlines
    $s['initialReveal']    = 0.10;        // show 10% before any scrolling
    $s['headlineSelector'] = 'h1, h2';   // only loop around h1 and h2
    return $s;
} );
```

### Available settings

| Key | Default | Description |
|-----|---------|-------------|
| `strokeColor` | `#c8a96e` | Ink colour (warm gold) |
| `strokeWidth` | `2` | Stroke width in px |
| `glowColor` | `rgba(200,169,110,0.35)` | Soft glow behind the stroke |
| `circleMargin` | `28` | Extra space (px) around each headline when looping |
| `headlineSelector` | `h1, h2, h3` | CSS selector for headlines to circle |
| `initialReveal` | `0.06` | Fraction of path visible before scroll starts (0–1) |

## How it works

1. On `window.load` a full-height `<svg>` is injected as the first child of `<body>`, absolutely positioned so it sits behind all content.
2. A single continuous SVG `<path>` is generated:
   - **Signature** — hand-crafted Bézier curves that trace cursive *Dastan*.
   - **Connection** — smooth cubic curves flowing from the signature tail to each headline, encircling it with an elliptical loop, then continuing downward.
3. `stroke-dashoffset` is set to the full path length initially. A passive `scroll` listener maps scroll progress (0 → 100 %) to drawing progress, revealing the stroke in real time.
4. A second blurred copy of the path provides a soft glow effect.

## Accessibility

Adds `aria-hidden="true"` to the SVG so screen readers ignore it.
Respects `prefers-reduced-motion`: the full path is shown immediately with no animation when the OS setting is on.
