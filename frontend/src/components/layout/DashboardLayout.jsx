import { useState, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import ThemeToggle from '../ui/ThemeToggle';
import CommandPalette from '../ui/CommandPalette';
import { Command } from 'lucide-react';

export default function DashboardLayout() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Main Content */}
      <main className="min-h-screen px-4 md:px-8 pb-8 pt-20 max-w-[1600px] mx-auto">
        {/* Top bar with utilities */}
        <div className="flex justify-end items-center py-3 mb-2">
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
          <Outlet key={location.pathname} />
        </Suspense>
      </main>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
