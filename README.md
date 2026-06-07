# Traccar Web + What3Words Integration

> Fork of [traccar/traccar-web](https://github.com/traccar/traccar-web) — adds What3Words address search to the Traccar map.  
> Backend fork: [marcgran/traccar](https://github.com/marcgran/traccar)

---

## What this fork adds

The map search box now accepts **What3Words addresses** in addition to regular place names.

| Input | Behavior |
|-------|----------|
| `///alfiler.prefiero.cohetes` | Searches via What3Words, flies to that exact 3 m² square |
| `alfiler.prefiero.cohetes` | Also recognized as a W3W address (prefix `///` is optional) |
| `Calle Gran Vía, Madrid` | Normal Nominatim search — unchanged |

Results are shown with a red `///` badge and the nearest place as subtitle.

---

## Requirements

- The **backend fork** [marcgran/traccar](https://github.com/marcgran/traccar) must be installed and running — it provides the `/api/geocoder/w3w` endpoint used by the search
- A **paid** What3Words API plan

### ⚠️ What3Words API — paid plan required

The free tier does **not** include the `convert-to-3wa` endpoint needed for address display in Traccar. See the [backend README](https://github.com/marcgran/traccar#%EF%B8%8F-what3words-api--paid-plan-required) for details.

---

## How the search works

```
User types ///word.word.word in the search box
        │
        ▼
  Detected as W3W query by isW3WQuery()
        │
        ▼
  GET /api/geocoder/w3w?q=///word.word.word   (Traccar backend)
        │
        ▼
  Map flies to the returned coordinates
  Result shown with red /// badge + nearest place
```

Regular text searches continue to use Nominatim directly — no changes to existing behavior.

---

## Modified file

### `MapGeocoder.jsx`
`src/map/control/MapGeocoder.jsx`

Changes:
- `isW3WQuery()` — detects `///word.word.word` patterns
- Routes W3W queries to `/api/geocoder/w3w` instead of Nominatim
- Displays W3W results with red `///` badge and nearest place as subtitle
- Non-W3W queries use Nominatim as before

---

## Build

```bash
git clone https://github.com/marcgran/traccar-web.git
cd traccar-web
npm install
npm run build
# Copy build/ to /opt/traccar/web/
```

Or use the all-in-one installer from [marcgran/traccar](https://github.com/marcgran/traccar), which builds and deploys both backend and frontend automatically.

---

## About Traccar Web

Traccar Web is the official web interface for the Traccar GPS tracking platform, built with React, Material UI and MapLibre.

- Original repository: [traccar/traccar-web](https://github.com/traccar/traccar-web)
- Platform: [traccar.org](https://www.traccar.org)
- Build docs: [traccar.org/build-web-app](https://www.traccar.org/build-web-app/)

Original authors: Anton Tananaev, Andrey Kunitsyn.

---

## License

Apache License 2.0 — same as the upstream [traccar/traccar-web](https://github.com/traccar/traccar-web) project.
