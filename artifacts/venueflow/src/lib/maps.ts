import { Loader } from "@googlemaps/js-api-loader";

let loaderInstance: Loader | null = null;
let loadedLibraries: Set<string> = new Set();

export function getMapsLoader(): Loader {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
      version: "weekly",
      libraries: ["maps", "visualization"],
    });
  }
  return loaderInstance;
}

export async function loadMapsLibrary(library: string) {
  const loader = getMapsLoader();
  if (!loadedLibraries.has(library)) {
    await loader.importLibrary(library as Parameters<typeof loader.importLibrary>[0]);
    loadedLibraries.add(library);
  }
}

export async function initHeatmap(
  container: HTMLElement,
  points: Array<{ lat: number; lng: number; weight: number }>,
) {
  const { Map } = (await getMapsLoader().importLibrary("maps")) as google.maps.MapsLibrary;
  const { HeatmapLayer } = (await getMapsLoader().importLibrary(
    "visualization",
  )) as google.maps.VisualizationLibrary;

  const center = { lat: 34.0136, lng: -118.2878 };
  const map = new Map(container, {
    zoom: 16,
    center,
    mapTypeId: "satellite",
    disableDefaultUI: true,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#0d1b2a" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#3b82f6" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#0d1b2a" }] },
    ],
  });

  const heatmapData = points.map(
    (p) =>
      new google.maps.LatLng(p.lat + (Math.random() - 0.5) * 0.002, p.lng + (Math.random() - 0.5) * 0.002),
  );

  const heatmap = new HeatmapLayer({
    data: heatmapData.map((pos, i) => ({
      location: pos,
      weight: points[i]?.weight ?? 1,
    })),
    map,
    radius: 40,
    opacity: 0.8,
    gradient: [
      "rgba(0, 100, 255, 0)",
      "rgba(0, 100, 255, 0.6)",
      "rgba(0, 200, 255, 0.8)",
      "rgba(255, 200, 0, 0.9)",
      "rgba(255, 100, 0, 1)",
      "rgba(255, 0, 0, 1)",
    ],
  });

  return { map, heatmap };
}
