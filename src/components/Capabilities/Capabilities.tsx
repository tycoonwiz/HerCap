import { motion } from 'framer-motion'
import './Capabilities.css'

interface CapabilityCategory {
  title: string
  items: string[]
}

const capabilities: CapabilityCategory[] = [
  {
    title: 'Fundraising',
    items: [
      'Fundraising strategy',
      'Pitch refinement and narrative development',
      'Pitch coaching and investor Q&A preparation',
      'Investor introductions and syndicate development',
      'Term sheet review and deal-structure guidance',
    ],
  },
  {
    title: 'Brand, Marketing, and Go-to-Market',
    items: [
      'Brand positioning and messaging strategy',
      'Target customer definition',
      'Go-to-market strategy development',
      'Marketing channel strategy, prioritization, and measurement',
      'Marketing campaign services',
    ],
  },
  {
    title: 'Business and Growth Strategy',
    items: [
      'Market sizing and competitive landscape analysis',
      'Growth roadmap and milestone planning',
      'Commercialization strategy',
      'Business model design',
      'Long-term growth and strategic positioning',
    ],
  },
  {
    title: 'Operations and Governance',
    items: [
      'Operating model and organization design guidance',
      'Hiring strategy and leadership support',
      'Board formation and governance best practices',
      'Risk, compliance, and structural advising',
    ],
  },
  {
    title: 'Partnerships and Ecosystem Access',
    items: [
      'Enterprise partnership strategy development',
      'Customer and pilot introductions',
      'Agency, platform, and ecosystem relationships',
      'Access to Herald Capital\'s mentor network',
      'Corporate development strategy and partnership-led M&A',
    ],
  },
  {
    title: 'Finance and Tax Strategy',
    items: [
      'Financial planning and forecasting',
      'Unit economics and contribution margin optimization',
      'Capital structure and dilution planning',
      'Tax-aware business and entity structuring',
      'Exit, liquidity, and financial readiness planning',
    ],
  },
]

export function Capabilities() {
  return (
    <section id="capabilities" className="capabilities">
      <div className="capabilities__container">
        <div className="capabilities__layout">
          <div className="capabilities__header">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="capabilities__title"
            >
              Capabilities
            </motion.h2>
          </div>
          <div className="capabilities__intro">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="capabilities__heading"
            >
              Herald Capital goes beyond financial investment, working hands-on with founders to help unlock opportunities, strengthen fundamentals, and build enduring companies.
            </motion.p>
          </div>
        </div>

        <div className="capabilities__grid">
          {capabilities.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              className="capabilities__category"
            >
              <h3 className="capabilities__category-title">{category.title}</h3>
              <ul className="capabilities__list">
                {category.items.map((item) => (
                  <li key={item} className="capabilities__item">
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
