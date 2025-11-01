
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { TrashIcon } from './icons';

interface TransactionListProps {
  transactions: Transaction[];
  deleteTransaction: (id: string) => void;
}

const TransactionItem: React.FC<{ transaction: Transaction; onDelete: () => void }> = ({ transaction, onDelete }) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const amountColor = isIncome ? 'text-green-400' : 'text-red-400';
  const borderColor = isIncome ? 'border-green-500' : 'border-red-500';
  const amountPrefix = isIncome ? '+' : '-';

  return (
    <li className={`bg-slate-800/50 p-4 rounded-lg flex items-center justify-between border-l-4 ${borderColor} transition-all duration-300 hover:bg-slate-700/50`}>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold text-white truncate">{transaction.description || transaction.category}</p>
        <p className="text-sm text-slate-400">{transaction.category} • {transaction.date}</p>
      </div>
      <div className="flex items-center space-x-4 ml-4">
        <p className={`font-bold text-lg ${amountColor}`}>
          {amountPrefix}${transaction.amount.toFixed(2)}
        </p>
        <button onClick={onDelete} className="text-slate-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10">
          <TrashIcon />
        </button>
      </div>
    </li>
  );
};


const TransactionList: React.FC<TransactionListProps> = ({ transactions, deleteTransaction }) => {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>目前沒有交易紀錄</p>
        <p className="text-sm">試著新增一筆支出或收入吧！</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
      {transactions.map(t => (
        <TransactionItem key={t.id} transaction={t} onDelete={() => deleteTransaction(t.id)} />
      ))}
    </ul>
  );
};

export default TransactionList;
