import { motion } from 'framer-motion'
import './Team.css'
import camHeadshot from '../../../headshots/cam.jpeg'
import timHeadshot from '../../../headshots/tim.webp'

export function Team() {
  return (
    <section id="team" className="team">
      <div className="team__container">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="team__title"
        >
          Team
        </motion.h2>

        <div className="team__grid">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="team__member"
          >
            <div className="team__image-wrapper">
              <img
                src={camHeadshot}
                alt="Cam Murchison"
                className="team__image"
              />
            </div>
            <h3 className="team__name">Cam Murchison</h3>
            <p className="team__description">
              Cameron Murchison is the CEO of Attivo Group, a marketing services collective operating across Australia, New Zealand, and the U.S., founded in 2012 to address modern business challenges through connected thinking and collaboration. He has grown Attivo through agency partnerships, new service creation, and strategic investments across ANZ and the U.S., while empowering strong local leadership and maintaining a customer-centric, growth-oriented approach. At Herald Capital, Cameron works hands-on with portfolio founders to sharpen positioning, accelerate commercialization, and build scalable go-to-market and partnership strategies that translate product strength into durable growth.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="team__member"
          >
            <div className="team__image-wrapper">
              <img
                src={timHeadshot}
                alt="Timothy Ladin"
                className="team__image"
              />
            </div>
            <h3 className="team__name">Timothy Ladin</h3>
            <p className="team__description">
              Tim is a seasoned family office executive and investment professional with three decades of experience advising multi-generational high-net-worth families across public, private, and alternative investments. He has served as Chief Operating, Legal, and Compliance Officer, building scalable, service-oriented organizations with strong governance, tax efficiency, and risk management. Tim brings deep experience as a board member, dealmaker, and mentor, acting as a trusted advisor on complex legal and financial matters. At Herald Capital, Tim partners closely with portfolio companies on governance, capital strategy, operational excellence, and long-term value creation.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
