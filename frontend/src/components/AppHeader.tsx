import type { PropsWithChildren, ReactNode } from 'react'
import PrimaryNav from './PrimaryNav'

interface AppHeaderProps extends PropsWithChildren {
  subtitle?: ReactNode
}

const defaultSubtitle = '> orchestrate hot / cold media pools like a CLI — but pretty.'

const AppHeader = ({ subtitle = defaultSubtitle, children }: AppHeaderProps) => {
  return (
    <header className="top-bar">
      <div className="top-left">
        <div className="window-dots" aria-hidden="true">
          <span className="window-dot window-dot--red" />
          <span className="window-dot window-dot--yellow" />
          <span className="window-dot window-dot--green" />
        </div>
        <div className="logo-block">
          <div className="logo-main">
            <span>JELLYMOVER</span>
            <span>FIRE ∧ ICE</span>
          </div>
          <div className="logo-sub">{subtitle}</div>
        </div>
      </div>

      <div className="top-right">
        {children ? <div className="header-actions">{children}</div> : null}
        <PrimaryNav />
      </div>
    </header>
  )
}

export default AppHeader
