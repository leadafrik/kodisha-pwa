import React from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import GoogleMapsLoader from "./GoogleMapsLoader";

const containerStyle = {
  width: "100%",
  height: "250px",
  borderRadius: "12px",
  overflow: "hidden",
};

const ListingMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const center = { lat, lng };

  return (
    <GoogleMapsLoader>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
        <Marker position={center} />
      </GoogleMap>
    </GoogleMapsLoader>
  );
};

export default ListingMap;
