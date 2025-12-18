
import React, { useEffect, useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { BottomNav } from './components/BottomNav';
import { SummaryCard } from './components/SummaryCard';
import { AssetRow } from './components/AssetRow';
import { TransactionModal } from './components/TransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginPage } from './components/LoginPage';
import { Transaction, PriceData, PortfolioSummary, ASSET_DETAILS, AssetSummary } from './types';
import * as Storage from './services/storage';
import * as PriceService from './services/priceService';
import * as AuthService from './services/authService';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, LogOut, Shield, Settings, Sparkles, ExternalLink } from 'lucide-react';
import { formatToman, formatNumber, formatPercent } from './utils/formatting';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isAuthenticated());
  const [tab, setTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // بارگذاری داده‌ها در هنگام ورود
  useEffect(() => {
    if (isLoggedIn) {
      setTransactions(Storage.getTransactions());
      const loadInitialPrices = async () => {
        const p = await PriceService.fetchPrices();
        setPrices(p);
      };
      loadInitialPrices();
    }
  }, [isLoggedIn]);

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    // در اینجا هم قیمت‌های ذخیره شده را می‌گیریم
    const data = await PriceService.fetchPrices();
    setPrices(data);
    setIsRefreshing(false);
  };

  const handleAiUpdate = async () => {
    setIsAiLoading(true);
    const result = await PriceService.fetchLivePricesWithAI();
    setPrices(result.data);
    setSources(result.sources);
    setIsAiLoading(false);
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsLoggedIn(false);
  };

  const handleSaveTransaction = (t: Transaction) => {
    let updated;
    if (t.id) {
      updated = Storage.updateTransaction(t);
    } else {
      const newTx = { ...t, id: Math.random().toString(36).substr(2, 9) };
      updated = Storage.saveTransaction(newTx as Transaction);
    }
    setTransactions(updated);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = Storage.deleteTransaction(id);
    setTransactions(updated);
  };

  const portfolioSummary: PortfolioSummary = useMemo(() => {
    if (!prices || transactions.length === 0) return {
      totalValueToman: 0, totalCostBasisToman: 0, totalPnlToman: 0, totalPnlPercent: 0, assets: []
    };

    const currentPriceMap: Record<string, number> = {
      USD: prices.usdToToman,
      EUR: prices.eurToToman,
      GOLD18: prices.gold18ToToman,
    };
    
    Object.entries(prices.cryptoUsdPrices).forEach(([symbol, usdPrice]) => {
      currentPriceMap[symbol] = usdPrice * prices.usdToToman;
    });

    const assetsMap: Record<string, AssetSummary> = {};

    transactions.forEach(tx => {
      const { assetSymbol, quantity, buyPricePerUnit, buyCurrency, feesToman } = tx;
      if (!assetsMap[assetSymbol]) {
        assetsMap[assetSymbol] = {
          symbol: assetSymbol,
          name: ASSET_DETAILS[assetSymbol].name,
          type: ASSET_DETAILS[assetSymbol].type,
          totalQuantity: 0,
          currentPriceToman: currentPriceMap[assetSymbol] || 0,
          currentValueToman: 0, costBasisToman: 0, pnlToman: 0, pnlPercent: 0, allocationPercent: 0,
        };
      }
      const asset = assetsMap[assetSymbol];
      asset.totalQuantity += quantity;
      
      // هزینه خرید دقیق بر اساس واحد پولی که ثبت شده
      let txCostToman = 0;
      if (buyCurrency === 'TOMAN') {
        txCostToman = (quantity * buyPricePerUnit) + feesToman;
      } else {
        // اگر خرید با دلار بوده، از قیمت دلاری که در آن تراکنش ثبت شده استفاده می‌شود
        // (فعلاً فرض بر این است که قیمت خرید در تراکنش ثبت شده است)
        txCostToman = (quantity * buyPricePerUnit * (prices.usdToToman)) + feesToman;
      }
      asset.costBasisToman += txCostToman;
    });

    let runningTotalValue = 0;
    let runningTotalCost = 0;

    const assets = Object.values(assetsMap).map(asset => {
      asset.currentValueToman = asset.totalQuantity * asset.currentPriceToman;
      asset.pnlToman = asset.currentValueToman - asset.costBasisToman;
      asset.pnlPercent = asset.costBasisToman > 0 ? (asset.pnlToman / asset.costBasisToman) * 100 : 0;
      runningTotalValue += asset.currentValueToman;
      runningTotalCost += asset.costBasisToman;
      return asset;
    });

    assets.forEach(a => { a.allocationPercent = runningTotalValue > 0 ? (a.currentValueToman / runningTotalValue) * 100 : 0; });
    const totalPnl = runningTotalValue - runningTotalCost;
    const totalPnlPct = runningTotalCost > 0 ? (totalPnl / runningTotalCost) * 100 : 0;

    return {
      totalValueToman: runningTotalValue,
      totalCostBasisToman: runningTotalCost,
      totalPnlToman: totalPnl,
      totalPnlPercent: totalPnlPct,
      assets: assets.sort((a, b) => b.currentValueToman - a.currentValueToman)
    };
  }, [transactions, prices]);

  if (!isLoggedIn) return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;

  const filteredAssets = portfolioSummary.assets.filter(a => a.name.includes(searchQuery) || a.symbol.includes(searchQuery.toUpperCase()));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  const renderOverview = () => {
    const bestAsset = [...portfolioSummary.assets].sort((a, b) => b.pnlPercent - a.pnlPercent)[0];
    const worstAsset = [...portfolioSummary.assets].sort((a, b) => a.pnlPercent - b.pnlPercent)[0];

    return (
      <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
        <div className="flex justify-between items-center mb-2 px-1">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                 <Shield size={16} className="text-white" />
              </div>
              <span className="font-black text-gray-900 text-lg tracking-tight">پنل مدیریت</span>
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={handleAiUpdate} 
                disabled={isAiLoading} 
                className={`flex items-center gap-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white text-[10px] font-black px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all hover:brightness-110 ${isAiLoading ? 'animate-pulse opacity-70' : ''}`}
              >
                 <Sparkles size={14} />
                 <span>بروزرسانی هوشمند</span>
              </button>
           </div>
        </div>

        <SummaryCard 
          summary={portfolioSummary} 
          isRefreshing={isRefreshing} 
          lastUpdated={prices?.fetchedAt || Date.now()}
          onRefresh={handleRefreshPrices}
          prices={prices}
        />

        {sources.length > 0 && (
          <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 flex flex-col gap-2 mx-1">
            <div className="flex items-center gap-2 mb-1">
               <ExternalLink size={12} className="text-blue-500" />
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">منابع معتبر قیمت گذاری:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="bg-white px-3 py-2 rounded-xl border border-blue-100 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-colors shadow-sm">
                  {s.title.length > 30 ? s.title.slice(0, 30) + '...' : s.title}
                </a>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider mb-1">
                  <ArrowUpRight size={14} />
                  <span>بهترین عملکرد</span>
                </div>
                {bestAsset ? (
                   <div className="mt-2">
                      <div className="font-black text-gray-900 text-sm truncate">{bestAsset.name}</div>
                      <div className="text-emerald-500 text-xs font-black mt-1" dir="ltr">{formatPercent(bestAsset.pnlPercent)}</div>
                   </div>
                ) : <div className="text-gray-300 text-xs mt-2 font-bold">دیتا موجود نیست</div>}
              </div>
           </div>
           <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-wider mb-1">
                  <ArrowDownRight size={14} />
                  <span>ضعیف‌ترین عملکرد</span>
                </div>
                 {worstAsset ? (
                   <div className="mt-2">
                      <div className="font-black text-gray-900 text-sm truncate">{worstAsset.name}</div>
                      <div className={`text-xs font-black mt-1 ${worstAsset.pnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} dir="ltr">{formatPercent(worstAsset.pnlPercent)}</div>
                   </div>
                ) : <div className="text-gray-300 text-xs mt-2 font-bold">دیتا موجود نیست</div>}
              </div>
           </div>
        </div>

        {portfolioSummary.assets.length > 0 && (
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden">
            <h3 className="text-xs font-black text-gray-400 mb-6 uppercase tracking-[2px] pr-3 border-r-4 border-blue-600">توزیع سبد دارایی</h3>
            <div className="flex items-center">
              <div className="h-44 w-44 shrink-0">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={portfolioSummary.assets as any[]} dataKey="currentValueToman" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={6} stroke="none">
                       {portfolioSummary.assets.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontFamily: 'Vazirmatn' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3 pr-6">
                 {portfolioSummary.assets.slice(0, 4).map((asset, idx) => (
                   <div key={asset.symbol} className="flex items-center justify-between text-[11px]">
                     <div className="flex items-center gap-2 truncate">
                       <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                       <span className="text-gray-600 font-bold truncate">{asset.name}</span>
                     </div>
                     <span className="font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md">{Math.round(asset.allocationPercent)}%</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHoldings = () => (
    <div className="animate-in fade-in duration-300 pb-20">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-4 py-4 shadow-sm border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input type="text" placeholder="جستجو در دارایی‌ها..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-100 rounded-2xl py-3 pr-10 pl-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border-none" />
        </div>
      </div>
      <div>
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300">
             <Filter size={64} strokeWidth={1} className="mb-4 opacity-10" />
             <p className="text-sm font-black">دارایی یافت نشد</p>
          </div>
        ) : (
          filteredAssets.map(asset => (
            <AssetRow key={asset.symbol} asset={asset} onClick={() => { setTab('transactions'); setSearchQuery(asset.symbol); }} />
          ))
        )}
      </div>
    </div>
  );

  const renderTransactions = () => {
    const filteredTx = transactions.filter(tx => tx.assetSymbol.includes(searchQuery.toUpperCase()) || ASSET_DETAILS[tx.assetSymbol].name.includes(searchQuery));
    return (
      <div className="p-4 pb-24 animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-xl font-black text-gray-900">تاریخچه تراکنش‌ها</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSettingsModalOpen(true)} className="p-2.5 bg-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors">
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="p-2.5 bg-rose-50 rounded-xl text-rose-500 hover:text-rose-600 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        {filteredTx.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
              <Plus size={48} strokeWidth={1} className="mb-3 opacity-20" />
              <p className="text-sm font-black">تراکنشی یافت نشد</p>
           </div>
        ) : (
          <div className="space-y-3">
            {[...filteredTx].reverse().map(tx => (
              <div key={tx.id} onClick={() => { setEditingTransaction(tx); setIsTxModalOpen(true); }} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center active:scale-98 transition-all cursor-pointer hover:border-blue-300 group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${ASSET_DETAILS[tx.assetSymbol].type === 'CRYPTO' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                     <span className="font-black text-xs uppercase">{tx.assetSymbol.slice(0, 3)}</span>
                  </div>
                  <div>
                    <div className="font-black text-sm text-gray-900">{ASSET_DETAILS[tx.assetSymbol].name}</div>
                    <div className="text-[10px] font-bold text-gray-400 mt-1" dir="ltr">{new Date(tx.buyDateTime).toLocaleDateString('fa-IR')}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-black text-sm text-gray-900" dir="ltr">+{formatNumber(tx.quantity)} <span className="text-[10px] text-gray-400">{tx.assetSymbol}</span></div>
                  <div className="text-[11px] text-gray-500 mt-1 font-black" dir="ltr">@ {formatNumber(tx.buyPricePerUnit)} {tx.buyCurrency === 'USD' ? '$' : 'T'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      {tab === 'overview' && renderOverview()}
      {tab === 'holdings' && renderHoldings()}
      {tab === 'transactions' && renderTransactions()}
      <BottomNav currentTab={tab} onTabChange={setTab} />
      <button onClick={() => { setEditingTransaction(null); setIsTxModalOpen(true); }} className="fixed bottom-24 left-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] p-5 shadow-2xl shadow-blue-600/40 transition-all active:scale-90 hover:scale-110 z-50">
        <Plus size={28} strokeWidth={3} />
      </button>
      <TransactionModal isOpen={isTxModalOpen} initialData={editingTransaction} onClose={() => setIsTxModalOpen(false)} onSave={handleSaveTransaction} onDelete={handleDeleteTransaction} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </Layout>
  );
}
