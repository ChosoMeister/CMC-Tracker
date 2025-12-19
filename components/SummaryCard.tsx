
import React from 'react';
import { PortfolioSummary } from '../types';
import { formatToman, formatPercent } from '../utils/formatting';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, BarChart3, Clock } from 'lucide-react';

interface SummaryCardProps {
  summary: PortfolioSummary;
  isRefreshing: boolean;
  lastUpdated: number;
  onRefresh: () => void;
  prices?: any;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, isRefreshing, lastUpdated, onRefresh, prices }) => {
  const isProfit = summary.totalPnlToman >= 0;

  return (
    <div className="relative overflow-hidden mb-4 rounded-[32px]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 gradient-animated opacity-90"></div>

      {/* Glassmorphism overlay */}
      <div className="glass-strong relative p-6 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 blur-[100px] rounded-full"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                <Wallet size={16} className="text-blue-400" />
              </div>
              <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">ارزش فعلی سبد دارایی</span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-90 ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
            >
              <RefreshCw size={16} className="text-slate-300" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2" dir="rtl">
              <h1 className="text-4xl font-black tracking-tight text-white">
                {formatToman(summary.totalValueToman)}
              </h1>
              <span className="text-sm text-slate-500 font-bold">تومان</span>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <div className={`flex items-center gap-1 text-sm font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`} dir="ltr">
                {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{formatPercent(summary.totalPnlPercent)}</span>
              </div>
              <div className={`text-xs font-bold px-2 py-1 rounded-lg ${isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`} dir="rtl">
                {isProfit ? '+' : ''}{formatToman(summary.totalPnlToman)} <span className="text-[10px] opacity-70">تومان</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-black uppercase block">سرمایه‌گذاری اولیه</span>
              <div className="text-sm font-bold text-slate-200" dir="rtl">
                {formatToman(summary.totalCostBasisToman)} <span className="text-[9px] text-slate-500">تومان</span>
              </div>
            </div>
            <div className="space-y-1 border-r border-white/10 pr-3">
              <span className="text-[10px] text-slate-500 font-black uppercase block">سود/ضرر کل</span>
              <div className={`text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`} dir="rtl">
                {isProfit ? '+' : ''}{formatToman(summary.totalPnlToman)} <span className="text-[9px] opacity-70">تومان</span>
              </div>
            </div>
          </div>

          {prices && (
            <div className="flex flex-col gap-2 py-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span className="text-[10px] text-slate-500 font-bold">طلای ۱۸ (گرم):</span>
                  <span className="text-[10px] text-amber-400 font-black" dir="ltr">{formatToman(prices.gold18ToToman)} ت</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] text-slate-500 font-bold">دلار آزاد:</span>
                  <span className="text-[10px] text-emerald-400 font-black" dir="ltr">{formatToman(prices.usdToToman)} ت</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-between items-center pt-2">
            <div className="flex items-center gap-1.5 text-[9px] text-white/60 font-bold uppercase tracking-widest" dir="ltr">
              <Clock size={10} />
              <span>{new Date(lastUpdated).toLocaleTimeString('fa-IR')} - {new Date(lastUpdated).toLocaleDateString('fa-IR')}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-white/70 font-black">
              <BarChart3 size={10} />
              <span>LIVE DATA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
