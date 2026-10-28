import { useRegisterSW } from 'virtual:pwa-register/react'

import { Button } from '@/components/ui/button'

const CHECK_EVERY_MS = 60 * 60 * 1000

/** Message « Nouvelle version disponible » : la mise à jour n'est appliquée que sur demande. */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => {
        if (navigator.onLine) void registration.update()
      }, CHECK_EVERY_MS)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-20 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-lg md:bottom-4"
    >
      <p className="text-sm">Nouvelle version disponible.</p>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setNeedRefresh(false)}>
          Plus tard
        </Button>
        <Button size="sm" onClick={() => void updateServiceWorker(true)}>
          Recharger
        </Button>
      </div>
    </div>
  )
}
