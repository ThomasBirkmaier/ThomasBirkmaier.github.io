# ThomasBirkmaier.github.io

The product homepage of [ReqSeq](https://github.com/ThomasBirkmaier/ReqSeq), served at https://thomasbirkmaier.github.io/. The documentation stays in the ReqSeq repository and is served at https://thomasbirkmaier.github.io/ReqSeq/.

## Layout

- `index.html`: the page, plain HTML.
- `assets/site.css`, `assets/site.js`: its style and the three animations (vanilla JavaScript, no dependencies). With `prefers-reduced-motion` or without JavaScript the page shows each animation's end state.
- `assets/img/`: screenshots of the ReqSeq web UI, light and dark, as WebP.
- `assets/fonts/`: IBM Plex Sans and IBM Plex Mono (latin subset), under the SIL Open Font License 1.1 (`OFL-*.txt`).
- `.github/workflows/pages.yml`: publishes the page to GitHub Pages on every push to `main`.

The page loads nothing from other servers and sets no cookies; keep it that way.

## Preview

Open `index.html` in a browser, or run `python3 -m http.server` in this folder and open http://localhost:8000/.

## Content rules

The page states only what ReqSeq can do in its latest release, each statement backed by the ReqSeq README, docs or specification. Commands and outputs are those of a real run. The page names no prices and no license terms; the footer links to the license in the ReqSeq repository.
