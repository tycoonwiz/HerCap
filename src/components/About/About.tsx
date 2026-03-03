import { motion } from 'framer-motion'
import './About.css'

export function About() {
  return (
    <section id="about" className="about">
      <div className="about__container">
        <div className="about__grid">
          <div className="about__header">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="about__title"
            >
              About Us
            </motion.h2>
          </div>
          <div className="about__content">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Herald Capital is a venture investment manager with a portfolio of 100+ companies, spanning stages from pre-seed to publicly traded. We partner with founders from first fundraise to exit, providing hands-on support across fundraising, business strategy, marketing, operations, and more.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              Our team brings deep expertise in venture investing, building and scaling businesses, and professionalizing organizations as they grow. We have worked alongside founders to refine business models, strengthen operating foundations, build leadership teams, and prepare companies for growth-stage scale, partnerships, and liquidity events.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Herald's global portfolio focuses on consumer and business services, tech-enabled platforms, health, marketing technology, consumer packaged goods, sports, and climate tech. Drawing on decades of experience across M&A advisory, innovation strategy, and international marketing, we work actively with founders to help them build durable companies positioned for success.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}

