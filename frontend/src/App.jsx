import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import PageLoader from './components/ui/PageLoader';
import ErrorBoundary from './components/ui/ErrorBoundary';
import SupportFab from './components/ui/SupportFab';

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

// Soporte
const SoporteDashboard      = lazy(() => import('./pages/support/SoporteDashboard'));
const BandejaTickets        = lazy(() => import('./pages/support/BandejaTickets'));
const DetalleTicket         = lazy(() => import('./pages/support/DetalleTicket'));
const ReportarError         = lazy(() => import('./pages/support/ReportarError'));
const MisReportes           = lazy(() => import('./pages/support/MisReportes'));
const ConfiguracionSoporte  = lazy(() => import('./pages/support/ConfiguracionSoporte'));

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
          <Route path="/soporte/reportar" element={<ReportarError />} />

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
            {/* Soporte — Usuario */}
            <Route path="soporte/reportar" element={<ReportarError />} />
            <Route path="soporte/mis-reportes" element={<MisReportes />} />
            <Route path="soporte/mis-reportes/:id" element={<DetalleTicket />} />
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
            {/* Soporte — Admin */}
            <Route path="soporte" element={<SoporteDashboard />} />
            <Route path="soporte/tickets" element={<BandejaTickets />} />
            <Route path="soporte/tickets/:id" element={<DetalleTicket />} />
            <Route path="soporte/reportar" element={<ReportarError />} />
            <Route path="soporte/mis-reportes" element={<MisReportes />} />
            <Route path="soporte/config" element={<ConfiguracionSoporte />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SupportFab />
        </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
