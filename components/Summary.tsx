
import React from 'react';
import { WalletIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface SummaryProps {
  balance: number;
  income: number;
  expense: number;
}

const SummaryCard: React.FC<{ title: string; amount: number; icon: React.ReactNode; color: string }> = ({ title, amount, icon, color }) => (
  <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center space-x-4 transform hover:scale-105 transition-transform duration-300">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white">
        ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  </div>
);

const Summary: React.FC<SummaryProps> = ({ balance, income, expense }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SummaryCard 
        title="目前餘額" 
        amount={balance} 
        icon={<WalletIcon />} 
        color="bg-blue-500/20" 
      />
      <SummaryCard 
        title="總收入" 
        amount={income} 
        icon={<ArrowUpIcon />} 
        color="bg-green-500/20" 
      />
      <SummaryCard 
        title="總支出" 
        amount={expense} 
        icon={<ArrowDownIcon />} 
        color="bg-red-500/20" 
      />
    </div>
  );
};

export default Summary;
