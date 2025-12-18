
import React from 'react';
import { AssetSummary, ASSET_DETAILS } from '../types';
import { formatToman, formatPercent, formatNumber, getAssetIconUrl } from '../utils/formatting';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AssetRowProps {
  asset: AssetSummary;
  onClick: () => void;
}

export const AssetRow: React.FC<AssetRowProps> = ({ asset, onClick }) => {
  const isProfit = asset.pnlToman >= 0;
  const iconUrl = getAssetIconUrl(asset.symbol);

  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 flex items-center justify-between border-b border-gray-50 active:bg-gray-50 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 p-1.5 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:scale-110 transition-transform">
          {iconUrl ? (
            <img src={iconUrl} alt={asset.symbol} className="w-full h-full object-contain" />
          ) : (
             <span className="text-sm font-black text-gray-400">{asset.symbol.slice(0, 2)}</span>
          )}
        </div>
        <div>
          <div className="font-black text-gray-900 text-sm flex items-center gap-1.5">
            {ASSET_DETAILS[asset.symbol].name}
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-bold">{asset.symbol}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1 font-bold flex items-center gap-1" dir="ltr">
            <span>{formatNumber(asset.totalQuantity, 3)}</span>
            <span className="opacity-60">{asset.type === 'GOLD' ? 'گرم' : asset.symbol}</span>
          </div>
          {/* نمایش قیمت لحظه‌ای واحد */}
          <div className="text-[10px] text-blue-600 mt-1 font-black flex items-center gap-1">
             <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
             <span>قیمت واحد:</span>
             <span dir="ltr">{formatToman(asset.currentPriceToman)} ت</span>
          </div>
        </div>
      </div>

      <div className="text-left flex flex-col items-end">
        <div className="font-black text-gray-900 text-sm">{formatToman(asset.currentValueToman)} ت</div>
        <div className={`text-[10px] flex items-center gap-1 mt-1.5 font-black px-2 py-1 rounded-lg ${isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`} dir="ltr">
          {isProfit ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span>{formatPercent(asset.pnlPercent)}</span>
        </div>
        <div className="text-[9px] text-gray-400 mt-1 font-bold" dir="ltr">
           سود/ضرر: {formatToman(asset.pnlToman)} ت
        </div>
      </div>
    </div>
  );
};
