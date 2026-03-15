const GOOGLE_MAPS_SCRIPT_ID = "agrisoko-google-maps-script";
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

let googleMapsLoader: Promise<any> | null = null;

export interface GooglePlaceSelection {
  formattedAddress: string;
  approximateLocation: string;
  countryCode?: string;
  county?: string;
  constituency?: string;
  ward?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const getGoogleMapsWindow = () => (window as any);

const getAddressComponent = (place: any, supportedTypes: string[]) => {
  const components = Array.isArray(place?.address_components)
    ? place.address_components
    : [];

  return (
    components.find((component: any) =>
      supportedTypes.some((type) => component?.types?.includes(type))
    ) || null
  );
};

const cleanAdministrativeLabel = (value?: string) =>
  String(value || "")
    .replace(/\bcounty\b/gi, "")
    .replace(/\bconstituency\b/gi, "")
    .replace(/\bward\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeLocationToken = (value?: string) =>
  cleanAdministrativeLabel(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const matchLocationCandidate = (
  candidate: string | undefined,
  options: Array<string | { value: string; label?: string }>
): string | undefined => {
  const normalizedCandidate = normalizeLocationToken(candidate);
  if (!normalizedCandidate) return undefined;

  const mappedOptions = options.map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : { value: option.value, label: option.label || option.value }
  );

  const exact = mappedOptions.find(
    (option) => normalizeLocationToken(option.label) === normalizedCandidate
  );
  if (exact) return exact.value;

  const inclusive = mappedOptions.find((option) => {
    const normalizedOption = normalizeLocationToken(option.label);
    return (
      normalizedOption.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedOption)
    );
  });

  return inclusive?.value;
};

export const isGoogleMapsConfigured = () => Boolean(GOOGLE_MAPS_API_KEY);

const ensurePlacesLibrary = async (googleMaps: any) => {
  if (googleMaps?.maps?.places) {
    return googleMaps;
  }

  if (typeof googleMaps?.maps?.importLibrary === "function") {
    // With loading=async, importLibrary returns the library object but does NOT
    // automatically populate google.maps.places. Assign it manually so the
    // classic google.maps.places.Autocomplete API continues to work.
    const placesLib = await googleMaps.maps.importLibrary("places");
    if (placesLib && googleMaps?.maps && !googleMaps.maps.places) {
      googleMaps.maps.places = placesLib;
    }
  }

  if (googleMaps?.maps?.places) {
    return googleMaps;
  }

  throw new Error("Google Maps loaded without Places library.");
};

export const loadGoogleMapsPlacesApi = async (): Promise<any> => {
  if (typeof window === "undefined") {
    throw new Error("Google Maps is only available in the browser.");
  }

  const browserWindow = getGoogleMapsWindow();
  if (browserWindow.google?.maps?.places) {
    return browserWindow.google;
  }

  if (browserWindow.google?.maps) {
    return ensurePlacesLibrary(browserWindow.google);
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured.");
  }

  if (googleMapsLoader) {
    return googleMapsLoader;
  }

  googleMapsLoader = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID
    ) as HTMLScriptElement | null;

    const handleLoad = async () => {
      try {
        resolve(await ensurePlacesLibrary(browserWindow.google));
      } catch (error) {
        reject(error);
      }
    };

    const handleError = () => reject(new Error("Failed to load Google Maps."));

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY
    )}&libraries=places&loading=async&region=KE&language=en`;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    googleMapsLoader = null;
    throw error;
  });

  return googleMapsLoader;
};

export const extractPlaceSelection = (place: any): GooglePlaceSelection => {
  const geometryLocation = place?.geometry?.location;
  const formattedAddress =
    String(place?.formatted_address || place?.name || "").trim();
  const countryComponent = getAddressComponent(place, ["country"]);
  const sublocality =
    getAddressComponent(place, [
      "sublocality_level_1",
      "sublocality",
      "administrative_area_level_3",
      "locality",
    ])?.long_name || "";
  const ward =
    getAddressComponent(place, [
      "administrative_area_level_4",
      "sublocality_level_2",
      "neighborhood",
      "political",
    ])?.long_name || "";
  const county =
    getAddressComponent(place, ["administrative_area_level_1"])?.long_name || "";
  const approximateLocation =
    formattedAddress ||
    cleanAdministrativeLabel(
      [place?.name, sublocality, ward].filter(Boolean).join(", ")
    );

  return {
    formattedAddress,
    approximateLocation,
    countryCode: String(countryComponent?.short_name || "").trim().toUpperCase() || undefined,
    county: cleanAdministrativeLabel(county),
    constituency: cleanAdministrativeLabel(sublocality),
    ward: cleanAdministrativeLabel(ward),
    coordinates:
      geometryLocation &&
      typeof geometryLocation.lat === "function" &&
      typeof geometryLocation.lng === "function"
        ? {
            lat: geometryLocation.lat(),
            lng: geometryLocation.lng(),
          }
        : undefined,
  };
};

export const reverseGeocodeCoordinates = async (
  latitude: number,
  longitude: number
): Promise<GooglePlaceSelection> => {
  const googleMaps = await loadGoogleMapsPlacesApi();

  return new Promise((resolve, reject) => {
    const geocoder = new googleMaps.maps.Geocoder();

    geocoder.geocode(
      {
        location: { lat: latitude, lng: longitude },
        region: "KE",
      },
      (results: any, status: any) => {
        if (status !== "OK" || !Array.isArray(results) || !results.length) {
          reject(new Error("We could not match your current location to a place in Kenya."));
          return;
        }

        const selection = extractPlaceSelection(results[0]);
        resolve({
          ...selection,
          coordinates: { lat: latitude, lng: longitude },
        });
      }
    );
  });
};
