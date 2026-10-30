import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const TABS = [
  { to: '/library', label: 'Statuts', end: true },
  { to: '/library/lists', label: 'Listes', end: false },
] as const

/** Onglets de « Ma liste » : classement par statut, ou listes personnalisées (phase 9). */
export default function LibraryTabs() {
  return (
    <nav className="flex gap-1 rounded-full bg-secondary/60 p-1 w-fit" aria-label="Affichage de Ma liste">
      {TABS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
              isActive && 'bg-primary text-primary-foreground shadow-sm',
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
