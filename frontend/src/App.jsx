import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import HorarioRestriction from './components/layout/HorarioRestriction';
import DashboardLayout from './components/layout/DashboardLayout';
import PageLoader from './components/ui/PageLoader';
import ErrorBoundary from './components/ui/ErrorBoundary';
import SupportFab from './components/ui/SupportFab';

const Login              = lazy(() => import('./pages/Login'));
const EmailVerification  = lazy(() => import('./pages/EmailVerification'));
const EmailConfirmed     = lazy(() => import('./pages/EmailConfirmed'));
const ConfirmarCuenta    = lazy(() => import('./pages/ConfirmarCuenta'));
const ForgotPassword     = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword      = lazy(() => import('./pages/ResetPassword'));

const UserHome             = lazy(() => import('./pages/user/UserHome'));
const SolicitudLibros      = lazy(() => import('./pages/user/SolicitudLibros'));
const MisSolicitudes       = lazy(() => import('./pages/user/MisSolicitudes'));
const MisSolicitudesLibros = lazy(() => import('./pages/user/MisSolicitudesLibros'));
const UserProfile          = lazy(() => import('./pages/user/UserProfile'));
const ModificarCuenta      = lazy(() => import('./pages/user/ModificarCuenta'));

const AdminHome         = lazy(() => import('./pages/admin/AdminHome'));
const AltaAlumnos       = lazy(() => import('./pages/admin/AltaAlumnos'));
const AltaLibros        = lazy(() => import('./pages/admin/AltaLibros'));
const Usuarios          = lazy(() => import('./pages/admin/Usuarios'));
const Documentos        = lazy(() => import('./pages/admin/Documentos'));
const SolicitudesLibros = lazy(() => import('./pages/admin/SolicitudesLibros'));
const PrestamosLibros   = lazy(() => import('./pages/admin/PrestamosLibros'));
const Analytics         = lazy(() => import('./pages/admin/Analytics'));
const Reportes          = lazy(() => import('./pages/admin/Reportes'));
const NotFound          = lazy(() => import('./pages/NotFound'));

const SoporteDashboard     = lazy(() => import('./pages/support/SoporteDashboard'));
const BandejaTickets       = lazy(() => import('./pages/support/BandejaTickets'));
const DetalleTicket        = lazy(() => import('./pages/support/DetalleTicket'));
const ReportarError        = lazy(() => import('./pages/support/ReportarError'));
const MisReportes          = lazy(() => import('./pages/support/MisReportes'));
const AgregarAgenteSoporte = lazy(() => import('./pages/support/AgregarAgenteSoporte'));

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
              <Route path="/" element={<Login />} />
              <Route path="/confirmar-cuenta" element={<ConfirmarCuenta />} />
              <Route path="/verificar" element={<EmailVerification />} />
              <Route path="/verificado" element={<EmailConfirmed />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/soporte/reportar" element={<ReportarError />} />

              <Route
                path="/user"
                element={
                  <ProtectedRoute role="alumno">
                    <HorarioRestriction>
                      <DashboardLayout />
                    </HorarioRestriction>
                  </ProtectedRoute>
                }
              >
                <Route index element={<UserHome />} />
                <Route path="libros" element={<SolicitudLibros />} />
                <Route path="mis-solicitudes" element={<MisSolicitudes />} />
                <Route path="mis-solicitudes-libros" element={<MisSolicitudesLibros />} />
                <Route path="perfil" element={<UserProfile />} />
                <Route path="cuenta" element={<ModificarCuenta />} />
                <Route path="soporte/reportar" element={<ReportarError />} />
                <Route path="soporte/mis-reportes" element={<MisReportes />} />
                <Route path="soporte/mis-reportes/:id" element={<DetalleTicket />} />
              </Route>

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
                <Route path="soporte/reportar" element={<ReportarError />} />
              </Route>

              <Route
                path="/soporte"
                element={
                  <ProtectedRoute role={['support_admin', 'support_agent']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SoporteDashboard />} />
                <Route path="tickets" element={<BandejaTickets />} />
                <Route path="tickets/:id" element={<DetalleTicket />} />
                <Route path="reportar" element={<ReportarError />} />
                <Route
                  path="agregar-agente"
                  element={
                    <ProtectedRoute role="support_admin">
                      <AgregarAgenteSoporte />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <SupportFab />
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
