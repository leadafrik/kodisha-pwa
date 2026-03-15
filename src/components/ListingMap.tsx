import React from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "250px",
  borderRadius: "12px",
  overflow: "hidden",
};

const ListingMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const center = { lat, lng };

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
      <Marker position={center} />
    </GoogleMap>
  );
};

export default ListingMap;
