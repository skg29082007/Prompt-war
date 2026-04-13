import { useEffect, useRef, useState } from "react";
import { initHeatmap } from "@/lib/maps";

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  label?: string;
}

interface GoogleMapsHeatmapProps {
  points: HeatmapPoint[];
  className?: string;
}

export default function GoogleMapsHeatmap({ points, className }: GoogleMapsHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Google Maps API key not configured");
      return;
    }

    initHeatmap(containerRef.current, points)
      .then(() => setLoaded(true))
      .catch((err) => {
        console.error("Maps init error", err);
        setError("Could not load Google Maps");
      });
  }, [points]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-[#0d1b2a] rounded-lg text-blue-400 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1b2a] rounded-lg z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-400 text-sm">Loading Google Maps...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full rounded-lg" />
    </div>
  );
}
