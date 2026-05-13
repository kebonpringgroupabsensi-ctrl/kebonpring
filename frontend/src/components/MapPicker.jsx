import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Navigation, X, Check, Search as SearchIcon } from 'lucide-react';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

// Fix for default marker icons in Leaflet + Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Sub-component: Search Bar ---
function SearchControl({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const provider = useMemo(() => new OpenStreetMapProvider(), []);
  const map = useMap();

  const performSearch = async (q) => {
    if (!q || q.length < 3) return;
    setIsSearching(true);
    try {
      const searchResults = await provider.search({ query: q });
      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search for suggestions
  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 600);
    return () => clearTimeout(timer);
  }, [query]);

  const selectResult = (result) => {
    const { x, y, label } = result;
    map.flyTo([y, x], 16, { animate: true, duration: 1.5 });
    onSelect({ lat: y, lng: x, label });
    setResults([]);
    setQuery(label);
  };

  return (
    <div className="map-search-container">
      <form 
        className="map-search-form" 
        onSubmit={(e) => {
          e.preventDefault();
          performSearch(query);
        }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Cari lokasi atau alamat..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingLeft: '2.5rem' }}
        />
        <SearchIcon size={18} className="map-search-icon" />
        <button type="submit" className="map-search-btn">
          {isSearching ? <div className="loader" style={{ width: '16px', height: '16px' }} /> : 'Cari'}
        </button>
      </form>
      {results.length > 0 && (
        <div className="map-search-results">
          {results.map((r, i) => (
            <div key={i} className="map-search-item" onClick={() => selectResult(r)}>
              <MapPin size={14} className="text-primary" />
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Sub-component: Location Events ---
function MapEvents({ onMove }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng);
    },
  });
  return null;
}

// --- Sub-component: GPS Button ---
function GPSButton({ onLocationFound }) {
  const map = useMap();
  
  const handleClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.flyTo([newPos.lat, newPos.lng], 16, { animate: true, duration: 1.5 });
          onLocationFound(newPos);
        },
        (err) => {
          alert('Gagal mendapatkan lokasi: ' + err.message);
        }
      );
    } else {
      alert('Geolocation tidak didukung oleh browser ini.');
    }
  };

  return (
    <button 
      className="map-control-btn" 
      onClick={handleClick}
      title="Lokasi Saya"
      type="button"
    >
      <Navigation size={20} />
    </button>
  );
}

export default function MapPicker({ isOpen, onClose, onConfirm, initialLocation }) {
  const [position, setPosition] = useState(initialLocation || { lat: -7.6298, lng: 111.5239 });
  const [address, setAddress] = useState('');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // Update position when initialLocation changes
  useEffect(() => {
    if (initialLocation) setPosition(initialLocation);
  }, [initialLocation]);

  // Reverse Geocoding: Fetch address when position changes
  useEffect(() => {
    const fetchAddress = async () => {
      setIsFetchingAddress(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        if (data.display_name) {
          setAddress(data.display_name);
        }
      } catch (err) {
        console.error('Reverse geocoding error:', err);
      } finally {
        setIsFetchingAddress(false);
      }
    };

    const timer = setTimeout(fetchAddress, 1000); // 1s delay to avoid too many requests
    return () => clearTimeout(timer);
  }, [position]);

  const handleConfirm = () => {
    onConfirm({ ...position, address });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '900px', width: '95vw', height: '85vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={22} className="text-primary" />
              Pilih Lokasi Cabang
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Geser marker atau klik pada peta untuk menentukan koordinat.</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Map Area */}
        <div style={{ flex: 1, position: 'relative', background: '#000' }}>
          <MapContainer 
            center={[position.lat, position.lng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles-dark" // We'll add CSS for this
            />
            
            <SearchControl onSelect={(pos) => setPosition({ lat: pos.lat, lng: pos.lng })} />
            
            <Marker 
              position={[position.lat, position.lng]} 
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const newPos = marker.getLatLng();
                  setPosition({ lat: newPos.lat, lng: newPos.lng });
                },
              }}
            />
            
            <MapEvents onMove={(latlng) => setPosition({ lat: latlng.lat, lng: latlng.lng })} />
            
            {/* Custom Controls Overlay */}
            <div className="map-custom-controls">
              <GPSButton onLocationFound={(pos) => setPosition(pos)} />
            </div>
          </MapContainer>
        </div>

        {/* Footer / Selected Info */}
        <div className="modal-footer" style={{ padding: '1rem 1.5rem', background: 'var(--surface)', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.25rem' }}>Alamat Terpilih:</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isFetchingAddress ? <div className="loader" style={{ width: '14px', height: '14px' }} /> : <MapPin size={14} />}
              <span style={{ lineHeight: 1.4 }}>{address || 'Mencari alamat...'}</span>
            </div>
          </div>

          <div className="map-coordinates-display">
            <div className="coord-item">
              <span className="label">Lat</span>
              <span className="value">{position.lat.toFixed(5)}</span>
            </div>
            <div className="coord-item">
              <span className="label">Lng</span>
              <span className="value">{position.lng.toFixed(5)}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-ghost" onClick={onClose}>Batal</button>
            <button className="action-btn" onClick={handleConfirm} disabled={isFetchingAddress}>
              <Check size={18} /> Konfirmasi Lokasi
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .map-search-container {
          position: absolute;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          width: 90%;
          max-width: 400px;
        }
        .map-search-form {
          display: flex;
          gap: 0.5rem;
          background: var(--surface);
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          border: 1px solid var(--surface-border);
        }
        .map-search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .map-search-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0 1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .map-search-results {
          margin-top: 0.5rem;
          background: var(--surface);
          border-radius: 12px;
          max-height: 200px;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          border: 1px solid var(--surface-border);
        }
        .map-search-item {
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.85rem;
          border-bottom: 1px solid var(--surface-border);
          color: var(--text-main);
        }
        .map-search-item:hover {
          background: var(--surface-hover);
        }
        .map-custom-controls {
          position: absolute;
          bottom: 2rem;
          right: 1rem;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .map-control-btn {
          width: 44px;
          height: 44px;
          background: var(--surface);
          border: 1px solid var(--surface-border);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-main);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .map-control-btn:hover {
          background: var(--surface-hover);
          color: var(--primary);
        }
        .map-coordinates-display {
          display: flex;
          gap: 1.5rem;
        }
        .coord-item {
          display: flex;
          flex-direction: column;
        }
        .coord-item .label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 700;
        }
        .coord-item .value {
          font-family: monospace;
          font-size: 1rem;
          color: var(--primary);
          font-weight: 700;
        }
        /* Dark map style */
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}} />
    </div>,
    document.body
  );
}
