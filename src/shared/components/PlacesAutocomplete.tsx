import React, { useEffect, useRef, useState } from 'react';

export interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  photo_url: string | null;
  google_maps_url: string;
  place_types: string[];
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  types?: string[];
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
  }
}

export const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({ 
  value, onChange, onPlaceSelect, placeholder = 'Search location...', types = ['establishment'], className 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(!!window.google?.maps?.places);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    const scriptId = 'google-maps-places-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
      script.async = true;
      script.defer = true;
      window.initAutocomplete = () => setIsApiLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (isApiLoaded) {
      initAutocomplete();
    }
  }, [isApiLoaded, types]);

  const initAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types,
      fields: ['name', 'formatted_address', 'geometry', 'rating', 'photos', 'types', 'url', 'website']
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) return;

      const result: PlaceResult = {
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        rating: place.rating || null,
        photo_url: place.photos?.[0]?.getUrl({ maxWidth: 400 }) || null,
        google_maps_url: place.url,
        place_types: place.types || []
      };

      onPlaceSelect(result);
    });
  };

  return (
    <input
      ref={inputRef}
      type="text"
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};
