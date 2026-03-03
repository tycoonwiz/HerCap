import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { usePortfolio, getCoordinates, type Company } from "@/data/portfolio";
import { Badge } from "@/components/ui/Badge/Badge";
import { getCompanyLogo } from "@/utils/getCompanyLogo";

interface GeographyViewProps {
  selectedStartup: Company | null;
  setSelectedStartup: (startup: Company | null) => void;
}

export function GeographyView({
  selectedStartup,
  setSelectedStartup,
}: GeographyViewProps) {
  const { portfolioData, loading, error } = usePortfolio();
  const [hoveredCluster, setHoveredCluster] = useState<{
    lat: number;
    lng: number;
    companies: Company[];
  } | null>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState<[number, number]>([-30, -20]);
  const [scale, setScale] = useState(280);

  // Zoom constraints
  const minScale = 150;
  const maxScale = 800;

  // Load world data with countries for better detail
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((response) => response.json())
      .then((data) => setWorldData(data));
  }, []);

  // Setup D3 drag behavior for globe rotation with momentum and damping
  useEffect(() => {
    if (!svgRef.current || !worldData) return;

    const svg = d3.select(svgRef.current);

    // Scale-dependent parameters: more zoom = more damping for precision
    const zoomNormalized = (scale - minScale) / (maxScale - minScale); // 0 (zoomed out) to 1 (zoomed in)

    const baseSensitivity = 0.4;
    const sensitivity = baseSensitivity * (1 - zoomNormalized * 0.6); // Slower rotation when zoomed in

    const maxDamping = 0.92; // Zoomed out: spins freely
    const minDamping = 0.75; // Zoomed in: stops quickly for precision
    const damping = maxDamping - zoomNormalized * (maxDamping - minDamping);

    const maxVelDamping = 0.6; // Zoomed out: responsive
    const minVelDamping = 0.4; // Zoomed in: smoother
    const velocityDamping =
      maxVelDamping - zoomNormalized * (maxVelDamping - minVelDamping);

    const minVelocity = 0.05;
    const baseMaxVelocity = 6;
    const maxVelocity = baseMaxVelocity * (1 - zoomNormalized * 0.5); // Lower max speed when zoomed in

    let currentRotation = rotation;
    let velocity = { x: 0, y: 0 };
    let lastTime = 0;
    let animationId: number | null = null;

    // Clamp velocity to max
    const clampVelocity = (v: number) =>
      Math.max(-maxVelocity, Math.min(maxVelocity, v));

    // Momentum animation loop with damping
    const animate = () => {
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

      if (speed < minVelocity) {
        animationId = null;
        return;
      }

      // Apply damping (exponential decay for smooth deceleration)
      velocity.x *= damping;
      velocity.y *= damping;

      // Update rotation
      currentRotation = [
        currentRotation[0] + velocity.x,
        Math.max(-90, Math.min(90, currentRotation[1] - velocity.y)),
      ];
      setRotation([...currentRotation]);

      animationId = requestAnimationFrame(animate);
    };

    const drag = d3
      .drag<SVGSVGElement, unknown>()
      .on("start", function () {
        // Stop any ongoing momentum animation
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        velocity = { x: 0, y: 0 };
        lastTime = Date.now();
        d3.select(this).style("cursor", "grabbing");
      })
      .on("drag", function (event) {
        const now = Date.now();
        const dt = Math.max(1, now - lastTime); // Time delta in ms
        lastTime = now;

        const dx = event.dx * sensitivity;
        const dy = event.dy * sensitivity;

        // Track velocity with damping (weighted average for smoothness)
        const instantVelX = (dx / dt) * 16; // Normalize to ~60fps
        const instantVelY = (dy / dt) * 16;

        velocity.x = clampVelocity(
          velocity.x * velocityDamping + instantVelX * (1 - velocityDamping)
        );
        velocity.y = clampVelocity(
          velocity.y * velocityDamping + instantVelY * (1 - velocityDamping)
        );

        currentRotation = [
          currentRotation[0] + dx,
          Math.max(-90, Math.min(90, currentRotation[1] - dy)),
        ];
        setRotation([...currentRotation]);
      })
      .on("end", function () {
        d3.select(this).style("cursor", "grab");

        // Start momentum animation if there's velocity
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        if (speed > minVelocity) {
          animationId = requestAnimationFrame(animate);
        }
      });

    svg.call(drag as any);
    svg.style("cursor", "grab");

    return () => {
      svg.on(".drag", null);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [worldData, scale]);

  const locationClusters = portfolioData.reduce((acc, company) => {
    const coords = getCoordinates(company.location);
    const key = `${coords.lat},${coords.lng}`;
    if (!acc[key]) {
      acc[key] = { lat: coords.lat, lng: coords.lng, companies: [] };
    }
    acc[key].companies.push(company);
    return acc;
  }, {} as Record<string, { lat: number; lng: number; companies: Company[] }>);

  const width = 600;
  const height = 600;

  const projection = d3
    .geoOrthographic()
    .scale(scale)
    .translate([width / 2, height / 2])
    .rotate([rotation[0], rotation[1]])
    .clipAngle(90);

  const path = d3.geoPath(projection);

  // Check if a point is visible on the globe (not on the back side)
  const isVisible = (lng: number, lat: number): boolean => {
    const coords = projection([lng, lat]);
    if (!coords) return false;

    // Check if the point is within the clip angle
    const rotated = d3.geoRotation([rotation[0], rotation[1]])([lng, lat]);
    if (!rotated) return false;

    // Point is visible if it's on the front hemisphere
    const distance = d3.geoDistance([0, 0], rotated);
    return distance < Math.PI / 2;
  };

  if (loading) {
    return (
      <div className="portfolio__loading">
        <div className="portfolio__loading-spinner" />
        Loading portfolio...
      </div>
    );
  }

  if (error) {
    return <div className="portfolio__error">{error}</div>;
  }

  return (
    <div className="portfolio__geography">
      <div
        className="portfolio__map-container portfolio__globe-container"
        ref={containerRef}
      >
        {worldData ? (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="portfolio__globe"
          >
            <defs>
              {/* Ocean gradient */}
              <radialGradient id="ocean-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgb(30, 58, 95)" />
                <stop offset="100%" stopColor="rgb(15, 23, 42)" />
              </radialGradient>

              {/* Globe shadow */}
              <radialGradient id="globe-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="85%" stopColor="transparent" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
              </radialGradient>

              {/* Atmosphere glow */}
              <radialGradient id="atmosphere" cx="50%" cy="50%" r="50%">
                <stop offset="80%" stopColor="transparent" />
                <stop offset="90%" stopColor="rgba(56, 189, 248, 0.1)" />
                <stop offset="100%" stopColor="rgba(56, 189, 248, 0.2)" />
              </radialGradient>

              {/* Marker glow */}
              <filter
                id="marker-glow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Atmosphere */}
            <circle
              cx={width / 2}
              cy={height / 2}
              r={scale + 5}
              fill="url(#atmosphere)"
            />

            {/* Ocean */}
            <circle
              cx={width / 2}
              cy={height / 2}
              r={scale}
              fill="url(#ocean-gradient)"
            />

            {/* Graticule (grid lines) */}
            <path
              d={path(d3.geoGraticule10()) || ""}
              fill="none"
              stroke="rgba(100, 116, 139, 0.2)"
              strokeWidth="0.5"
            />

            {/* Land masses */}
            {worldData.objects?.countries && (
              <g>
                {(
                  topojson.feature(
                    worldData,
                    worldData.objects.countries
                  ) as any
                ).features.map((feature: any, idx: number) => (
                  <path
                    key={idx}
                    d={path(feature) || ""}
                    fill="rgb(71, 85, 105)"
                    stroke="rgb(51, 65, 85)"
                    strokeWidth="0.5"
                  />
                ))}
              </g>
            )}

            {/* Globe edge shadow */}
            <circle
              cx={width / 2}
              cy={height / 2}
              r={scale}
              fill="url(#globe-shadow)"
              pointerEvents="none"
            />

            {/* Portfolio location markers */}
            {Object.values(locationClusters).map((cluster, idx) => {
              const coords = projection([cluster.lng, cluster.lat]);
              if (!coords || !isVisible(cluster.lng, cluster.lat)) return null;

              const [x, y] = coords;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredCluster(cluster)}
                  onMouseLeave={() => setHoveredCluster(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStartup(cluster.companies[0]);
                  }}
                  style={{ cursor: "pointer" }}
                  filter="url(#marker-glow)"
                >
                  {/* Pulse animation */}
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="rgb(239, 68, 68)"
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      from="6"
                      to="16"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Main marker */}
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="rgb(239, 68, 68)"
                    stroke="white"
                    strokeWidth="2"
                  />

                  {/* Count badge for multiple companies */}
                  {cluster.companies.length > 1 && (
                    <g>
                      <circle
                        cx={x + 10}
                        cy={y - 10}
                        r="9"
                        fill="white"
                        stroke="rgb(239, 68, 68)"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x + 10}
                        y={y - 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill="rgb(2, 6, 23)"
                      >
                        {cluster.companies.length}
                      </text>
                    </g>
                  )}

                  {/* Hover tooltip */}
                  {hoveredCluster === cluster && (
                    <g pointerEvents="none">
                      <rect
                        x={x + 18}
                        y={y - 35}
                        width="170"
                        height={cluster.companies.length > 1 ? 58 : 45}
                        rx="8"
                        fill="rgba(15, 23, 42, 0.95)"
                        stroke="rgb(71, 85, 105)"
                        strokeWidth="1"
                      />
                      <text
                        x={x + 28}
                        y={y - 17}
                        fontSize="13"
                        fontWeight="600"
                        fill="white"
                      >
                        {cluster.companies[0].name}
                      </text>
                      <text
                        x={x + 28}
                        y={y - 2}
                        fontSize="11"
                        fill="rgb(148, 163, 184)"
                      >
                        {cluster.companies[0].location}
                      </text>
                      {cluster.companies.length > 1 && (
                        <text
                          x={x + 28}
                          y={y + 14}
                          fontSize="10"
                          fill="rgb(100, 116, 139)"
                        >
                          +{cluster.companies.length - 1} more companies
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="portfolio__map-loading">
            <div className="portfolio__loading-spinner" />
            Loading globe...
          </div>
        )}

        {/* Zoom controls */}
        <div className="portfolio__globe-controls">
          <button
            className="portfolio__globe-btn"
            onClick={() => setScale((s) => Math.min(maxScale, s * 1.3))}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            className="portfolio__globe-btn"
            onClick={() => setScale((s) => Math.max(minScale, s / 1.3))}
            aria-label="Zoom out"
          >
            −
          </button>
        </div>

        {/* Drag instruction hint */}
        <div className="portfolio__globe-hint">Drag to rotate</div>
      </div>

      {selectedStartup && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="portfolio__selected"
        >
          <div className="portfolio__selected-header">
            <div className="portfolio__selected-info">
              <div className="portfolio__list-avatar">
                <img
                  src={getCompanyLogo(selectedStartup.name)}
                  alt={`${selectedStartup.name} logo`}
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    const container = img.parentElement;

                    if (container) {
                      // Adjust padding based on logo aspect ratio
                      if (aspectRatio > 1.5) {
                        // Wide logo - reduce vertical padding
                        container.style.padding = '0.5rem 1rem';
                      } else if (aspectRatio < 0.67) {
                        // Tall logo - reduce horizontal padding
                        container.style.padding = '1rem 0.5rem';
                      } else {
                        // Square-ish logo - balanced padding
                        container.style.padding = '0.75rem';
                      }
                    }
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.textContent = selectedStartup.name.substring(0, 2).toUpperCase();
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <div>
                {selectedStartup.website ? (
                  <a
                    href={selectedStartup.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio__selected-name"
                  >
                    {selectedStartup.name}
                  </a>
                ) : (
                  <h3 className="portfolio__selected-name">
                    {selectedStartup.name}
                  </h3>
                )}
                <p className="portfolio__selected-location">
                  {selectedStartup.location}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedStartup(null)}
              className="portfolio__selected-close"
            >
              ✕
            </button>
          </div>
          <p className="portfolio__selected-desc">
            {selectedStartup.description}
          </p>
          <div className="portfolio__list-badges">
            <Badge variant="secondary">{selectedStartup.stage}</Badge>
            <Badge variant="secondary">{selectedStartup.primary}</Badge>
            {selectedStartup.secondary && (
              <Badge variant="secondary">{selectedStartup.secondary}</Badge>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
