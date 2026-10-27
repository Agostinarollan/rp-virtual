import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { PrescripcionesListPage } from './pages/PrescripcionesListPage';
import { PrescripcionFormPage } from './pages/PrescripcionFormPage';
import { PrescripcionDetailPage } from './pages/PrescripcionDetailPage';
import { PrescripcionEditPage } from './pages/PrescripcionEditPage';
import { PacientesPage } from './pages/PacientesPage';
import { ProfesionalesPage } from './pages/ProfesionalesPage';
import { ObrasSocialesPage } from './pages/ObrasSocialesPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { MiFirmaPage } from './pages/MiFirmaPage';

function App() {
  return (
    <ConfigProvider locale={esES} theme={{ token: { colorPrimary: '#0f766e' } }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/prescripciones" replace />} />
              <Route path="/prescripciones" element={<PrescripcionesListPage />} />
              <Route path="/prescripciones/nueva" element={<PrescripcionFormPage />} />
              <Route path="/prescripciones/:id" element={<PrescripcionDetailPage />} />
              <Route path="/prescripciones/:id/editar" element={<PrescripcionEditPage />} />
              <Route path="/pacientes" element={<PacientesPage />} />
              <Route path="/profesionales" element={<ProfesionalesPage />} />
              <Route path="/obras-sociales" element={<ObrasSocialesPage />} />
              <Route path="/usuarios" element={<UsuariosPage />} />
              <Route path="/mi-firma" element={<MiFirmaPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
