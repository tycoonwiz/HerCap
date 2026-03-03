import { motion } from "framer-motion";
import { usePortfolio } from "@/data/portfolio";
import { Badge } from "@/components/ui/Badge/Badge";
import { Card } from "@/components/ui/Card/Card";
import { getCompanyLogo } from "@/utils/getCompanyLogo";

interface StageViewProps {
  stageFilter: string;
  setStageFilter: (filter: string) => void;
}

export function StageView({ stageFilter, setStageFilter }: StageViewProps) {
  const { portfolioData, loading, error } = usePortfolio();
  const stages = ["all", "Angel", "Early", "Growth", "Public"];
  const filteredData =
    stageFilter === "all"
      ? portfolioData
      : portfolioData.filter((c) => c.stage === stageFilter);

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
    <div>
      <div className="portfolio__filters">
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => setStageFilter(stage)}
            className={`portfolio__filter ${
              stageFilter === stage ? "portfolio__filter--active" : ""
            }`}
          >
            {stage}{" "}
            {stage !== "all" &&
              `(${portfolioData.filter((c) => c.stage === stage).length})`}
          </button>
        ))}
      </div>
      <div className="portfolio__list">
        {filteredData.map((company, idx) => (
          <motion.div
            key={company.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Card className="portfolio__list-card">
              <div className="portfolio__list-item">
                <div className="portfolio__list-avatar">
                  <img
                    src={getCompanyLogo(company.name)}
                    alt={`${company.name} logo`}
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
                        parent.textContent = company.name.substring(0, 2).toUpperCase();
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <div className="portfolio__list-info">
                  <h3 className="portfolio__list-name">{company.name}</h3>
                  <p className="portfolio__list-desc">{company.description}</p>
                  <div className="portfolio__list-badges">
                    <Badge variant="secondary">{company.primary}</Badge>
                    {company.secondary && (
                      <Badge variant="secondary">{company.secondary}</Badge>
                    )}
                    {company.tertiary && (
                      <Badge variant="secondary">{company.tertiary}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
