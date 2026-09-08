# Brand assets for Shopify

Generated from the site's own logo and design tokens, so the store and
4minimset.com are the same thing to look at. Rebuild with
`tools/brand-assets.mjs` if the mark changes.

## Where each file goes

| File | Size | Shopify field |
| --- | --- | --- |
| `logo-wordmark.png` | 1116 × 324, transparent | **Settings → Brand → Logo** (also used on checkout and emails) |
| `logo-square.png` | 1024 × 1024 | **Settings → Brand → Square logo** (Shop app, some social embeds) |
| `logo-wordmark-light.png` | 1116 × 324, transparent | any dark background — a printed flyer, a dark email header |
| `favicon-32.png` | 32 × 32 | **Online Store → Themes → Customize → Theme settings → Favicon** |
| `favicon-512.png` | 512 × 512 | a higher-resolution source if a field wants one |
| `favicon-180.png` | 180 × 180 | apple-touch-icon, if the theme asks for one |
| `cover.jpg` | 1200 × 600 | **Settings → Brand → Cover image** |
| `mark.svg` | vector | wherever an SVG is accepted; the source for every icon above |

## Colours

Paste these into **Settings → Brand → Colors**.

| Role | Hex | Where it comes from |
| --- | --- | --- |
| Primary | `#1D5A3A` | lulav green — every button on the site |
| Primary hover / dark | `#153F29` | |
| Secondary / accent | `#D9A83A` | esrog gold — prices and emphasis |
| Text | `#17150F` | warm near-black |
| Background | `#FBF8F1` | warm sand, the site's ground |

## Notes

The mark is an esrog with its pitom on a lulav-green tile — the same mark in
the site header, not a new one. `mark.svg` is pure paths with no typeface
dependency, so it renders anywhere; the wordmark PNGs carry Frank Ruhl Libre
and Inter baked in, which is why they are images rather than SVG text.

`cover.jpg` is a 1200 × 600 crop of `inspect-wide.jpg` — chassidim checking
esrogim at the Daled Minim fair. Swap it for a photograph of V'samachta's own
operation as soon as one exists; the generic market shots are placeholders in
the same way the hero photograph is.
