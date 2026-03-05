import React from "react";
import { useLocation } from "react-router-dom";
import BrowseBuyerRequests from "../components/BrowseBuyerRequests";

const BrowseBuyerRequestsPage: React.FC = () => {
  const location = useLocation();
  const marketType =
    new URLSearchParams(location.search).get("marketType") === "b2b"
      ? "b2b"
      : "standard";

  return <BrowseBuyerRequests marketType={marketType} />;
};

export default BrowseBuyerRequestsPage;
