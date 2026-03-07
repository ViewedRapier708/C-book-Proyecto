import { useState, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import ThemeToggle from '../ui/ThemeToggle';
import CommandPalette from '../ui/CommandPalette';
import { Menu, Command } from 'lucide-react';

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="page-layout">
      <div className="mobile-header">
        <h2>📚 C-Book</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ThemeToggle />
          <button className="btn btn-icon" style={{ color: 'var(--text-primary)' }} onClick={() => setCmdOpen(true)} title="Ctrl+K">
            <Command size={18} />
          </button>
          <button className="btn btn-icon" style={{ color: 'var(--text-primary)' }} onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
        </div>
      </div>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="main-content">
        <div className="main-topbar">
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCmdOpen(true)}
              style={{ gap: '0.4rem', opacity: 0.7, fontFamily: 'monospace', fontSize: '0.75rem' }}
            >
              <Command size={13} /> Ctrl+K
            </button>
            <ThemeToggle />
          </div>
        </div>
        <Suspense fallback={
          <div className="spinner-container" style={{ minHeight: '40vh' }}>
            <div className="spinner" />
          </div>
        }>
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </Suspense>
      </main>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
