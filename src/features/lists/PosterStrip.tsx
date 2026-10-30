import { posterUrl } from '@/lib/tmdb-images'

/** Mosaïque de 4 mini-affiches (cases vides si la liste a moins de 4 titres avec affiche). */
export default function PosterStrip({ posters }: { posters: string[] }) {
  return (
    <div className="grid grid-cols-4 gap-1" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => {
        const src = posterUrl(posters[index], 'w185')
        return (
          <div key={index} className="aspect-[2/3] overflow-hidden rounded-md bg-muted">
            {src && <img src={src} alt="" loading="lazy" className="size-full object-cover" />}
          </div>
        )
      })}
    </div>
  )
}
