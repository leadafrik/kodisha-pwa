import React, { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  extractPlaceSelection,
  isGoogleMapsConfigured,
  loadGoogleMapsPlacesApi,
  type GooglePlaceSelection,
} from "../utils/googleMaps";

interface GooglePlacesInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (selection: GooglePlaceSelection) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

const GooglePlacesInput: React.FC<GooglePlacesInputProps> = ({
  label,
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Search a market, landmark, or address",
  helperText = "Search once to auto-fill county, constituency, ward, and the exact place.",
  disabled = false,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const listenerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    let cancelled = false;

    const initializeAutocomplete = async () => {
      if (disabled || !inputRef.current) return;

      if (!isGoogleMapsConfigured()) {
        setLoadError("Google Maps search is not configured. Use the manual location fields below.");
        return;
      }

      try {
        const google = await loadGoogleMapsPlacesApi();
        if (cancelled || !inputRef.current) return;

        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "ke" },
          fields: ["address_components", "formatted_address", "geometry", "name"],
        });

        listenerRef.current = autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace?.();
          if (!place) return;
          const selection = extractPlaceSelection(place);
          if (selection.countryCode && selection.countryCode !== "KE") {
            setLoadError("Please select a location within Kenya.");
            return;
          }
          onChangeRef.current(
            selection.formattedAddress || selection.approximateLocation || ""
          );
          onPlaceSelectedRef.current(selection);
          setLoadError(null);
        });

        setLoadError(null);
      } catch (error: any) {
        if (!cancelled) {
          setLoadError(
            error?.message || "Google Maps search failed to load. Use the manual location fields below."
          );
        }
      }
    };

    void initializeAutocomplete();

    return () => {
      cancelled = true;
      const browserWindow = window as any;
      if (listenerRef.current && browserWindow.google?.maps?.event) {
        browserWindow.google.maps.event.removeListener(listenerRef.current);
      }
      listenerRef.current = null;
      autocompleteRef.current = null;
    };
  }, [disabled]);

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-stone-900">{label}</label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="ui-input pl-10 disabled:bg-slate-100"
        />
      </div>
      <p className={`mt-2 text-xs ${loadError ? "text-amber-700" : "text-stone-500"}`}>
        {loadError || helperText}
      </p>
    </div>
  );
};

export default GooglePlacesInput;
