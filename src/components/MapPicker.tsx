import React, { useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

interface MapPickerProps {
  onChange: (coords: { lat: number; lng: number }) => void;
  defaultCenter?: { lat: number; lng: number };
}

const containerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "12px",
  overflow: "hidden",
};

const defaultLocation = {
  lat: -1.286389, // Nairobi
  lng: 36.817223,
};

const MapPicker: React.FC<MapPickerProps> = ({
  onChange,
  defaultCenter = defaultLocation,
}) => {
  const [marker, setMarker] = useState(defaultCenter);

  const handleClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const coords = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };
    setMarker(coords);
    onChange(coords);
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={marker}
      zoom={13}
      onClick={handleClick}
    >
      <Marker position={marker} />
    </GoogleMap>
  );
};

export default MapPicker;
