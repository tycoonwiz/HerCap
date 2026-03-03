import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { usePortfolio, type Company } from "@/data/portfolio";
import { Badge } from "@/components/ui/Badge/Badge";
import { getCompanyLogo } from "@/utils/getCompanyLogo";

// === FORCE SIMULATION CONFIGURATION ===
// Tunable parameters for Visual Thesaurus-style layout

// Link distance targets (in pixels) with jitter ranges
const LINK_DISTANCES = {
  primary: { mean: 240, jitter: 40 },
  secondary: { mean: 380, jitter: 50 },
  tertiary: { mean: 540, jitter: 70 },
};

// Link strengths (0-1, higher = stronger attraction)
const LINK_STRENGTHS = {
  primary: 0.75,  // Reduced for more flexibility
  secondary: 0.45,
  tertiary: 0.25,
};

// Node sizes
const COMPANY_NODE_RADIUS = 36;
const SECTOR_NODE_BASE_RADIUS = 50; // Larger than company nodes

// Collision and physics forces
const COLLISION_RADIUS = 75; // Much larger spacing between nodes
const MANY_BODY_STRENGTH = -350; // Very strong repulsion to prevent overlap
const CENTER_STRENGTH = 0.02; // Even weaker centering for maximum spread
const ALPHA_DECAY = 0.008; // Very slow settling for optimal distribution
const ALPHA_MIN = 0.001; // Threshold to stop simulation

// Visual encoding
const CONNECTION_COLOR = "rgb(148, 163, 184)"; // Slate-400

// Orange color scheme for highlights
const HIGHLIGHT_COLORS = {
  primary: "#ea580c",     // Orange-600 - strongest connection
  secondary: "#fb923c",   // Orange-400 - medium connection
  tertiary: "#fdba74",    // Orange-300 - weakest connection
};

// Sector node styling
const SECTOR_NODE_COLOR = "#ea580c";        // Orange-600
const SECTOR_NODE_SELECTED_COLOR = "#fb923c"; // Orange-400 when selected

// Deterministic random number generator for stable layouts
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

interface SelectedCategory {
  name: string;
  connections: Map<number, "primary" | "secondary" | "tertiary">;
}

export function SectorView() {
  const { portfolioData, loading, error } = usePortfolio();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Company | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Handle resize
  useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    // Small delay to ensure container is rendered
    const timer = setTimeout(updateDimensions, 100);
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // D3 Force Simulation - Visual Thesaurus Style
  useEffect(() => {
    if (!svgRef.current || loading || portfolioData.length === 0) return;

    try {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const { width, height } = dimensions;

      // Safety check for valid dimensions
      if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) return;

      const centerX = width / 2;
      const centerY = height / 2;

      // === STEP 1: Collect and score categories ===
      const categoryScores: Map<string, number> = new Map();

      portfolioData.forEach((c) => {
        categoryScores.set(c.primary, (categoryScores.get(c.primary) || 0) + LINK_STRENGTHS.primary);
        if (c.secondary) {
          categoryScores.set(c.secondary, (categoryScores.get(c.secondary) || 0) + LINK_STRENGTHS.secondary);
        }
        if (c.tertiary) {
          categoryScores.set(c.tertiary, (categoryScores.get(c.tertiary) || 0) + LINK_STRENGTHS.tertiary);
        }
      });

      const sortedCategories = Array.from(categoryScores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);

      // Update categories state for legend
      setAllCategories(sortedCategories);

      // === STEP 2: Position sector nodes near perimeter with slight irregularity ===
      // Use deterministic random for stable layout
      const rng = new SeededRandom(42); // Fixed seed for deterministic layout
      const baseRadius = Math.min(width, height) * 0.46; // Increased to spread categories even more

      interface SectorNode extends d3.SimulationNodeDatum {
        id: string;
        name: string;
        fx: number; // Fixed x position
        fy: number; // Fixed y position
        score: number;
      }

      const sectorNodes: SectorNode[] = sortedCategories.map((cat, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / sortedCategories.length;
        const radiusJitter = rng.range(-20, 20); // Slight irregularity
        const angleJitter = rng.range(-0.1, 0.1);
        const finalAngle = angle + angleJitter;
        const finalRadius = baseRadius + radiusJitter;

        return {
          id: `sector-${cat}`,
          name: cat,
          fx: centerX + Math.cos(finalAngle) * finalRadius,
          fy: centerY + Math.sin(finalAngle) * finalRadius,
          score: categoryScores.get(cat) || 0,
        };
      });

      // === STEP 3: Create company nodes (initially at center, will be positioned by simulation) ===
      interface CompanyNodeType extends d3.SimulationNodeDatum {
        id: string;
        companyId: number;
        name: string;
        data: Company;
      }

      const companyNodes: CompanyNodeType[] = portfolioData.map((company) => ({
        id: `company-${company.id}`,
        companyId: company.id,
        name: company.name,
        data: company,
        x: centerX + rng.range(-50, 50), // Small initial jitter
        y: centerY + rng.range(-50, 50),
      }));

      // === STEP 4: Create links with deterministic distances ===
      interface LinkType extends d3.SimulationLinkDatum<CompanyNodeType | SectorNode> {
        source: string;
        target: string;
        strength: "primary" | "secondary" | "tertiary";
        distance: number;
      }

      const links: LinkType[] = [];

      portfolioData.forEach((company) => {
        const companyNodeId = `company-${company.id}`;

        // Primary link
        const primaryDist = LINK_DISTANCES.primary.mean + rng.range(-LINK_DISTANCES.primary.jitter, LINK_DISTANCES.primary.jitter);
        links.push({
          source: companyNodeId,
          target: `sector-${company.primary}`,
          strength: "primary",
          distance: primaryDist,
        });

        // Secondary link
        if (company.secondary) {
          const secondaryDist = LINK_DISTANCES.secondary.mean + rng.range(-LINK_DISTANCES.secondary.jitter, LINK_DISTANCES.secondary.jitter);
          links.push({
            source: companyNodeId,
            target: `sector-${company.secondary}`,
            strength: "secondary",
            distance: secondaryDist,
          });
        }

        // Tertiary link
        if (company.tertiary) {
          const tertiaryDist = LINK_DISTANCES.tertiary.mean + rng.range(-LINK_DISTANCES.tertiary.jitter, LINK_DISTANCES.tertiary.jitter);
          links.push({
            source: companyNodeId,
            target: `sector-${company.tertiary}`,
            strength: "tertiary",
            distance: tertiaryDist,
          });
        }
      });

      // === STEP 5: Create force simulation ===
      const allNodes = [...sectorNodes, ...companyNodes];

      const simulation = d3.forceSimulation(allNodes)
        .force("link", d3.forceLink(links)
          .id((d: any) => d.id)
          .distance((d: any) => d.distance)
          .strength((d: any) => LINK_STRENGTHS[d.strength as keyof typeof LINK_STRENGTHS])
        )
        .force("charge", d3.forceManyBody()
          .strength(MANY_BODY_STRENGTH)
        )
        .force("collision", d3.forceCollide()
          .radius((d: any) => {
            // Sector nodes are larger, need bigger collision radius
            if (d.id.startsWith('sector-')) {
              return SECTOR_NODE_BASE_RADIUS + 15;
            }
            return COLLISION_RADIUS;
          })
          .strength(0.9) // Strong collision prevention
        )
        .force("center", d3.forceCenter(centerX, centerY)
          .strength(CENTER_STRENGTH)
        )
        .alphaDecay(ALPHA_DECAY)
        .alphaMin(ALPHA_MIN);

      // === STEP 6: Setup SVG groups and rendering ===
      const g = svg.append("g");

      // Zoom behavior
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => g.attr("transform", event.transform));

      svg.call(zoom);

      // Build connection map for a category
      const buildConnectionMap = (categoryName: string) => {
        const connections = new Map<
          number,
          "primary" | "secondary" | "tertiary"
        >();
        portfolioData.forEach((c) => {
          if (c.primary === categoryName) {
            connections.set(c.id, "primary");
          } else if (c.secondary === categoryName) {
            connections.set(c.id, "secondary");
          } else if (c.tertiary === categoryName) {
            connections.set(c.id, "tertiary");
          }
        });
        return connections;
      };

      // Create SVG groups (order matters for z-index)
      const linksGroup = g.append("g").attr("class", "links");
      const sectorGroup = g.append("g").attr("class", "sectors");
      const companyGroup = g.append("g").attr("class", "companies");

      // Helper to get link data for rendering
      const getLinkSource = (link: any): CompanyNodeType => {
        return typeof link.source === 'object' ? link.source : companyNodes.find(n => n.id === link.source)!;
      };
      const getLinkTarget = (link: any): SectorNode => {
        return typeof link.target === 'object' ? link.target : sectorNodes.find(n => n.id === link.target)!;
      };

      // Render function called on each simulation tick
      const render = () => {
        // Update link positions
        linksGroup.selectAll<SVGLineElement, LinkType>("line")
          .data(links)
          .join("line")
          .attr("x1", d => getLinkSource(d).x!)
          .attr("y1", d => getLinkSource(d).y!)
          .attr("x2", d => getLinkTarget(d).x!)
          .attr("y2", d => getLinkTarget(d).y!)
          .attr("stroke", d => {
            if (!selectedCategory) return CONNECTION_COLOR;
            const targetNode = getLinkTarget(d);
            if (selectedCategory.name === targetNode.name) {
              // Use orange color scheme for highlighted connections
              return HIGHLIGHT_COLORS[d.strength];
            }
            return CONNECTION_COLOR;
          })
          .attr("stroke-width", d => {
            if (!selectedCategory) {
              return d.strength === "primary" ? 2 : d.strength === "secondary" ? 1.2 : 0.7;
            }
            const targetNode = getLinkTarget(d);
            if (selectedCategory.name === targetNode.name) {
              return d.strength === "primary" ? 3 : d.strength === "secondary" ? 2 : 1.2;
            }
            return 0.5;
          })
          .attr("opacity", d => {
            if (!selectedCategory) {
              return d.strength === "primary" ? 0.5 : d.strength === "secondary" ? 0.3 : 0.15;
            }
            const targetNode = getLinkTarget(d);
            if (selectedCategory.name === targetNode.name) {
              return d.strength === "primary" ? 0.9 : d.strength === "secondary" ? 0.7 : 0.5;
            }
            return 0.08;
          });

        // Update sector node positions
        sectorGroup.selectAll<SVGGElement, SectorNode>("g")
          .data(sectorNodes)
          .join("g")
          .attr("transform", d => `translate(${d.fx}, ${d.fy})`)
          .each(function(d) {
            const group = d3.select(this);
            const isSelected = selectedCategory?.name === d.name;
            const maxScore = Math.max(...sectorNodes.map(n => n.score));
            const sizeScale = maxScore > 0 ? 0.7 + (d.score / maxScore) * 0.5 : 1;

            // Calculate sector node size (larger than company nodes)
            const sectorRadius = SECTOR_NODE_BASE_RADIUS * sizeScale;

            // Update or create circle
            group.selectAll("circle")
              .data([d])
              .join("circle")
              .attr("r", sectorRadius)
              .attr("fill", isSelected ? "rgba(251, 146, 60, 0.3)" : "rgba(30, 41, 59, 0.95)") // Orange-400 when selected
              .attr("stroke", isSelected ? SECTOR_NODE_SELECTED_COLOR : SECTOR_NODE_COLOR)
              .attr("stroke-width", isSelected ? 3 : 2)
              .style("cursor", "pointer")
              .on("click", (event) => {
                event.stopPropagation();
                if (selectedCategory?.name === d.name) {
                  setSelectedCategory(null);
                } else {
                  setSelectedCategory({
                    name: d.name,
                    connections: buildConnectionMap(d.name),
                  });
                }
              })
              .on("mouseenter", function() {
                if (!isSelected) {
                  d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", "rgba(234, 88, 12, 0.15)") // Light orange on hover
                    .attr("stroke-width", 2.5);
                }
              })
              .on("mouseleave", function() {
                if (!isSelected) {
                  d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", "rgba(30, 41, 59, 0.95)")
                    .attr("stroke-width", 2);
                }
              });

            // Update or create text
            const fontSize = Math.max(9, Math.min(11, 10 * sizeScale));
            group.selectAll("text").remove(); // Remove old text
            const text = group.append("text")
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("fill", isSelected ? "rgb(255, 255, 255)" : "rgb(226, 232, 240)")
              .attr("font-size", `${fontSize}px`)
              .attr("font-weight", "600")
              .style("pointer-events", "none");

            const words = d.name.split(/\s+/);
            if (words.length > 1 && d.name.length > 10) {
              text.append("tspan")
                .attr("x", 0)
                .attr("dy", "-0.35em")
                .text(words.slice(0, Math.ceil(words.length / 2)).join(" "));
              text.append("tspan")
                .attr("x", 0)
                .attr("dy", "1.1em")
                .text(words.slice(Math.ceil(words.length / 2)).join(" "));
            } else {
              text.text(d.name);
            }
          });

        // Update company node positions
        companyGroup.selectAll<SVGGElement, CompanyNodeType>("g")
          .data(companyNodes)
          .join("g")
          .attr("transform", d => `translate(${d.x}, ${d.y})`)
          .style("cursor", "pointer")
          .style("opacity", d => {
            if (!selectedCategory) return 1;
            return selectedCategory.connections.has(d.companyId) ? 1 : 0.4;
          })
          .each(function(d) {
            const group = d3.select(this);
            const connectionType = selectedCategory?.connections.get(d.companyId);

            const fillColor = !selectedCategory
              ? "rgb(30, 41, 59)"
              : connectionType === "primary"
              ? "rgba(234, 88, 12, 0.3)"   // Orange-600 with transparency
              : connectionType === "secondary"
              ? "rgba(251, 146, 60, 0.25)"  // Orange-400 with transparency
              : connectionType === "tertiary"
              ? "rgba(253, 186, 116, 0.2)"  // Orange-300 with transparency
              : "rgb(15, 23, 42)";

            const strokeColor = !selectedCategory
              ? "rgb(100, 116, 139)"
              : connectionType
              ? HIGHLIGHT_COLORS[connectionType]
              : "rgb(51, 65, 85)";

            const strokeWidth = !selectedCategory
              ? 1.5
              : connectionType === "primary"
              ? 3
              : connectionType === "secondary"
              ? 2.5
              : connectionType === "tertiary"
              ? 2
              : 1;

            // Update or create circle
            group.selectAll("circle")
              .data([d])
              .join("circle")
              .attr("r", COMPANY_NODE_RADIUS)
              .attr("fill", fillColor)
              .attr("stroke", strokeColor)
              .attr("stroke-width", strokeWidth)
              .on("mouseenter", function() {
                const hoverStroke = connectionType ? strokeColor : "rgb(96, 165, 250)";
                const circle = this as SVGCircleElement;
                d3.select(circle)
                  .transition()
                  .duration(150)
                  .attr("stroke", hoverStroke)
                  .attr("stroke-width", 3)
                  .attr("r", COMPANY_NODE_RADIUS + 2);
                if (circle.parentNode) {
                  d3.select(circle.parentNode as SVGGElement)
                    .transition()
                    .duration(150)
                    .style("opacity", 1);
                }
                setHoveredNode(d.data);
              })
              .on("mouseleave", function() {
                const circle = this as SVGCircleElement;
                d3.select(circle)
                  .transition()
                  .duration(150)
                  .attr("stroke", strokeColor)
                  .attr("stroke-width", strokeWidth)
                  .attr("r", COMPANY_NODE_RADIUS);
                if (circle.parentNode) {
                  d3.select(circle.parentNode as SVGGElement)
                    .transition()
                    .duration(150)
                    .style("opacity", selectedCategory && !connectionType ? 0.4 : 1);
                }
                setHoveredNode(null);
              });

            // Update or create logo/initials (only once)
            if (group.selectAll("image, text.company-logo").empty()) {
              const logoPath = getCompanyLogo(d.name);
              group.append("image")
                .attr("href", logoPath)
                .attr("x", -28)
                .attr("y", -28)
                .attr("width", 56)
                .attr("height", 56)
                .style("pointer-events", "none")
                .on("error", function() {
                  d3.select(this).remove();
                  group.append("text")
                    .attr("class", "company-logo")
                    .text(d.name.substring(0, 2).toUpperCase())
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .attr("fill", "white")
                    .attr("font-size", "14px")
                    .attr("font-weight", "600")
                    .style("pointer-events", "none");
                });
            }
          });
      };

      // Initial render
      render();

      // Run simulation and update on each tick
      simulation.on("tick", render);

      // Stop simulation after it settles
      simulation.on("end", () => {
        console.log("Force simulation completed");
      });

      // Click on background to deselect
      svg.on("click", () => {
        setSelectedCategory(null);
      });

      // Cleanup function
      return () => {
        simulation.stop();
      };
    } catch (error) {
      console.error("Error rendering SectorView:", error);
    }
  }, [portfolioData, loading, dimensions, selectedCategory]);

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
    <div className="portfolio__sector">
      <svg ref={svgRef} className="portfolio__sector-svg" />

      {/* Legend */}
      <div className="portfolio__sector-legend">
        <div className="portfolio__sector-legend-title">
          {selectedCategory
            ? `"${selectedCategory.name}"`
            : "Click a sector to highlight"}
        </div>
        {!selectedCategory && allCategories.length > 0 && (
          <div className="portfolio__sector-legend-items" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.375rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {allCategories.map((category) => (
              <div
                key={category}
                className="portfolio__sector-legend-item"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  const connections = new Map<number, "primary" | "secondary" | "tertiary">();
                  portfolioData.forEach((c) => {
                    if (c.primary === category) {
                      connections.set(c.id, "primary");
                    } else if (c.secondary === category) {
                      connections.set(c.id, "secondary");
                    } else if (c.tertiary === category) {
                      connections.set(c.id, "tertiary");
                    }
                  });
                  setSelectedCategory({ name: category, connections });
                }}
              >
                <span style={{ fontSize: '0.75rem' }}>{category}</span>
              </div>
            ))}
          </div>
        )}
        {selectedCategory && (
          <button
            className="portfolio__sector-legend-clear"
            onClick={() => setSelectedCategory(null)}
          >
            Clear selection
          </button>
        )}
      </div>

      {hoveredNode && (
        <div className="portfolio__sector-tooltip">
          <h3 className="portfolio__sector-tooltip-name">{hoveredNode.name}</h3>
          <p className="portfolio__sector-tooltip-desc">
            {hoveredNode.description}
          </p>
          <div className="portfolio__list-badges">
            <Badge variant="secondary">{hoveredNode.primary}</Badge>
            {hoveredNode.secondary && (
              <Badge variant="secondary">{hoveredNode.secondary}</Badge>
            )}
            {hoveredNode.tertiary && (
              <Badge variant="secondary">{hoveredNode.tertiary}</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
