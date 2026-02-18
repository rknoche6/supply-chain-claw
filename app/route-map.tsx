"use client";

import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Line, Marker } from "react-simple-maps";

type MappedRoute = {
  id: string;
  product: string;
  category: "Semiconductors" | "Raw Materials" | "Agriculture" | "Energy";
  stops: string[];
  matchesCountryFilter: boolean;
};

type RouteMapProps = {
  routes: MappedRoute[];
  selectedRouteId: string | null;
  selectedCountry: string | null;
};

type RouteSegment = {
  routeId: string;
  product: string;
  category: MappedRoute["category"];
  fromName: string;
  toName: string;
  from: [number, number];
  to: [number, number];
  isSelectedRoute: boolean;
  matchesCountryFilter: boolean;
};

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const categoryColor: Record<MappedRoute["category"], string> = {
  Semiconductors: "#78c8ff",
  "Raw Materials": "#ffc857",
  Agriculture: "#98f5c9",
  Energy: "#ff8fa3",
};

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

export default function RouteMap({ routes, selectedRouteId, selectedCountry }: RouteMapProps) {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const normalizedRoutes = useMemo(
    () =>
      routes
        .map((route) => ({
          ...route,
          points: route.stops.map((stop) => portCoordinates[stop]).filter(Boolean),
        }))
        .filter((route) => route.points.length > 1),
    [routes]
  );

  const selectedRoute =
    selectedRouteId === null
      ? null
      : (normalizedRoutes.find((route) => route.id === selectedRouteId) ?? null);

  const segments = useMemo(() => {
    const rows: RouteSegment[] = [];

    for (const route of normalizedRoutes) {
      for (let i = 1; i < route.points.length; i += 1) {
        rows.push({
          routeId: route.id,
          product: route.product,
          category: route.category,
          fromName: route.stops[i - 1],
          toName: route.stops[i],
          from: route.points[i - 1],
          to: route.points[i],
          isSelectedRoute: selectedRouteId === null || route.id === selectedRouteId,
          matchesCountryFilter: route.matchesCountryFilter,
        });
      }
    }

    return rows;
  }, [normalizedRoutes, selectedRouteId]);

  const activeSegment =
    activeSegmentId === null
      ? null
      : (segments.find((segment, index) => `${segment.routeId}-${index}` === activeSegmentId) ??
        null);

  const uniquePorts = Array.from(
    new Set(
      normalizedRoutes.flatMap((route) => route.stops).filter((stop) => portCoordinates[stop])
    )
  );

  const highlightedPorts = selectedRoute ? selectedRoute.stops : uniquePorts;

  const segmentCoverage = useMemo(() => {
    const emphasizedSegments = segments.filter(
      (segment) =>
        segment.isSelectedRoute && (selectedCountry ? segment.matchesCountryFilter : true)
    ).length;

    return {
      totalSegments: segments.length,
      emphasizedSegments,
      contextualSegments: Math.max(0, segments.length - emphasizedSegments),
    };
  }, [segments, selectedCountry]);

  return (
    <div
      className="mapFrame mapFrame--enhanced"
      role="img"
      aria-label="Map of filtered supply routes with material color legend"
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

        {segments.map((segment, index) => {
          const segmentId = `${segment.routeId}-${index}`;
          const isActive = activeSegmentId === segmentId;
          const shouldEmphasize =
            segment.isSelectedRoute && (selectedCountry ? segment.matchesCountryFilter : true);
          const color = categoryColor[segment.category];

          return (
            <Line
              key={segmentId}
              from={segment.from}
              to={segment.to}
              stroke={color}
              strokeWidth={isActive ? 3 : shouldEmphasize ? 2.2 : 1}
              strokeLinecap="round"
              strokeOpacity={isActive ? 1 : shouldEmphasize ? 0.84 : 0.18}
              onMouseEnter={() => setActiveSegmentId(segmentId)}
              onMouseLeave={() => setActiveSegmentId((prev) => (prev === segmentId ? null : prev))}
              onClick={() => setActiveSegmentId(segmentId)}
            />
          );
        })}

        {highlightedPorts.map((port) => (
          <Marker key={port} coordinates={portCoordinates[port]}>
            <circle
              r={selectedRoute ? 3.2 : 2.8}
              fill="#ffe28a"
              stroke="#f4b42c"
              strokeWidth={0.8}
            />
          </Marker>
        ))}
      </ComposableMap>

      <div className="mapLegend mapLegend--blocks" aria-label="Material category color legend">
        {(Object.keys(categoryColor) as Array<keyof typeof categoryColor>).map((category) => (
          <span key={`legend-${category}`} className="mapLegendItem">
            <span className="mapLegendDot" style={{ backgroundColor: categoryColor[category] }} />
            {category}
          </span>
        ))}
      </div>

      <div className="mapLegend">
        <span>
          Routes: <strong>{normalizedRoutes.length}</strong>
        </span>
        <span>
          Ports: <strong>{highlightedPorts.length}</strong>
        </span>
        <span>
          Country highlight: <strong>{selectedCountry ?? "Off"}</strong>
        </span>
      </div>

      <div className="mapLegend" aria-label="Route emphasis legend">
        <span>
          Emphasized segments: <strong>{segmentCoverage.emphasizedSegments}</strong>
          {segmentCoverage.totalSegments > 0 ? ` / ${segmentCoverage.totalSegments}` : ""}
        </span>
        <span>
          Context segments: <strong>{segmentCoverage.contextualSegments}</strong>
        </span>
        <span>
          Line weight guide: <strong>bold = active focus</strong>, thin = background context
        </span>
      </div>

      <p className="sectionIntro">Tap or hover a route segment for material + corridor details.</p>
      {activeSegment ? (
        <div className="mapRouteDetail" role="status" aria-live="polite">
          <p>
            <strong>{activeSegment.product}</strong> · {activeSegment.category}
          </p>
          <p>
            {activeSegment.fromName} → {activeSegment.toName}
          </p>
        </div>
      ) : null}
    </div>
  );
}
