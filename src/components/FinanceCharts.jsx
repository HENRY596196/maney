import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  PieChart as PieChartIcon,
  ArrowRightLeft,
} from "lucide-react";

// Helper to format date to YYYY-MM
const formatMonth = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// Helper to generate all months between start and end
const getMonthRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Set to first day of month to avoid edge cases
  start.setDate(1);
  end.setDate(1);
  
  const months = [];
  let current = new Date(start);

  while (current <= end) {
    months.push(formatMonth(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
};

const FinanceCharts = ({ transactions, accounts }) => {
  const [viewMode, setViewMode] = useState("total"); // 'total' or 'wallet'
  const [selectedWalletId, setSelectedWalletId] = useState("all");

  // Determine which account to show
  // If viewMode is 'wallet', ensure a wallet is selected (default to first)
  useMemo(() => {
    if (viewMode === "wallet" && selectedWalletId === "all" && accounts.length > 0) {
      setSelectedWalletId(accounts[0].id);
    }
  }, [viewMode, accounts, selectedWalletId]);

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Filter transactions based on selection
    let filteredTxs = transactions;
    let initialBalance = 0;

    if (viewMode === "wallet" && selectedWalletId !== "all") {
      filteredTxs = transactions.filter((t) => t.accountId === selectedWalletId);
      const acc = accounts.find((a) => a.id === selectedWalletId);
      initialBalance = acc ? Number(acc.initialBalance) : 0;
    } else {
      // Total Mode
      initialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initialBalance), 0);
    }

    // Sort by date asc
    const sortedTxs = [...filteredTxs].sort((a, b) => {
      return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
    });

    if (sortedTxs.length === 0) {
        // Even if no txs, we might want to show the initial balance line? 
        // But for now let's return [] or handle single point.
        // Let's create a single point for "Now" if empty but we have balance?
        // User asked for monthly stats. If no txs, maybe just show current month?
        const now = formatMonth(new Date());
        return [{
            name: now,
            收入: 0,
            支出: 0,
            剩餘金額: initialBalance
        }];
    }

    // Get Date Range
    const firstDate = sortedTxs[0].createdAt?.toDate() || new Date();
    const lastDate = new Date(); // Go up to today
    
    // Generate all months
    const allMonths = getMonthRange(firstDate, lastDate);

    // Group TXs by month
    const txsByMonth = {};
    sortedTxs.forEach(t => {
      const m = formatMonth(t.createdAt?.toDate());
      if (!txsByMonth[m]) txsByMonth[m] = { income: 0, expense: 0 };
      if (t.type === 'income') txsByMonth[m].income += Number(t.amount);
      if (t.type === 'expense') txsByMonth[m].expense += Number(t.amount);
    });

    // Build Data Points preserving running balance
    const data = [];
    let currentBalance = initialBalance;

    // We need to calculate balance BEFORE the first month in the range? 
    // No, initialBalance is the *starting* state before any recorded transaction (assuming usage).
    // Actually, `initialBalance` is a static property of Account. 
    // If we have transactions from the past, we assume initialBalance was the balance *before* those transactions? 
    // OR is initialBalance the "Set balance" at creation?
    // Usually "Initial Balance" in these apps signifies "Balance when I started using the app".
    // So `currentBalance` starts at `initialBalance`.
    
    allMonths.forEach(month => {
      const monthStats = txsByMonth[month] || { income: 0, expense: 0 };
      
      // Update balance
      // Logic: Balance at end of month = PrevBalance + Income - Expense
      currentBalance = currentBalance + monthStats.income - monthStats.expense;

      data.push({
        name: month,
        收入: monthStats.income,
        支出: monthStats.expense,
        剩餘金額: currentBalance,
      });
    });

    return data;

  }, [transactions, accounts, viewMode, selectedWalletId]);

  return (
    <div className="glass-panel p-6 animate-enter">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <PieChartIcon size={20} className="text-primary" />
          統計圖表
        </h3>
        
        <div className="flex bg-black/20 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("total")}
            className={`px-4 py-2 rounded-md text-sm transition-all flex items-center gap-2 ${
              viewMode === "total"
                ? "bg-primary text-white shadow-lg"
                : "text-muted hover:text-white"
            }`}
          >
            <ArrowRightLeft size={16} /> 總覽
          </button>
          <button
            onClick={() => setViewMode("wallet")}
            className={`px-4 py-2 rounded-md text-sm transition-all flex items-center gap-2 ${
              viewMode === "wallet"
                ? "bg-primary text-white shadow-lg"
                : "text-muted hover:text-white"
            }`}
          >
            <Wallet size={16} /> 個別錢包
          </button>
        </div>
      </div>

      {viewMode === "wallet" && (
        <div className="mb-6 flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-sm text-muted">選擇錢包:</span>
            <select 
                value={selectedWalletId} 
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="bg-transparent text-white border-none outline-none flex-1 font-bold cursor-pointer"
            >
                {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} className="text-black">
                        {acc.name}
                    </option>
                ))}
            </select>
        </div>
      )}

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
            />
            <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                }}
            />
            <Legend />
            <Line 
                type="monotone" 
                dataKey="收入" 
                stroke="#34d399" 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
            />
            <Line 
                type="monotone" 
                dataKey="支出" 
                stroke="#f87171" 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
            />
            <Line 
                type="monotone" 
                dataKey="剩餘金額" 
                stroke="#60a5fa" 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceCharts;
