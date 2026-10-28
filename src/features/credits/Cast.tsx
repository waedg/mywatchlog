import { User } from 'lucide-react'
import { Link } from 'react-router-dom'

import { profileUrl } from '@/lib/tmdb-images'
import type { CastMember } from '../../../shared/tmdb-types'

/** Premiers rôles : grille qui s'adapte à la largeur de l'écran, chaque acteur mène à sa filmographie. */
export default function Cast({ cast }: { cast: CastMember[] }) {
  if (cast.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Casting</h2>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {cast.map((member) => {
          const src = profileUrl(member.profilePath)
          return (
            <li key={member.id} className="min-w-0">
              <Link
                to={`/person/${member.id}`}
                className="block space-y-1.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {src ? (
                  <img src={src} alt="" loading="lazy" className="aspect-[2/3] w-full rounded-lg border object-cover" />
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg border bg-card text-muted-foreground">
                    <User className="size-6" />
                  </div>
                )}
                <p className="line-clamp-2 break-words text-xs font-medium leading-snug">{member.name}</p>
                {member.character && <p className="line-clamp-2 break-words text-xs leading-snug text-muted-foreground">{member.character}</p>}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
