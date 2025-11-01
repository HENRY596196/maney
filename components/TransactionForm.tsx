
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { PlusIcon } from './icons';

interface TransactionFormProps {
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

const incomeCategories = ['薪水', '獎金', '投資', '副業', '其他'];
const expenseCategories = ['餐飲', '交通', '購物', '娛樂', '居家', '醫療', '教育', '其他'];

const TransactionForm: React.FC<TransactionFormProps> = ({ addTransaction }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(expenseCategories[0]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === TransactionType.INCOME ? incomeCategories[0] : expenseCategories[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('請輸入有效的金額');
      return;
    }

    addTransaction({
      type,
      amount: parsedAmount,
      category,
      date,
      description,
    });
    
    // Reset form
    setAmount('');
    setDescription('');
    setCategory(type === TransactionType.INCOME ? incomeCategories[0] : expenseCategories[0]);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const categories = type === TransactionType.INCOME ? incomeCategories : expenseCategories;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-700 p-1">
        <button
          type="button"
          onClick={() => handleTypeChange(TransactionType.EXPENSE)}
          className={`w-full p-2 rounded-md text-sm font-medium transition ${type === TransactionType.EXPENSE ? 'bg-red-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange(TransactionType.INCOME)}
          className={`w-full p-2 rounded-md text-sm font-medium transition ${type === TransactionType.INCOME ? 'bg-green-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
        >
          收入
        </button>
      </div>
      
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">金額</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">類別</label>
        <select
          id="category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">日期</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">描述 (選填)</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="例如：晚餐"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button type="submit" className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300">
        <PlusIcon />
        <span className="ml-2">新增紀錄</span>
      </button>
    </form>
  );
};

export default TransactionForm;
