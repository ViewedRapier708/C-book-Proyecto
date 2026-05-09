import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import PageLoader from './components/ui/PageLoader';
import ErrorBoundary from './components/ui/ErrorBoundary';

// ── Lazy-loaded pages (code-split) ──────────────────────
const Login              = lazy(() => import('./pages/Login'));
const EmailVerification  = lazy(() => import('./pages/EmailVerification'));
const ForgotPassword     = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword      = lazy(() => import('./pages/ResetPassword'));

// User
const UserHome             = lazy(() => import('./pages/user/UserHome'));
const SolicitudLibros      = lazy(() => import('./pages/user/SolicitudLibros'));
const MisSolicitudes       = lazy(() => import('./pages/user/MisSolicitudes'));
const MisSolicitudesLibros = lazy(() => import('./pages/user/MisSolicitudesLibros'));
const UserProfile          = lazy(() => import('./pages/user/UserProfile'));
const ModificarCuenta      = lazy(() => import('./pages/user/ModificarCuenta'));

// Admin
const AdminHome       = lazy(() => import('./pages/admin/AdminHome'));
const AltaAlumnos     = lazy(() => import('./pages/admin/AltaAlumnos'));
const AltaLibros      = lazy(() => import('./pages/admin/AltaLibros'));
const Usuarios        = lazy(() => import('./pages/admin/Usuarios'));
const Documentos      = lazy(() => import('./pages/admin/Documentos'));
const SolicitudesLibros = lazy(() => import('./pages/admin/SolicitudesLibros'));
const PrestamosLibros = lazy(() => import('./pages/admin/PrestamosLibros'));
const Analytics       = lazy(() => import('./pages/admin/Analytics'));
const Reportes        = lazy(() => import('./pages/admin/Reportes'));
const NotFound        = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '0.875rem', borderRadius: '8px' },
          }}
        />
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/verificar" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* User */}
          <Route
            path="/user"
            element={
              <ProtectedRoute role="alumno">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserHome />} />
            <Route path="libros" element={<SolicitudLibros />} />
            <Route path="mis-solicitudes" element={<MisSolicitudes />} />
            <Route path="mis-solicitudes-libros" element={<MisSolicitudesLibros />} />
            <Route path="perfil" element={<UserProfile />} />
            <Route path="cuenta" element={<ModificarCuenta />} />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="Admin">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="alumnos" element={<AltaAlumnos />} />
            <Route path="libros" element={<AltaLibros />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="solicitudes-libros" element={<SolicitudesLibros />} />
            <Route path="prestamos-libros" element={<PrestamosLibros />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
