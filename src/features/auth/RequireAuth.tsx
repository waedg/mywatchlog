import { Navigate, Outlet } from 'react-router-dom'

import FullScreenLoader from '@/components/layout/FullScreenLoader'

import AccessScreen from './AccessScreen'
import { useAuth } from './auth-context'

export default function RequireAuth() {
  const { status } = useAuth()

  if (status === 'loading') return <FullScreenLoader />
  if (status === 'signed-out') return <Navigate to="/login" replace />
  if (status === 'denied' || status === 'error') return <AccessScreen status={status} />
  return <Outlet />
}
