import { CalendarDays, Clapperboard, Info, Library, LogOut, Search, WifiOff } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useOnline } from '@/hooks/useOnline'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'

const links = [
  { to: '/search', label: 'Recherche', icon: Search },
  { to: '/library', label: 'Ma liste', icon: Library },
  { to: '/upcoming', label: 'Sorties', icon: CalendarDays },
  { to: '/about', label: 'À propos', icon: Info },
]

function Brand() {
  return (
    <div className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Clapperboard className="size-4" />
      </span>
      <span className="text-lg">MyWatchlog</span>
    </div>
  )
}

export default function AppLayout() {
  const { signOut } = useAuth()
  const online = useOnline()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Brand />
          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                      isActive && 'bg-accent text-foreground',
                    )
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <Button variant="ghost" size="icon" aria-label="Se déconnecter" onClick={() => void signOut()}>
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      {!online && (
        <div role="status" className="flex items-center justify-center gap-2 border-b bg-secondary px-4 py-2 text-xs">
          <WifiOff className="size-3.5" />
          Hors connexion : ta liste est en lecture seule.
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-10">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Navigation principale"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground transition-colors',
                  isActive && 'text-primary',
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
