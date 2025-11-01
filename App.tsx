
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, TransactionType } from './types';
import Summary from './components/Summary';
import CategoryChart from './components/CategoryChart';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const savedTransactions = localStorage.getItem('transactions');
      return savedTransactions ? JSON.parse(savedTransactions) : [];
    } catch (error) {
      console.error('Failed to parse transactions from localStorage', error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === TransactionType.INCOME) {
          acc.totalIncome += t.amount;
        } else {
          acc.totalExpense += t.amount;
        }
        acc.balance = acc.totalIncome - acc.totalExpense;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
            智慧記帳本
          </h1>
          <p className="text-center text-slate-400 mt-2">輕鬆掌握您的財務狀況</p>
        </header>

        <main>
          <Summary balance={balance} income={totalIncome} expense={totalExpense} />
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-white">新增交易</h2>
                <TransactionForm addTransaction={addTransaction} />
              </div>
              <div className="mt-8 bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-white">支出分類</h2>
                <CategoryChart transactions={transactions} />
              </div>
            </div>

            <div className="lg:col-span-3 bg-slate-800 p-6 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-white">交易紀錄</h2>
              <TransactionList transactions={transactions} deleteTransaction={deleteTransaction} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
