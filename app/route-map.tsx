"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Line, Marker } from "react-simple-maps";
import { type RawMaterialItem } from "../lib/raw-materials";

type MappedRoute = {
  id: string;
  product: string;
  category: "Semiconductors" | "Raw Materials" | "Agriculture" | "Energy";
  stops: string[];
  matchesCountryFilter: boolean;
  materialMatchQuality?: "exact" | "partial" | "none";
  matchedMaterial?: RawMaterialItem | null;
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
  materialMatchQuality?: "exact" | "partial" | "none";
};

type PortMarkerSummary = {
  name: string;
  coordinates: [number, number];
  startCount: number;
  endCount: number;
  transitCount: number;
  exactCount: number;
  partialCount: number;
  noneCount: number;
  clarityPercent: number;
  totalRoutes: number;
};

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const categoryColor: Record<MappedRoute["category"], string> = {
  Semiconductors: "#78c8ff",
  "Raw Materials": "#ffc857",
  Agriculture: "#98f5c9",
  Energy: "#ff8fa3",
};

const clarityDashArray: Record<"exact" | "partial" | "none", string> = {
  exact: "none",
  partial: "4,3",
  none: "2,2",
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

// Calculate midpoint between two coordinates
function getMidpoint(from: [number, number], to: [number, number]): [number, number] {
  return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
}

// Calculate geographic bearing between two points in degrees
// Returns angle where 0 = North, 90 = East, 180 = South, 270 = West
function getGeographicBearing(from: [number, number], to: [number, number]): number {
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;

  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const deltaLng = ((toLng - fromLng) * Math.PI) / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearingRad = Math.atan2(y, x);
  const bearing = ((bearingRad * 180) / Math.PI + 360) % 360;

  // Convert to SVG rotation (0 = right/east, 90 = down/south)
  // Geographic bearing: 0 = North, 90 = East
  // SVG rotation: 0 = East, 90 = South
  // Adjust: SVG angle = 90 - geographic bearing
  return 90 - bearing;
}

// Directional arrow marker using Marker component for proper projection
type FlowArrowProps = {
  from: [number, number];
  to: [number, number];
  color: string;
  size: number;
  opacity: number;
};

// Port-to-port exchange clarity tooltip component
type ExchangeClarityTooltipProps = {
  segment: RouteSegment;
  portMarkers: PortMarkerSummary[];
  isVisible: boolean;
  matchedMaterial?: RawMaterialItem | null;
};

function ExchangeClarityTooltip({
  segment,
  portMarkers,
  isVisible,
  matchedMaterial,
}: ExchangeClarityTooltipProps) {
  if (!isVisible) return null;

  const fromPort = portMarkers.find((p) => p.name === segment.fromName);
  const toPort = portMarkers.find((p) => p.name === segment.toName);

  const fromClarity = fromPort?.clarityPercent ?? 0;
  const toClarity = toPort?.clarityPercent ?? 0;
  const combinedClarity = Math.round((fromClarity + toClarity) / 2);

  const clarityLabel =
    combinedClarity >= 80
      ? "Execution-ready"
      : combinedClarity >= 40
        ? "Validate before execution"
        : "Data gap - research needed";

  const clarityColor =
    combinedClarity >= 80 ? "#4ade80" : combinedClarity >= 40 ? "#fbbf24" : "#f87171";

  // Get top 3 producing countries for matched material
  const topProducers = matchedMaterial
    ? [...matchedMaterial.dataPoints].sort((a, b) => b.value - a.value).slice(0, 3)
    : [];

  const tooltipHeight = matchedMaterial ? 220 : 140;

  return (
    <g>
      {/* Tooltip background */}
      <rect
        x={10}
        y={10}
        width={280}
        height={tooltipHeight}
        rx={8}
        fill="#0f172a"
        stroke="#31528f"
        strokeWidth={1}
        opacity={0.95}
      />
      {/* Product name */}
      <text x={20} y={35} fill="#e2e8f0" fontSize={14} fontWeight={600}>
        {segment.product}
      </text>
      {/* Category */}
      <text x={20} y={55} fill="#94a3b8" fontSize={12}>
        {segment.category}
      </text>
      {/* Port-to-port clarity */}
      <text x={20} y={80} fill="#e2e8f0" fontSize={12}>
        Port clarity: {segment.fromName} ({fromClarity}%) → {segment.toName} ({toClarity}%)
      </text>
      {/* Combined clarity with color */}
      <text x={20} y={105} fill={clarityColor} fontSize={13} fontWeight={600}>
        Combined: {combinedClarity}% — {clarityLabel}
      </text>
      {/* Material match quality */}
      <text x={20} y={130} fill="#94a3b8" fontSize={11}>
        Material evidence:{" "}
        {segment.materialMatchQuality === "exact"
          ? "Exact match"
          : segment.materialMatchQuality === "partial"
            ? "Partial match"
            : "No direct match"}
      </text>

      {/* Linked Material Quick-View: Production data */}
      {matchedMaterial && (
        <>
          <line x1={20} y1={145} x2={270} y2={145} stroke="#31528f" strokeWidth={1} />
          <text x={20} y={165} fill="#78c8ff" fontSize={12} fontWeight={600}>
            Linked: {matchedMaterial.name}
          </text>
          <text x={20} y={182} fill="#94a3b8" fontSize={10}>
            Top producers ({matchedMaterial.dataPoints[0]?.year}):
          </text>
          {topProducers.map((point, index) => (
            <text key={point.country} x={20} y={200 + index * 16} fill="#e2e8f0" fontSize={10}>
              {index + 1}. {point.country}: {point.value.toLocaleString()} {point.unit}
            </text>
          ))}
        </>
      )}
    </g>
  );
}

function FlowArrow({ from, to, color, size, opacity }: FlowArrowProps) {
  const bearing = useMemo(() => getGeographicBearing(from, to), [from, to]);
  const midpoint = useMemo(() => getMidpoint(from, to), [from, to]);

  return (
    <Marker coordinates={midpoint}>
      <g transform={`rotate(${bearing})`} opacity={opacity}>
        <polygon points={`0,0 ${-size},${-size / 2} ${-size},${size / 2}`} fill={color} />
      </g>
    </Marker>
  );
}

// Custom hook for keyboard navigation of route segments
function useSegmentKeyboardNavigation(
  segments: RouteSegment[],
  onSegmentFocus: (segment: RouteSegment | null) => void,
  emphasizedSegmentIds: Set<string>
) {
  const [, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter to only emphasized segments for keyboard navigation
  const navigableSegments = useMemo(
    () => segments.filter((s) => emphasizedSegmentIds.has(`${s.routeId}-${segments.indexOf(s)}`)),
    [segments, emphasizedSegmentIds]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (navigableSegments.length === 0) return;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex = prev < navigableSegments.length - 1 ? prev + 1 : 0;
            const segment = navigableSegments[nextIndex];
            onSegmentFocus(segment);
            return nextIndex;
          });
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : navigableSegments.length - 1;
            const segment = navigableSegments[nextIndex];
            onSegmentFocus(segment);
            return nextIndex;
          });
          break;
        case "Home":
          event.preventDefault();
          setFocusedIndex(0);
          onSegmentFocus(navigableSegments[0]);
          break;
        case "End":
          event.preventDefault();
          setFocusedIndex(navigableSegments.length - 1);
          onSegmentFocus(navigableSegments[navigableSegments.length - 1]);
          break;
        case "Escape":
          event.preventDefault();
          setFocusedIndex(-1);
          onSegmentFocus(null);
          containerRef.current?.focus();
          break;
      }
    },
    [navigableSegments, onSegmentFocus]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    containerRef,
  };
}

export default function RouteMap({ routes, selectedRouteId, selectedCountry }: RouteMapProps) {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [hoveredSegmentTooltip, setHoveredSegmentTooltip] = useState<RouteSegment | null>(null);
  const [keyboardFocusedSegment, setKeyboardFocusedSegment] = useState<RouteSegment | null>(null);

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
          materialMatchQuality: route.materialMatchQuality,
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
    const markerSummary = new Map<
      string,
      PortMarkerSummary & { exactCount: number; partialCount: number; noneCount: number }
    >();

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
          exactCount: 0,
          partialCount: 0,
          noneCount: 0,
          clarityPercent: 0,
          totalRoutes: 0,
        };

        if (index === 0) {
          existing.startCount += 1;
        } else if (index === route.stops.length - 1) {
          existing.endCount += 1;
        } else {
          existing.transitCount += 1;
        }

        // Track material evidence quality at this port
        if (route.materialMatchQuality === "exact") {
          existing.exactCount += 1;
        } else if (route.materialMatchQuality === "partial") {
          existing.partialCount += 1;
        } else {
          existing.noneCount += 1;
        }

        markerSummary.set(stop, existing);
      }
    }

    return Array.from(markerSummary.values()).map((port) => {
      const total = port.exactCount + port.partialCount + port.noneCount;
      const clarityPercent = total > 0 ? Math.round((port.exactCount / total) * 100) : 0;

      return {
        ...port,
        clarityPercent,
        totalRoutes: total,
      };
    });
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

  // Build set of emphasized segment IDs for keyboard navigation
  const emphasizedSegmentIds = useMemo(() => {
    return new Set(
      segments
        .filter(
          (segment) =>
            segment.isSelectedRoute && (selectedCountry ? segment.matchesCountryFilter : true)
        )
        .map((_, index) => {
          const segment = segments[index];
          return `${segment.routeId}-${index}`;
        })
    );
  }, [segments, selectedCountry]);

  // Initialize keyboard navigation
  const { containerRef } = useSegmentKeyboardNavigation(
    segments,
    setKeyboardFocusedSegment,
    emphasizedSegmentIds
  );

  // Sync keyboard focus with hover/tooltip state
  useEffect(() => {
    if (keyboardFocusedSegment) {
      setHoveredSegmentTooltip(keyboardFocusedSegment);
    }
  }, [keyboardFocusedSegment]);

  // Build detailed exchange pathway with port clarity data
  const selectedRouteExchangePathway = useMemo(() => {
    if (!selectedRoute || selectedRoute.stops.length < 2) {
      return null;
    }

    const pathway = selectedRoute.stops.map((stop, index) => {
      const port = portMarkers.find((p) => p.name === stop);
      const role =
        index === 0
          ? "origin"
          : index === selectedRoute.stops.length - 1
            ? "destination"
            : "transit";

      return {
        stop,
        role,
        clarityPercent: port?.clarityPercent ?? 0,
        totalRoutes: port?.totalRoutes ?? 0,
        legOutgoing: index < selectedRoute.stops.length - 1,
        legIncoming: index > 0,
      };
    });

    const legs = pathway.slice(0, -1).map((from, index) => {
      const to = pathway[index + 1];
      return {
        from: from.stop,
        to: to.stop,
        fromClarity: from.clarityPercent,
        toClarity: to.clarityPercent,
        legNumber: index + 1,
        legType: index === 0 ? "export" : index === pathway.length - 2 ? "import" : "transit",
        combinedClarity: Math.round((from.clarityPercent + to.clarityPercent) / 2),
      };
    });

    const overallClarity =
      pathway.length > 0
        ? Math.round(pathway.reduce((sum, p) => sum + p.clarityPercent, 0) / pathway.length)
        : 0;

    const recommendation =
      selectedRoute.materialMatchQuality === "exact" && overallClarity >= 70
        ? {
            label: "Execution-ready",
            action: "Route has strong material match and port evidence. Safe for planning.",
            severity: "success" as const,
          }
        : selectedRoute.materialMatchQuality === "partial" || overallClarity >= 40
          ? {
              label: "Validate before execution",
              action: "Review partial evidence and confirm port data before committing.",
              severity: "warning" as const,
            }
          : {
              label: "Data gap - research needed",
              action: "Gather additional material evidence and port verification.",
              severity: "error" as const,
            };

    return {
      pathway,
      legs,
      overallClarity,
      recommendation,
    };
  }, [selectedRoute, portMarkers]);

  const materialEvidenceSummary = useMemo(() => {
    const sourceRoutes = selectedRoute ? [selectedRoute] : normalizedRoutes;

    return sourceRoutes.reduce(
      (totals, route) => {
        if (route.materialMatchQuality === "exact") {
          totals.exact += 1;
        } else if (route.materialMatchQuality === "partial") {
          totals.partial += 1;
        } else {
          totals.none += 1;
        }

        return totals;
      },
      { exact: 0, partial: 0, none: 0 }
    );
  }, [normalizedRoutes, selectedRoute]);

  const materialClarityPercentages = useMemo(() => {
    const total =
      materialEvidenceSummary.exact +
      materialEvidenceSummary.partial +
      materialEvidenceSummary.none;
    if (total === 0) return { exact: 0, partial: 0, none: 0, total: 0 };

    return {
      exact: Math.round((materialEvidenceSummary.exact / total) * 100),
      partial: Math.round((materialEvidenceSummary.partial / total) * 100),
      none: Math.round((materialEvidenceSummary.none / total) * 100),
      total,
    };
  }, [materialEvidenceSummary]);

  return (
    <div
      ref={containerRef}
      className="mapFrame mapFrame--enhanced"
      role="application"
      aria-label="Interactive supply chain route map. Use arrow keys to navigate segments."
      tabIndex={0}
      style={{ outline: "none" }}
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
          const isActive = activeSegmentId === segmentId || keyboardFocusedSegment === segment;
          const shouldEmphasize =
            segment.isSelectedRoute && (selectedCountry ? segment.matchesCountryFilter : true);
          const color = categoryColor[segment.category];
          const dashArray = segment.materialMatchQuality
            ? clarityDashArray[segment.materialMatchQuality]
            : "2,2";
          const clarityLabel =
            segment.materialMatchQuality === "exact"
              ? "Exact material match"
              : segment.materialMatchQuality === "partial"
                ? "Partial material match"
                : "No direct material match";

          return (
            <Line
              key={segmentId}
              data-segment-id={segmentId}
              data-navigable={shouldEmphasize}
              from={segment.from}
              to={segment.to}
              stroke={color}
              strokeWidth={isActive ? 3 : shouldEmphasize ? 2.2 : 1}
              strokeLinecap="round"
              strokeOpacity={isActive ? 1 : shouldEmphasize ? 0.84 : 0.18}
              strokeDasharray={dashArray}
              onMouseEnter={() => {
                setActiveSegmentId(segmentId);
                setHoveredSegmentTooltip(segment);
              }}
              onMouseLeave={() => {
                setActiveSegmentId((prev) => (prev === segmentId ? null : prev));
                setHoveredSegmentTooltip(null);
              }}
              onClick={() => setActiveSegmentId(segmentId)}
              aria-label={`${segment.product}: ${segment.fromName} to ${segment.toName}. ${clarityLabel}.`}
              aria-hidden={!shouldEmphasize}
            />
          );
        })}

        {/* Port-to-port exchange clarity tooltip overlay */}
        {hoveredSegmentTooltip && (
          <Marker coordinates={getMidpoint(hoveredSegmentTooltip.from, hoveredSegmentTooltip.to)}>
            <ExchangeClarityTooltip
              segment={hoveredSegmentTooltip}
              portMarkers={portMarkers}
              isVisible={true}
              matchedMaterial={
                normalizedRoutes.find((r) => r.id === hoveredSegmentTooltip.routeId)
                  ?.matchedMaterial
              }
            />
          </Marker>
        )}

        {/* Directional flow arrows for exchange clarity */}
        {segments.map((segment, index) => {
          const segmentId = `${segment.routeId}-${index}`;
          const isActive = activeSegmentId === segmentId;
          const shouldEmphasize =
            segment.isSelectedRoute && (selectedCountry ? segment.matchesCountryFilter : true);
          const color = categoryColor[segment.category];
          const arrowSize = isActive ? 6 : shouldEmphasize ? 5 : 3;
          const arrowOpacity = isActive ? 1 : shouldEmphasize ? 0.9 : 0.35;

          // Only show arrows for emphasized segments to reduce visual noise
          if (!shouldEmphasize) return null;

          return (
            <FlowArrow
              key={`arrow-${segmentId}`}
              from={segment.from}
              to={segment.to}
              color={color}
              size={arrowSize}
              opacity={arrowOpacity}
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

          // Port clarity ring color based on material evidence coverage
          const clarityRingColor =
            port.clarityPercent >= 80
              ? "#4ade80"
              : port.clarityPercent >= 40
                ? "#fbbf24"
                : "#f87171";

          return (
            <Marker key={port.name} coordinates={port.coordinates}>
              {/* Material evidence clarity ring */}
              <circle
                r={selectedRoute ? 5.5 : 4.8}
                fill="transparent"
                stroke={clarityRingColor}
                strokeWidth={1.5}
                opacity={0.7}
              />
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

      <div className="mapLegend mapLegend--blocks" aria-label="Port role and clarity legend">
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
        <span className="mapLegendItem">
          <svg width="14" height="14" style={{ marginRight: "6px" }}>
            <circle cx="7" cy="7" r="5" fill="transparent" stroke="#4ade80" strokeWidth="2" />
          </svg>
          Port ring = material evidence clarity (green = 80%+ exact matches)
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

      <div className="mapLegend" aria-label="Material evidence coverage on map lanes">
        <span>
          Material evidence: <strong>{materialEvidenceSummary.exact}</strong> exact
        </span>
        <span>
          <strong>{materialEvidenceSummary.partial}</strong> partial
        </span>
        <span>
          <strong>{materialEvidenceSummary.none}</strong> with no direct material match
        </span>
      </div>

      <div
        className="mapLegend mapLegend--blocks"
        aria-label="Material exchange data quality clarity bar"
      >
        <div style={{ width: "100%", marginTop: "4px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
              fontSize: "12px",
            }}
          >
            <span>
              Data quality: <strong>{materialClarityPercentages.exact}%</strong> execution-ready
            </span>
            <span>
              {materialClarityPercentages.total} route
              {materialClarityPercentages.total !== 1 ? "s" : ""}
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "#182744",
              borderRadius: "4px",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <div
              style={{
                width: `${materialClarityPercentages.exact}%`,
                height: "100%",
                background: "#4ade80",
                transition: "width 0.3s ease",
              }}
              title={`Exact match: ${materialEvidenceSummary.exact} routes (${materialClarityPercentages.exact}%)`}
            />
            <div
              style={{
                width: `${materialClarityPercentages.partial}%`,
                height: "100%",
                background: "#fbbf24",
                transition: "width 0.3s ease",
              }}
              title={`Partial match: ${materialEvidenceSummary.partial} routes (${materialClarityPercentages.partial}%)`}
            />
            <div
              style={{
                width: `${materialClarityPercentages.none}%`,
                height: "100%",
                background: "#f87171",
                transition: "width 0.3s ease",
              }}
              title={`No material match: ${materialEvidenceSummary.none} routes (${materialClarityPercentages.none}%)`}
            />
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "11px" }}>
            <span style={{ color: "#4ade80" }}>● Exact ({materialClarityPercentages.exact}%)</span>
            <span style={{ color: "#fbbf24" }}>
              ● Partial ({materialClarityPercentages.partial}%)
            </span>
            <span style={{ color: "#f87171" }}>● Gap ({materialClarityPercentages.none}%)</span>
          </div>
        </div>
      </div>

      <div className="mapLegend mapLegend--blocks" aria-label="Exchange clarity line style legend">
        <span className="mapLegendItem">
          <svg width="20" height="4" style={{ verticalAlign: "middle", marginRight: "6px" }}>
            <line x1="0" y1="2" x2="20" y2="2" stroke="#78c8ff" strokeWidth="2" />
          </svg>
          Solid = Exact material match (execution-ready)
        </span>
        <span className="mapLegendItem">
          <svg width="20" height="4" style={{ verticalAlign: "middle", marginRight: "6px" }}>
            <line
              x1="0"
              y1="2"
              x2="20"
              y2="2"
              stroke="#78c8ff"
              strokeWidth="2"
              strokeDasharray="4,3"
            />
          </svg>
          Dashed = Partial match (verify before execution)
        </span>
        <span className="mapLegendItem">
          <svg width="20" height="4" style={{ verticalAlign: "middle", marginRight: "6px" }}>
            <line
              x1="0"
              y1="2"
              x2="20"
              y2="2"
              stroke="#78c8ff"
              strokeWidth="2"
              strokeDasharray="2,2"
            />
          </svg>
          Dotted = No material match (data gap)
        </span>
        <span className="mapLegendItem">
          <svg width="20" height="12" style={{ verticalAlign: "middle", marginRight: "6px" }}>
            <polygon points="16,6 10,3 10,9" fill="#78c8ff" />
            <line x1="0" y1="6" x2="10" y2="6" stroke="#78c8ff" strokeWidth="1.5" />
          </svg>
          Arrow = Exchange flow direction (origin → destination)
        </span>
      </div>

      {selectedRouteExchangePathway ? (
        <div className="mapRouteDetail mapRouteDetail--enhanced" role="status" aria-live="polite">
          <div className="exchangePathwayHeader">
            <p className="exchangePathwayTitle">
              <strong>Exchange Pathway Clarity</strong>
              <span
                className={`exchangeClarityBadge exchangeClarityBadge--${selectedRouteExchangePathway.recommendation.severity}`}
              >
                {selectedRouteExchangePathway.recommendation.label}
              </span>
            </p>
            <p className="exchangePathwayOverall">
              Overall clarity: <strong>{selectedRouteExchangePathway.overallClarity}%</strong>
            </p>
          </div>

          <div className="exchangePathwayFlow">
            {selectedRouteExchangePathway.pathway.map((stop, index) => (
              <div key={stop.stop} className="exchangePathwayStop">
                <div
                  className={`exchangePathwayNode exchangePathwayNode--${stop.role}`}
                  title={`${stop.stop} - ${stop.clarityPercent}% evidence clarity (${stop.totalRoutes} routes)`}
                >
                  <span className="exchangePathwayNodeLabel">{stop.stop}</span>
                  <span
                    className="exchangePathwayNodeClarity"
                    style={{
                      color:
                        stop.clarityPercent >= 80
                          ? "#4ade80"
                          : stop.clarityPercent >= 40
                            ? "#fbbf24"
                            : "#f87171",
                    }}
                  >
                    {stop.clarityPercent}%
                  </span>
                </div>
                {index < selectedRouteExchangePathway.pathway.length - 1 && (
                  <div className="exchangePathwayConnector">
                    <span className="exchangePathwayArrow">→</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="exchangePathwayLegs">
            {selectedRouteExchangePathway.legs.map((leg) => (
              <div
                key={`${leg.from}-${leg.to}`}
                className={`exchangePathwayLeg exchangePathwayLeg--${leg.legType}`}
              >
                <span className="exchangePathwayLegNumber">Leg {leg.legNumber}</span>
                <span className="exchangePathwayLegType">
                  {leg.legType === "export"
                    ? "Export handoff"
                    : leg.legType === "import"
                      ? "Import handoff"
                      : "Transit segment"}
                </span>
                <span
                  className="exchangePathwayLegClarity"
                  style={{
                    color:
                      leg.combinedClarity >= 80
                        ? "#4ade80"
                        : leg.combinedClarity >= 40
                          ? "#fbbf24"
                          : "#f87171",
                  }}
                >
                  {leg.combinedClarity}% clarity
                </span>
              </div>
            ))}
          </div>

          <div className="exchangePathwayMaterial">
            <p>
              <strong>Material Evidence:</strong>{" "}
              {selectedRoute?.materialMatchQuality === "exact"
                ? "Exact match (execution-ready)"
                : selectedRoute?.materialMatchQuality === "partial"
                  ? "Partial match (verify details)"
                  : "No direct material match (research needed)"}
            </p>
          </div>

          <div className="exchangePathwayAction">
            <p className="exchangePathwayActionText">
              <strong>Recommended Action:</strong>{" "}
              {selectedRouteExchangePathway.recommendation.action}
            </p>
          </div>
        </div>
      ) : null}

      <p className="sectionIntro">
        Tap, hover, or use arrow keys to navigate route segments for material + corridor details.
        Press Escape to clear focus. Port markers show export start, import end, and transit
        checkpoints.
      </p>

      {activeSegment ? (
        <div className="mapRouteDetail" role="status" aria-live="polite">
          <p>
            <strong>{activeSegment.product}</strong> · {activeSegment.category}
          </p>
          <p>
            {activeSegment.fromName} → {activeSegment.toName}
          </p>
          <p>
            Data quality:{" "}
            <span
              style={{
                color:
                  activeSegment.materialMatchQuality === "exact"
                    ? "#4ade80"
                    : activeSegment.materialMatchQuality === "partial"
                      ? "#fbbf24"
                      : "#f87171",
                fontWeight: 600,
              }}
            >
              {activeSegment.materialMatchQuality === "exact"
                ? "Exact match (execution-ready)"
                : activeSegment.materialMatchQuality === "partial"
                  ? "Partial match (verify before execution)"
                  : "No direct material match (data gap)"}
            </span>
          </p>
          {(() => {
            const fromPort = portMarkers.find((p) => p.name === activeSegment.fromName);
            const toPort = portMarkers.find((p) => p.name === activeSegment.toName);
            return (
              <p style={{ fontSize: "12px", marginTop: "4px" }}>
                Port evidence clarity:{" "}
                {fromPort && (
                  <span
                    style={{
                      color:
                        fromPort.clarityPercent >= 80
                          ? "#4ade80"
                          : fromPort.clarityPercent >= 40
                            ? "#fbbf24"
                            : "#f87171",
                    }}
                  >
                    {activeSegment.fromName} ({fromPort.clarityPercent}%)
                  </span>
                )}
                {" → "}
                {toPort && (
                  <span
                    style={{
                      color:
                        toPort.clarityPercent >= 80
                          ? "#4ade80"
                          : toPort.clarityPercent >= 40
                            ? "#fbbf24"
                            : "#f87171",
                    }}
                  >
                    {activeSegment.toName} ({toPort.clarityPercent}%)
                  </span>
                )}
              </p>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}
