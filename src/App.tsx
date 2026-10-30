import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AboutPage from '@/pages/AboutPage'
import AppLayout from '@/components/layout/AppLayout'
import ScrollToTop from '@/components/ScrollToTop'
import DiscoverPage from '@/pages/DiscoverPage'
import ExplorePage from '@/pages/ExplorePage'
import RequireAuth from '@/features/auth/RequireAuth'
import LibraryPage from '@/pages/LibraryPage'
import LoginPage from '@/pages/LoginPage'
import PersonPage from '@/pages/PersonPage'
import SearchPage from '@/pages/SearchPage'
import TitleDetailPage from '@/pages/TitleDetailPage'
import UpcomingPage from '@/pages/UpcomingPage'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/search" element={<SearchPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/discover/explore" element={<ExplorePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/upcoming" element={<UpcomingPage />} />
            <Route path="/person/:id" element={<PersonPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/title/:type/:id" element={<TitleDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
