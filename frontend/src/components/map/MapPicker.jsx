import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Button, Stack } from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { useEffect, useState } from "react";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position && map) {
      map.setView(position, map.getZoom() || 15, {
        animate: true,
      });
    }
  }, [position, map]);

  return null;
}

export default function MapPicker({ open, onClose, onSelect }) {
  const [position, setPosition] = useState([28.6139, 77.209]);
  const [loading, setLoading] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported in this browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setPosition([latitude, longitude]);

        setLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Location permission denied or unavailable");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const confirmLocation = async () => {
    const [lat, lng] = position;
    let address = "Selected location";

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const data = await res.json();
      address = data?.display_name || address;
    } catch (err) {
      console.warn("Reverse geocoding failed");
    }

    onSelect([lng, lat], address);
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        background: "#000000aa",
        zIndex: 2000,
      }}
    >
      <Box sx={{ height: "100%", position: "relative" }}>
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <RecenterMap position={position} />

          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={position}
            draggable
            icon={markerIcon}
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();
                setPosition([p.lat, p.lng]);
              },
            }}
          />
        </MapContainer>

        <Stack
          spacing={1}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<MyLocationIcon />}
            onClick={useMyLocation}
            disabled={loading}
          >
            {loading ? "Locating..." : "My Location"}
          </Button>

          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={confirmLocation}
          >
            OK
          </Button>

          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={onClose}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
