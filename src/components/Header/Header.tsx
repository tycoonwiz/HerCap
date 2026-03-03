import { navItems } from '@/data/portfolio'
import './Header.css'

export function Header() {
  return (
    <header className="header">
      <div className="header__container">
        <a href="#top" className="header__logo">
          HERALD CAPITAL
        </a>
        <nav className="header__nav">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="header__link">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

