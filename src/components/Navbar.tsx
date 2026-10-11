import React from 'react';
import { ShieldCheck, QrCode, PlusCircle, CheckCircle2, FileText, Bug } from 'lucide-react';

interface NavbarProps {
  activeTab: 'registry' | 'generator' | 'labels' | 'verify' | 'tests';
  onSelectTab: (tab: 'registry' | 'generator' | 'labels' | 'verify' | 'tests') => void;
  onOpenNewIdeaModal: () => void;
  totalDocuments: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewIdeaModal,
  totalDocuments,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Institution Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('registry')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                    VJEC IdeaLock
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full">
                    IP SEAL
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Vimal Jyothi Engineering College
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectTab('registry')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'registry'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Idea Registry</span>
              <span className="md:hidden">Registry</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-[11px] rounded-full text-slate-300">
                {totalDocuments}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('generator')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'generator'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Code Generator</span>
            </button>

            <button
              onClick={() => onSelectTab('labels')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'labels'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden md:inline">Protection Labels</span>
              <span className="md:hidden">Labels</span>
            </button>

            <button
              onClick={() => onSelectTab('verify')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'verify'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden md:inline">Verification Portal</span>
              <span className="md:hidden">Verify</span>
            </button>

            <button
              onClick={() => onSelectTab('tests')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'tests'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Run Security & Code Generation Tests"
            >
              <Bug className="w-4 h-4" />
              <span className="hidden lg:inline">Security Tests</span>
            </button>
          </nav>

          {/* New Registration Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewIdeaModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Idea</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
