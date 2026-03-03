import { motion } from 'framer-motion'
import Threads from './Threads'
import './Hero.css'

export function Hero() {
  return (
    <section id="top" className="hero">
      <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
        <Threads
          amplitude={2.5}
          distance={0.05}
          enableMouseInteraction={false}
        />
      </div>

      {/* Content */}
      <div className="hero__content">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="hero__title"
        >
          HERALD CAPITAL
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="hero__subtitle"
        >
          Early-stage venture support from first raise to exit.
        </motion.p>
      </div>
    </section>
  )
}

