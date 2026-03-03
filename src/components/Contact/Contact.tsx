import { motion } from 'framer-motion'
import './Contact.css'

interface ContactRowProps {
  label: string
  email: string
}

function ContactRow({ label, email }: ContactRowProps) {
  return (
    <div className="contact-row">
      <div className="contact-row__label">{label}</div>
      <a href={`mailto:${email}`} className="contact-row__email">
        {email}
      </a>
    </div>
  )
}

export function Contact() {
  return (
    <section id="contact" className="contact">
      <div className="contact__container">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="contact__title"
        >
          Contact
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="contact__info"
        >
          <ContactRow label="Fundraise inquiries" email="pitch@heraldcapitalpartners.com" />
          <ContactRow label="Media inquiries" email="press@heraldcapitalpartners.com" />
          <ContactRow label="All other inquiries" email="info@heraldcapitalpartners.com" />
        </motion.div>
      </div>
    </section>
  )
}

