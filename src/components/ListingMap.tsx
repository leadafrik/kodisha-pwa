import React, { useEffect, useRef, useState } from "react";
import { isGoogleMapsConfigured, loadGoogleMapsPlacesApi } from "../utils/googleMaps";

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "250px",
  borderRadius: "12px",
  overflow: "hidden",
};

const ListingMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!isGoogleMapsConfigured()) {
      setError("Map unavailable.");
      return;
    }

    let cancelled = false;

    const initMap = async () => {
      try {
        const google = await loadGoogleMapsPlacesApi();
        if (cancelled || !mapRef.current) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        new google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
        });
      } catch {
        if (!cancelled) setError("Map failed to load.");
      }
    };

    void initMap();

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (error) {
    return (
      <div
        style={{
          ...containerStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
          color: "#64748b",
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }

  return <div ref={mapRef} style={containerStyle} />;
};

export default ListingMap;
