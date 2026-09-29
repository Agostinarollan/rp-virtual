import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { PrescripcionesListPage } from './pages/PrescripcionesListPage';
import { PrescripcionFormPage } from './pages/PrescripcionFormPage';
import { PrescripcionDetailPage } from './pages/PrescripcionDetailPage';

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
              {/* Pacientes, Profesionales, Obras sociales y Usuarios (ABMs
                  del Administrador) quedan para la próxima entrega. */}
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
