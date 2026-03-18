import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import KategorienPage from '@/pages/KategorienPage';
import NotizSchlagwoerterZuordnungPage from '@/pages/NotizSchlagwoerterZuordnungPage';
import NotizenPage from '@/pages/NotizenPage';
import SchlagwoerterPage from '@/pages/SchlagwoerterPage';
import SchnellerfassungPage from '@/pages/SchnellerfassungPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="kategorien" element={<KategorienPage />} />
          <Route path="notiz-schlagwoerter-zuordnung" element={<NotizSchlagwoerterZuordnungPage />} />
          <Route path="notizen" element={<NotizenPage />} />
          <Route path="schlagwoerter" element={<SchlagwoerterPage />} />
          <Route path="schnellerfassung" element={<SchnellerfassungPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}