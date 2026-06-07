# Traccar Web + What3Words Integration

> Fork of [traccar/traccar-web](https://github.com/traccar/traccar-web) with What3Words map search support.  
> Backend counterpart: [marcgran/traccar](https://github.com/marcgran/traccar/tree/feature/what3words-integration)

---

## What this adds

The map search box now accepts **What3Words addresses** in addition to regular place names.

| Input | Behavior |
|-------|----------|
| `///alfiler.prefiero.cohetes` | Searches via What3Words, flies to that exact 3m² square |
| `alfiler.prefiero.cohetes` | Also recognized as a W3W address (no `///` prefix needed) |
| `Calle Gran Vía, Madrid` | Normal Nominatim search — unchanged |

### Search result appearance

```
/// alfiler.prefiero.cohetes        ← red /// badge
    Madrid, Madrid · ES             ← nearest place as subtitle
```

---

## How it works

```
User types ///word.word.word
        │
        ▼
  isW3WQuery() detects pattern
        │
        ▼
  GET /api/geocoder/w3w?q=///word.word.word
  (calls the Traccar backend, which calls What3Words API)
        │
        ▼
  Map flies to the coordinates
  Result shown with red /// badge
```

Regular searches (non-W3W) continue to use **Nominatim** directly — no change.

---

## Modified file

### `MapGeocoder.jsx`
`src/map/control/MapGeocoder.jsx`

Key changes:
- Added `isW3WQuery()` function to detect `///word.word.word` patterns
- Routes W3W queries to `/api/geocoder/w3w` (Traccar backend endpoint)
- Displays W3W results with a red `///` badge and nearest place subtitle
- Falls back gracefully to error message if the API fails

---

## Requirements

> ⚠️ **A paid What3Words API plan is required.**  
> The free tier does not include the `convert-to-3wa` endpoint (coordinates → words) needed for reverse geocoding.  
> See the [backend README](https://github.com/marcgran/traccar/blob/master/README-W3W.md#api-key) for details.

This frontend fork requires the backend fork to be installed and running:  
👉 **[marcgran/traccar — backend](https://github.com/marcgran/traccar/blob/master/README-W3W.md)**

The backend provides the `/api/geocoder/w3w` endpoint that this frontend calls.

---

## Build

```bash
git clone https://github.com/marcgran/traccar-web.git
cd traccar-web
git checkout feature/what3words-integration
npm install
npm run build
# Copy build/ to /opt/traccar/web/
```

---

## License

Apache 2.0 — same as the upstream [traccar/traccar-web](https://github.com/traccar/traccar-web) project.
