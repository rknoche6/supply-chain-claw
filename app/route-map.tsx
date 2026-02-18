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

type PortMarkerSummary = {
  name: string;
  coordinates: [number, number];
  startCount: number;
  endCount: number;
  transitCount: number;
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

  const portMarkers = useMemo(() => {
    const markerSummary = new Map<string, PortMarkerSummary>();

    const sourceRoutes = selectedRoute ? [selectedRoute] : normalizedRoutes;

    for (const route of sourceRoutes) {
      for (let index = 0; index < route.stops.length; index += 1) {
        const stop = route.stops[index];
        const coordinates = portCoordinates[stop];

        if (!coordinates) {
          continue;
        }

        const existing = markerSummary.get(stop) ?? {
          name: stop,
          coordinates,
          startCount: 0,
          endCount: 0,
          transitCount: 0,
        };

        if (index === 0) {
          existing.startCount += 1;
        } else if (index === route.stops.length - 1) {
          existing.endCount += 1;
        } else {
          existing.transitCount += 1;
        }

        markerSummary.set(stop, existing);
      }
    }

    return Array.from(markerSummary.values());
  }, [normalizedRoutes, selectedRoute]);

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

  const selectedRouteExchangeSummary = useMemo(() => {
    if (!selectedRoute || selectedRoute.stops.length < 2) {
      return null;
    }

    const origin = selectedRoute.stops[0];
    const destination = selectedRoute.stops[selectedRoute.stops.length - 1];
    const transitStops = selectedRoute.stops.slice(1, -1);

    return {
      origin,
      destination,
      transitStops,
      totalLegs: selectedRoute.stops.length - 1,
    };
  }, [selectedRoute]);

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

        {portMarkers.map((port) => {
          const isStartOnly = port.startCount > 0 && port.endCount === 0;
          const isEndOnly = port.endCount > 0 && port.startCount === 0;
          const isDualRole = port.startCount > 0 && port.endCount > 0;

          const markerFill = isDualRole
            ? "#d7b7ff"
            : isStartOnly
              ? "#87d4ff"
              : isEndOnly
                ? "#ffb0c0"
                : "#ffe28a";
          const markerStroke = isDualRole
            ? "#8f5fe8"
            : isStartOnly
              ? "#2d9fda"
              : isEndOnly
                ? "#d04f72"
                : "#f4b42c";

          return (
            <Marker key={port.name} coordinates={port.coordinates}>
              <circle
                r={selectedRoute ? 3.2 : 2.8}
                fill={markerFill}
                stroke={markerStroke}
                strokeWidth={0.8}
              />
            </Marker>
          );
        })}
      </ComposableMap>

      <div className="mapLegend mapLegend--blocks" aria-label="Material category color legend">
        {(Object.keys(categoryColor) as Array<keyof typeof categoryColor>).map((category) => (
          <span key={`legend-${category}`} className="mapLegendItem">
            <span className="mapLegendDot" style={{ backgroundColor: categoryColor[category] }} />
            {category}
          </span>
        ))}
      </div>

      <div className="mapLegend mapLegend--blocks" aria-label="Port role legend">
        <span className="mapLegendItem">
          <span className="mapLegendDot" style={{ backgroundColor: "#87d4ff" }} />
          Export handoff (start)
        </span>
        <span className="mapLegendItem">
          <span className="mapLegendDot" style={{ backgroundColor: "#ffb0c0" }} />
          Import handoff (end)
        </span>
        <span className="mapLegendItem">
          <span className="mapLegendDot" style={{ backgroundColor: "#ffe28a" }} />
          Transit checkpoint
        </span>
        <span className="mapLegendItem">
          <span className="mapLegendDot" style={{ backgroundColor: "#d7b7ff" }} />
          Dual-role hub
        </span>
      </div>

      <div className="mapLegend">
        <span>
          Routes: <strong>{normalizedRoutes.length}</strong>
        </span>
        <span>
          Ports: <strong>{portMarkers.length}</strong>
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

      {selectedRouteExchangeSummary ? (
        <div className="mapRouteDetail" role="status" aria-live="polite">
          <p>
            <strong>Selected exchange direction</strong>
          </p>
          <p>
            <strong>{selectedRouteExchangeSummary.origin}</strong> (origin handoff) →{" "}
            <strong>{selectedRouteExchangeSummary.destination}</strong> (destination handoff)
          </p>
          <p>
            Route legs: <strong>{selectedRouteExchangeSummary.totalLegs}</strong> · Transit hubs:{" "}
            <strong>{selectedRouteExchangeSummary.transitStops.length}</strong>
            {selectedRouteExchangeSummary.transitStops.length > 0
              ? ` (${selectedRouteExchangeSummary.transitStops.join(" → ")})`
              : " (direct lane)"}
          </p>
        </div>
      ) : null}

      <p className="sectionIntro">
        Tap or hover a route segment for material + corridor details. Port markers show export
        start, import end, and transit checkpoints.
      </p>

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
