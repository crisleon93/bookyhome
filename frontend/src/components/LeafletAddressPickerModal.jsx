import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng);
    },
  });
  return null;
}

const normalizeText = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
};

const uniqueParts = (values) => {
  const seen = new Set();
  return values
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .filter((value) => {
      const lower = value.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
};

const buildCompactLocation = (cityValue, departmentValue) => {
  const city = normalizeText(cityValue);
  const department = normalizeText(departmentValue);
  const values = [];
  const seen = new Set();

  const pushValue = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    values.push(normalized);
  };

  pushValue(city);
  pushValue(department);

  if (values.length === 2) {
    const [first, second] = values;
    const firstKey = first.toLowerCase();
    const secondKey = second.toLowerCase();
    const isDuplicate = firstKey === secondKey || secondKey.includes(firstKey) || firstKey.includes(secondKey);
    if (isDuplicate) {
      return first;
    }
  }

  return values.join(', ');
};

const buildAddressResult = (rawData, fallbackQuery = '', latlng = null) => {
  const address = rawData?.address || {};
  const displayName = rawData?.display_name || '';
  const preferredParts = uniqueParts([
    address.road,
    address.house_number,
    address.neighbourhood,
    address.suburb,
    address.village,
  ]);
  const shortAddress = preferredParts.join(' ').trim();
  const cityValue = normalizeText(address.city || address.town || address.village || address.suburb || '');
  const departmentValue = normalizeText(address.state || address.state_district || '');
  const postalValue = normalizeText(address.postcode || '');
  const compactLocation = buildCompactLocation(cityValue, departmentValue);
  const fallback = fallbackQuery || shortAddress || displayName || 'Dirección sin especificar';
  const result = {
    direccion: shortAddress || fallback,
    ciudad: cityValue,
    departamento: departmentValue,
    codigo_postal: postalValue,
    formatted_address: [shortAddress, compactLocation].filter(Boolean).join(', '),
    lat: latlng?.lat ?? Number(rawData?.lat),
    lng: latlng?.lng ?? Number(rawData?.lon),
  };
  return result;
};

export default function LeafletAddressPickerModal({ isOpen, onClose, onSelect }) {
  const [position, setPosition] = useState({ lat: 4.7110, lng: -74.0721 });
  const [addressText, setAddressText] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setLoading(false);
  }, [isOpen]);

  const handleMapSelect = async (latlng) => {
    setLoading(true);
    setError('');
    setPosition({ lat: latlng.lat, lng: latlng.lng });
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      const result = buildAddressResult(data, '', latlng);
      setAddressText(result.direccion);
      setCity(result.ciudad);
      setDepartment(result.departamento);
      setPostalCode(result.codigo_postal);
      onSelect?.(result);
    } catch {
      setError('No se pudo obtener la dirección desde OpenStreetMap');
    } finally {
      setLoading(false);
    }
  };

  const handleUseManualAddress = async () => {
    const query = addressText.trim();
    if (!query) {
      setError('Escribe una dirección para completar los datos.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=co&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No se encontró la dirección');
      }

      const result = buildAddressResult(data[0], query);
      setAddressText(result.direccion);
      setCity(result.ciudad);
      setDepartment(result.departamento);
      setPostalCode(result.codigo_postal);
      setPosition({ lat: result.lat, lng: result.lng });
      onSelect?.(result);
      onClose?.();
    } catch {
      setError('No se pudo encontrar una dirección completa. Prueba con una referencia más específica.');
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = useMemo(() => [position.lat, position.lng], [position.lat, position.lng]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '760px', background: '#fff', borderRadius: '16px', boxShadow: '0 18px 48px rgba(0,0,0,0.22)', padding: '1.25rem', position: 'relative' }} onClick={(evt) => evt.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#7A1E3A', fontSize: '1.05rem' }}>Elegir dirección</h3>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.92rem' }}>Escribe la dirección o haz clic en el mapa. La app rellenará la ciudad, el departamento y el código postal automáticamente.</p>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', cursor: 'pointer', color: '#444' }}>×</button>
        </div>

        <div style={{ display: 'grid', gap: '10px', marginBottom: '12px' }}>
          <label style={{ display: 'grid', gap: '6px' }}>
            <span style={{ fontSize: '0.9rem', color: '#444', fontWeight: 600 }}>Dirección</span>
            <input value={addressText} onChange={(e) => setAddressText(e.target.value)} placeholder="Ej. Carrera 7 # 45-67, Bogotá" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d7d2c7' }} />
          </label>
          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '0.9rem', color: '#444', fontWeight: 600 }}>Ciudad</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d7d2c7' }} />
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '0.9rem', color: '#444', fontWeight: 600 }}>Departamento</span>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Departamento" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d7d2c7' }} />
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '0.9rem', color: '#444', fontWeight: 600 }}>Código postal</span>
              <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Código postal" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d7d2c7' }} />
            </label>
          </div>
        </div>

        <div style={{ width: '100%', height: '320px', borderRadius: '10px', border: '1px solid #d7d2c7', marginTop: '12px', overflow: 'hidden' }}>
          <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} whenCreated={(map) => { mapRef.current = map; }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <Marker position={mapCenter} icon={icon} />
            <MapClickHandler onSelect={handleMapSelect} />
          </MapContainer>
        </div>

        {loading ? <p style={{ marginTop: '10px', color: '#7A1E3A' }}>Buscando la dirección…</p> : null}
        {error ? <p style={{ marginTop: '10px', color: '#b42318' }}>{error}</p> : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button type="button" onClick={onClose} style={{ border: '1px solid #d7d2c7', background: '#fff', color: '#444', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
          <button type="button" onClick={handleUseManualAddress} style={{ background: 'var(--vinotinto)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Usar esta dirección</button>
        </div>
      </div>
    </div>
  );
}
