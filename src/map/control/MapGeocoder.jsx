import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useTheme,
  Popover,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { createRoot } from 'react-dom/client';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { map } from '../core/MapView';
import { toMapCoordinates } from '../core/mapUtil';
import { errorsActions } from '../../store';
import { useTranslation } from '../../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => ({
  button: {
    '&&': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#333',
    },
  },
  panel: {
    width: theme.spacing(40),
    maxHeight: theme.spacing(50),
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: theme.spacing(1),
  },
  results: {
    overflowY: 'auto',
  },
  w3wBadge: {
    color: '#e11f26',
    fontWeight: 700,
    marginRight: theme.spacing(0.5),
  },
}));

/** Detecta si la cadena es una dirección What3Words (///a.b.c o a.b.c) */
const isW3WQuery = (q) => {
  const trimmed = q.trim();
  if (trimmed.startsWith('///')) return true;
  // Exactamente tres palabras separadas por puntos, sin espacios ni slashes
  return /^[^.\s/]+\.[^.\s/]+\.[^.\s/]+$/.test(trimmed);
};

const MapGeocoder = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const t = useTranslation();
  const { classes } = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        if (isW3WQuery(query)) {
          /* ── What3Words → coordenadas via backend Traccar ── */
          const response = await fetch(
            `/api/geocoder/w3w?q=${encodeURIComponent(query.trim())}`,
            { signal: controller.signal },
          );
          const data = await response.json();

          if (data.error) {
            dispatch(errorsActions.push(`What3Words: ${data.error}`));
            setResults([]);
          } else {
            // Crear un bbox pequeño alrededor del punto (~110 m) para fitBounds
            const delta = 0.001;
            setResults([{
              isW3W: true,
              properties: {
                place_id: `w3w_${data.words}`,
                display_name: `///${data.words}`,
                w3w_near: data.nearestPlace || '',
                w3w_country: data.country || '',
              },
              bbox: [
                data.lng - delta,
                data.lat - delta,
                data.lng + delta,
                data.lat + delta,
              ],
            }]);
          }
        } else {
          /* ── Búsqueda normal con Nominatim ── */
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=geojson&addressdetails=1`;
          const response = await fetch(url, { signal: controller.signal });
          const data = await response.json();
          setResults(data.features || []);
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          dispatch(errorsActions.push(e.message));
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query, dispatch]);

  useEffect(() => {
    let element;
    let iconRoot;
    const control = {
      onAdd: () => {
        element = document.createElement('div');
        element.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `maplibregl-ctrl-icon ${classes.button}`;
        button.onclick = () => setAnchorEl(button);
        element.appendChild(button);
        iconRoot = createRoot(button);
        iconRoot.render(<TravelExploreIcon fontSize="small" />);
        return element;
      },
      onRemove: () => {
        queueMicrotask(() => iconRoot.unmount());
        element.remove();
      },
    };
    map.addControl(control, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => map.removeControl(control);
  }, [theme.direction, classes.button]);

  const onSelect = (feature) => {
    const [minX, minY, maxX, maxY] = feature.bbox;
    map.fitBounds(
      [toMapCoordinates(minX, minY), toMapCoordinates(maxX, maxY)],
      { padding: 40 },
    );
    setAnchorEl(null);
    setQuery('');
    setResults([]);
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={() => setAnchorEl(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Box className={classes.panel}>
        <Box className={classes.input}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder={`${t('sharedSearch')}  ·  ///palabra.palabra.palabra`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Box>
        <List className={classes.results} dense disablePadding>
          {loading
            ? Array.from({ length: 3 }, (_, i) => (
                <ListItemButton key={i} disabled>
                  <ListItemText primary={<Skeleton width="100%" />} />
                </ListItemButton>
              ))
            : results.map((feature) => (
                <ListItemButton
                  key={feature.properties.place_id}
                  onClick={() => onSelect(feature)}
                >
                  {feature.isW3W ? (
                    <ListItemText
                      primary={
                        <>
                          <span className={classes.w3wBadge}>///</span>
                          {feature.properties.display_name.replace('///', '')}
                        </>
                      }
                      secondary={
                        feature.properties.w3w_near
                          ? `${feature.properties.w3w_near}${feature.properties.w3w_country ? ` · ${feature.properties.w3w_country}` : ''}`
                          : undefined
                      }
                    />
                  ) : (
                    <ListItemText primary={feature.properties.display_name} />
                  )}
                </ListItemButton>
              ))}
        </List>
      </Box>
    </Popover>
  );
};

export default MapGeocoder;
