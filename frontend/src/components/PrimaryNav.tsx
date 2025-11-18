import { NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  ['primary-nav-link', isActive ? 'primary-nav-link--active' : '']
    .filter(Boolean)
    .join(' ')

const PrimaryNav = () => {
  return (
    <nav className="primary-nav" aria-label="Primary navigation">
      <NavLink to="/" end className={navLinkClass}>
        Library
      </NavLink>
      <NavLink to="/jobs" className={navLinkClass}>
        Jobs
      </NavLink>
      <NavLink to="/stats" className={navLinkClass}>
        Stats
      </NavLink>
      <NavLink to="/settings" className={navLinkClass}>
        Settings
      </NavLink>
    </nav>
  )
}

export default PrimaryNav
