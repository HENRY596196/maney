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
  Calendar,
  CalendarDays,
} from "lucide-react";

// Helper: Format Date YYYY-MM-DD
const formatDay = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
};

// Helper: Format Month YYYY-MM
const formatMonth = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// Generate range of days
const getDayRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = [];
  let current = new Date(start);
  while (current <= end) {
    days.push(formatDay(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

// Generate range of months
const getMonthRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
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
  const [viewMode, setViewMode] = useState("total"); // 'total' | 'wallet'
  const [timeScale, setTimeScale] = useState("day"); // 'day' | 'month'
  const [selectedWalletId, setSelectedWalletId] = useState("all");

  // Default wallet selection
  useMemo(() => {
    if (viewMode === "wallet" && selectedWalletId === "all" && accounts.length > 0) {
      setSelectedWalletId(accounts[0].id);
    }
  }, [viewMode, accounts, selectedWalletId]);

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Return a single point for "Today" with initial balance
      const initial = accounts.reduce((sum, acc) => sum + Number(acc.initialBalance), 0);
      return [{
        name: formatDay(new Date()),
        收入: 0,
        支出: 0,
        剩餘金額: initial
      }];
    }

    // 1. Filter Transactions
    let filteredTxs = transactions;
    let initialBalance = 0;

    if (viewMode === "wallet" && selectedWalletId !== "all") {
      filteredTxs = transactions.filter((t) => t.accountId === selectedWalletId);
      const acc = accounts.find((a) => a.id === selectedWalletId);
      initialBalance = acc ? Number(acc.initialBalance) : 0;
    } else {
      initialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initialBalance), 0);
    }

    // 2. Sort Transactions
    const sortedTxs = [...filteredTxs].sort((a, b) => {
      return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
    });

    if (sortedTxs.length === 0) {
       // If selected wallet has no txs, just show initial balance line?
       const today = timeScale === 'month' ? formatMonth(new Date()) : formatDay(new Date());
       return [{
           name: today,
           收入: 0,
           支出: 0,
           剩餘金額: initialBalance
       }];
    }

    // 3. Define Time Range
    // Start from the first transaction date
    const firstDate = sortedTxs[0].createdAt?.toDate() || new Date();
    const lastDate = new Date(); // Up to now

    let timeLabels = [];
    if (timeScale === "day") {
      timeLabels = getDayRange(firstDate, lastDate);
    } else {
      timeLabels = getMonthRange(firstDate, lastDate);
    }

    // 4. Group Data
    // We need to accumulate balance carefully.
    // 'txsByTime' map stores income/expense per slot.
    const txsByTime = {};
    sortedTxs.forEach((t) => {
      const date = t.createdAt?.toDate();
      const key = timeScale === "day" ? formatDay(date) : formatMonth(date);
      
      if (!txsByTime[key]) txsByTime[key] = { income: 0, expense: 0 };
      if (t.type === "income") txsByTime[key].income += Number(t.amount);
      if (t.type === "expense") txsByTime[key].expense += Number(t.amount);
    });

    // 5. Build Chart Data
    const data = [];
    let currentBalance = initialBalance;

    timeLabels.forEach((label) => {
      const stats = txsByTime[label] || { income: 0, expense: 0 };
      currentBalance = currentBalance + stats.income - stats.expense;

      data.push({
        name: label,
        收入: stats.income,
        支出: stats.expense,
        剩餘金額: currentBalance,
      });
    });

    return data;
  }, [transactions, accounts, viewMode, selectedWalletId, timeScale]);

  return (
    <div className="glass-panel p-6 animate-enter">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <PieChartIcon size={20} className="text-primary" />
            統計圖表
          </h3>
          
          <div className="flex bg-black/20 p-1 rounded-lg">
             {/* Time Scale Switch */}
             <button
              onClick={() => setTimeScale("day")}
              className={`px-3 py-1.5 rounded-md text-sm transition-all flex items-center gap-2 ${
                timeScale === "day"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted hover:text-white"
              }`}
              title="每日"
            >
              <CalendarDays size={14} /> 日
            </button>
            <button
              onClick={() => setTimeScale("month")}
              className={`px-3 py-1.5 rounded-md text-sm transition-all flex items-center gap-2 ${
                timeScale === "month"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted hover:text-white"
              }`}
              title="每月"
            >
              <Calendar size={14} /> 月
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-between items-center">
            {/* View Mode Switch */}
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

            {/* Wallet Selector */}
            {viewMode === "wallet" && (
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 min-w-[200px]">
                    <span className="text-sm text-muted whitespace-nowrap">選擇錢包:</span>
                    <select 
                        value={selectedWalletId} 
                        onChange={(e) => setSelectedWalletId(e.target.value)}
                        className="bg-transparent text-white border-none outline-none flex-1 font-bold cursor-pointer text-sm"
                    >
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id} className="text-black">
                                {acc.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
      </div>

      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                minTickGap={30}
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
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    color: '#f8fafc'
                }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Line 
                type="monotone" 
                dataKey="收入" 
                stroke="#34d399" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                animationDuration={500}
            />
            <Line 
                type="monotone" 
                dataKey="支出" 
                stroke="#f87171" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                animationDuration={500}
            />
            <Line 
                type="monotone" 
                dataKey="剩餘金額" 
                stroke="#60a5fa" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceCharts;
