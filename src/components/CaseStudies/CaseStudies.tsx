import { useState } from 'react'
import { motion } from 'framer-motion'
import './CaseStudies.css'

export function CaseStudies() {
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')

  return (
    <section id="case-studies" className="case-studies">
      <div className="case-studies__bg">
        <div className="case-studies__blob case-studies__blob--1" />
        <div className="case-studies__blob case-studies__blob--2" />
      </div>
      <div className="case-studies__container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="case-studies__content"
        >
          <button onClick={() => setShowModal(true)} className="case-studies__title">
            View Case Studies
          </button>
        </motion.div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal"
          >
            <button
              onClick={() => { setShowModal(false); setPassword('') }}
              className="modal__close"
            >
              ✕
            </button>
            <h3 className="modal__title">Access Case Studies</h3>
            <p className="modal__text">Enter your password to view our case studies.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="modal__input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  alert('Incorrect Password')
                }
              }}
            />
            <button
              onClick={() => alert('Incorrect Password')}
              className="modal__submit"
            >
              Submit
            </button>
          </motion.div>
        </div>
      )}
    </section>
  )
}

