import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { AssetListPage } from './pages/AssetListPage'
import { AssetDetailPage } from './pages/AssetDetailPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="assets/:typeKey" element={<AssetListPage />} />
        <Route path="assets/:typeKey/:id" element={<AssetDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
