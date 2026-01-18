# OpenFront.io - Control Panel Enhancement (Userscript)

Adds troop percentage indicators to OpenFront.io’s control panel:

- **Current troops %** (colored by thresholds)
- **Remaining troops %** after applying the attack ratio (also shows remaining troops count)

## Screenshots

![After 1](assets/screenshots/control-panel-after-1.png)
![After 2](assets/screenshots/control-panel-after-2.png)

## Thresholds & colors

The script colors troop percentages using these thresholds. Colors are meant to indicate your troop growth speed at that % (income rate): very low/high % grows slower; mid-range grows fastest.

### Current troops % (and Remaining % base color)

|            Range | Color                                                                         |
| ---------------: | :---------------------------------------------------------------------------- |
|    < 9% or > 82% | ![Critical](https://img.shields.io/badge/Critical-f87171?style=flat-square)   |
|  9–17% or 71–82% | ![Warning](https://img.shields.io/badge/Warning-fb923c?style=flat-square)     |
| 18–22% or 65–70% | ![Caution](https://img.shields.io/badge/Caution-eab308?style=flat-square)     |
| 23–30% or 55–64% | ![Good](https://img.shields.io/badge/Good-22c55e?style=flat-square)           |
|           31–54% | ![Excellent](https://img.shields.io/badge/Excellent-22d3ee?style=flat-square) |

### Remaining troops % special handling

Remaining % uses the same coloring as above **except**:

- **If remaining % > 55%**, it is forced to ![Good](https://img.shields.io/badge/Good-22c55e?style=flat-square).

## Install

### From Greasy Fork (recommended)

Install from Greasy Fork and keep auto-updates enabled.

### Manual install (developer)

1. Install a userscript manager:
   - Tampermonkey (Chrome/Edge) or Violentmonkey (Firefox)
2. Open this file and click **Install**:
   - `openfront-control-panel-enhancement.user.js`

## Supported sites

- `https://*.openfront.io/*`
- `https://*.openfront.dev/*`

## License

MIT
