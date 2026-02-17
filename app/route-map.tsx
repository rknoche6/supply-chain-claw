"use client";

import { ComposableMap, Geographies, Geography, Line, Marker } from "react-simple-maps";

type RouteMapProps = {
  routes: { id: string; product: string; stops: string[] }[];
  selectedRouteId: string | null;
};

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const portCoordinates: Record<string, [number, number]> = {
  Taipei: [121.56, 25.04],
  "Los Angeles": [-118.24, 34.05],
  Chicago: [-87.62, 41.88],
  Hsinchu: [120.97, 24.8],
  Singapore: [103.82, 1.35],
  Rotterdam: [4.48, 51.92],
  Callao: [-77.15, -12.06],
  Shanghai: [121.47, 31.23],
  Perth: [115.86, -31.95],
  Ningbo: [121.55, 29.87],
  Guayaquil: [-79.89, -2.17],
  Novorossiysk: [37.77, 44.72],
  Alexandria: [29.92, 31.2],
  Qatar: [51.53, 25.29],
  Yokohama: [139.64, 35.44],
};

export default function RouteMap({ routes, selectedRouteId }: RouteMapProps) {
  const filteredRoutes = routes
    .map((route) => ({
      ...route,
      points: route.stops.map((stop) => portCoordinates[stop]).filter(Boolean),
    }))
    .filter((route) => route.points.length > 1);

  const selectedRoute =
    selectedRouteId === null ? null : filteredRoutes.find((route) => route.id === selectedRouteId) ?? null;

  const uniquePorts = Array.from(
    new Set(filteredRoutes.flatMap((route) => route.stops).filter((stop) => portCoordinates[stop]))
  );

  const highlightedPorts = selectedRoute ? selectedRoute.stops : uniquePorts;

  return (
    <div
      className="mapFrame mapFrame--enhanced"
      role="img"
      aria-label="Map of filtered supply routes"
    >
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 135 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: "#182744", stroke: "#31528f", strokeWidth: 0.35 },
                  hover: { fill: "#22345e", stroke: "#3d63a8", strokeWidth: 0.35 },
                  pressed: { fill: "#22345e", stroke: "#3d63a8", strokeWidth: 0.35 },
                }}
              />
            ))
          }
        </Geographies>

        {filteredRoutes.map((route, index) => {
          const isSelected = selectedRoute === null || route.id === selectedRoute.id;

          return route.points.slice(1).map((end, i) => {
            const start = route.points[i];
            return (
              <Line
                key={`${route.id}-${i}`}
                from={start}
                to={end}
                stroke={isSelected ? "#7fd1ff" : "#5b84b5"}
                strokeWidth={isSelected ? 1.8 + (index % 2) * 0.5 : 1}
                strokeLinecap="round"
                strokeOpacity={isSelected ? 0.82 : 0.2}
              />
            );
          });
        })}

        {highlightedPorts.map((port) => (
          <Marker key={port} coordinates={portCoordinates[port]}>
            <circle
              r={selectedRoute ? 2.8 : 2.4}
              fill="#ffe28a"
              stroke="#f4b42c"
              strokeWidth={0.7}
            />
          </Marker>
        ))}
      </ComposableMap>

      <div className="mapLegend">
        <span>
          Routes: <strong>{filteredRoutes.length}</strong>
        </span>
        <span>
          Ports: <strong>{highlightedPorts.length}</strong>
        </span>
      </div>
    </div>
  );
}
