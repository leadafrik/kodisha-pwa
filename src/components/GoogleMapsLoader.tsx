import React from "react";
import { LoadScript } from "@react-google-maps/api";

interface Props {
  children: React.ReactNode;
}

const GoogleMapsLoader: React.FC<Props> = ({ children }) => {
  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ""}>
      {children}
    </LoadScript>
  );
};

export default GoogleMapsLoader;
