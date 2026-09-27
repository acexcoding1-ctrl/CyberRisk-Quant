import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Sliders, 
  DollarSign, 
  Database, 
  FileCheck2, 
  Download, 
  RefreshCw 
} from 'lucide-react';
import { Currency } from '../types/risk';
import { ConnectionState } from '../types/api';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  onOpenBoardBrief: () => void;
  isSyncing: boolean;
  onRefreshTelemetry: () => void;
  backendState?: ConnectionState;
  backendUrl?: string;
  onRefreshBackend?: () => void;
  isRefreshingBackend?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  onOpenBoardBrief,
  isSyncing,
  onRefreshTelemetry,
  backendState = 'checking',
  backendUrl = 'http://localhost:8000',
  onRefreshBackend,
  isRefreshingBackend = false,
}) => {
  const tabs = [
    { id: 'executive', label: 'Executive Dashboard', icon: ShieldCheck },
    { id: 'telemetry', label: 'Telemetry & Assets', icon: Database },
    { id: 'simulator', label: 'Scenario Simulator', icon: Sliders },
    { id: 'optimizer', label: 'Investment & ROSI', icon: DollarSign },
    { id: 'compliance', label: 'Compliance & Frameworks', icon: FileCheck2 },
    { id: 'ai-assistant', label: 'AI Decision Copilot', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('executive')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-sm ring-1 ring-emerald-600/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">CyberRisk<span className="text-emerald-600 font-extrabold">Quant</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  FAIR ML Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">Continuous Monetary Cyber Exposure</p>
            </div>
          </div>

          {/* FastAPI Backend Status Badge */}
          <div 
            className={`hidden lg:flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-1 rounded-full border transition-all ${
              backendState === 'connected' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : backendState === 'checking'
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
            title={`FastAPI backend (${backendUrl}): ${backendState === 'connected' ? 'Live Connected' : 'Resilient Baseline Active'}`}
          >
            <span className={`w-2 h-2 rounded-full ${
              backendState === 'connected' 
                ? 'bg-emerald-500 animate-pulse' 
                : backendState === 'checking'
                ? 'bg-slate-400' 
                : 'bg-amber-500'
            }`} />
            <span>FastAPI: {backendState === 'connected' ? 'Connected' : 'Baseline Active'}</span>
            {onRefreshBackend && (
              <button 
                onClick={onRefreshBackend}
                disabled={isRefreshingBackend}
                title="Check connection at http://localhost:8000"
                className="ml-0.5 text-slate-400 hover:text-slate-700"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingBackend ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            )}
          </div>

          {/* Telemetry live beacon */}
          <div className="hidden xl:flex items-center gap-2 text-xs bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-slate-700">
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-slate-600 font-medium">{isSyncing ? 'Synchronizing Telemetry...' : '6/6 Telemetry Feeds Active'}</span>
            <button 
              onClick={onRefreshTelemetry} 
              disabled={isSyncing}
              title="Poll telemetry sources now"
              className="ml-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Controls: Currency Selector & Board Brief Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs text-slate-600">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                currency === 'USD' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('INR')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                currency === 'INR' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              INR (₹)
            </button>
            <button
              onClick={() => setCurrency('EUR')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                currency === 'EUR' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EUR (€)
            </button>
          </div>

          <button
            id="btn-board-brief"
            onClick={onOpenBoardBrief}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>AI Board Brief</span>
          </button>
        </div>
      </div>
    </header>
  );
};
