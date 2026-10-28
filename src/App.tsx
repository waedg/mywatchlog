import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/layout/AppLayout'
import RequireAuth from '@/features/auth/RequireAuth'
import LibraryPage from '@/pages/LibraryPage'
import LoginPage from '@/pages/LoginPage'
import SearchPage from '@/pages/SearchPage'
import TitleDetailPage from '@/pages/TitleDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/search" element={<SearchPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/title/:type/:id" element={<TitleDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
