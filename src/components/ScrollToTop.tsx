import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Ouvre chaque nouvelle page en haut. Seul un changement de chemin déclenche le défilement :
 * modifier un filtre (paramètres d'URL) ou revenir en arrière ne ramène pas en haut.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const previous = useRef(pathname)

  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}
