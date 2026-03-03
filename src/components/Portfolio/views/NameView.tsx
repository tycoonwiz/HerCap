import { useState } from "react";
import { motion } from "framer-motion";
import { usePortfolio } from "@/data/portfolio";
import { Card, CardContent } from "@/components/ui/Card/Card";
import { getCompanyLogo } from "@/utils/getCompanyLogo";

export function NameView() {
  const { portfolioData, loading, error } = usePortfolio();
  const [visibleCount, setVisibleCount] = useState(20);
  const sortedData = [...portfolioData].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const visibleData = sortedData.slice(0, visibleCount);
  const hasMore = visibleCount < sortedData.length;

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
      <div className="portfolio__grid">
        {visibleData.map((company, idx) => (
          <motion.div
            key={company.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (idx % 20) * 0.03 }}
          >
            {company.website ? (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="portfolio__card-link"
              >
                <Card className="portfolio__card">
                  <CardContent className="portfolio__card-content">
                    <div className="portfolio__card-avatar">
                      <img
                        src={getCompanyLogo(company.name)}
                        alt={`${company.name} logo`}
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
                    <div className="portfolio__card-sector">{company.primary}</div>
                    <p className="portfolio__card-desc">{company.description}</p>
                  </CardContent>
                </Card>
              </a>
            ) : (
              <Card className="portfolio__card">
                <CardContent className="portfolio__card-content">
                  <div className="portfolio__card-avatar">
                    <img
                      src={getCompanyLogo(company.name)}
                      alt={`${company.name} logo`}
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
                  <div className="portfolio__card-sector">{company.primary}</div>
                  <p className="portfolio__card-desc">{company.description}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>
      {hasMore && (
        <div className="portfolio__load-more">
          <button
            onClick={() =>
              setVisibleCount((prev) => Math.min(prev + 20, sortedData.length))
            }
            className="portfolio__load-btn"
          >
            Load More ({sortedData.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
