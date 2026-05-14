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
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--bg-sidebar)] backdrop-blur-xl border-b border-[var(--border-color)] z-[98] px-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--accent-primary)]">
          📚 C-Book
        </h2>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-glass)] text-[var(--text-primary)] hover:bg-[var(--bg-glass-strong)] transition-colors"
            onClick={() => setCmdOpen(true)}
            title="Ctrl+K"
          >
            <Command size={18} />
          </button>
          <button
            className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-glass)] text-[var(--text-primary)] hover:bg-[var(--bg-glass-strong)] transition-colors"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-[260px] min-h-screen max-w-full md:max-w-[calc(100%-260px)] px-4 md:px-8 pb-8 pt-[calc(3.5rem+1rem)] md:pt-0">
        {/* Desktop topbar */}
        <div className="hidden md:flex justify-between items-center py-4 mb-2">
          <div />
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)] transition-all text-xs font-mono opacity-70"
              onClick={() => setCmdOpen(true)}
            >
              <Command size={13} /> Ctrl+K
            </button>
            <ThemeToggle />
          </div>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-9 h-9 border-3 border-[var(--border-color)] border-t-primary-500 rounded-full animate-spin" />
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
