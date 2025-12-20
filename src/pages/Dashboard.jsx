import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Plus,
  LogOut,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
  Coffee,
  Home,
  Bus,
  Gamepad2,
  MoreHorizontal,
  Wallet,
  HandCoins,
  GraduationCap,
  Wifi,
  Shield,
  Utensils,
  Cookie,
  ShoppingBag,
  Shirt,
  Zap,
  CupSoda,
  Droplets,
  Settings,
  X,
  CreditCard,
  Banknote,
  Landmark,
} from "lucide-react";
import { writeBatch, getDocs } from "firebase/firestore";
import FinanceCharts from "../components/FinanceCharts";

const ICON_MAP = {
  Wallet,
  HandCoins,
  GraduationCap,
  Wifi,
  Shield,
  Utensils,
  Coffee,
  Gamepad2,
  Cookie,
  ShoppingBag,
  Shirt,
  Zap,
  CupSoda,
  Droplets,
  Home,
  Bus,
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Landmark,
};

const DEFAULT_INCOME = [
  { name: "生活費", icon: "Wallet" },
  { name: "別人還錢費", icon: "HandCoins" },
  { name: "獎學金", icon: "GraduationCap" },
];

const DEFAULT_EXPENSE = [
  { name: "手機網路費", icon: "Wifi" },
  { name: "平板保險費", icon: "Shield" },
  { name: "早餐", icon: "Coffee" },
  { name: "午餐", icon: "Utensils" },
  { name: "早午餐", icon: "Utensils" },
  { name: "晚餐", icon: "Utensils" },
  { name: "娛樂", icon: "Gamepad2" },
  { name: "零食", icon: "Cookie" },
  { name: "生活所需", icon: "ShoppingBag" },
  { name: "衣服", icon: "Shirt" },
  { name: "寢室電費", icon: "Zap" },
  { name: "飲料", icon: "CupSoda" },
  { name: "水費", icon: "Droplets" },
];

const DEFAULT_ACCOUNTS = [
  { name: "現金", icon: "Banknote", initialBalance: 0 },
  { name: "信用卡", icon: "CreditCard", initialBalance: 0 },
  { name: "悠遊卡", icon: "CreditCard", initialBalance: 0 },
];

const INCOME_CATEGORIES = []; // Removing this as we use dynamic now

const Dashboard = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Form State
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState("");

  // UI State
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingCats, setIsManagingCats] = useState(false);
  const [isManagingAccs, setIsManagingAccs] = useState(false);

  const [newCatName, setNewCatName] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccBalance, setNewAccBalance] = useState("");

  const [loading, setLoading] = useState(true);

  // Stats
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [error, setError] = useState(null);

  // Fetch Categories & Seed if empty
  useEffect(() => {
    if (!user) return;
    const fetchAndSeed = async () => {
      const q = query(
        collection(db, "categories"),
        where("uid", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Seed defaults
        const batch = writeBatch(db);
        [...DEFAULT_INCOME].forEach((c) => {
          const ref = doc(collection(db, "categories"));
          batch.set(ref, {
            ...c,
            type: "income",
            uid: user.uid,
            createdAt: serverTimestamp(),
          });
        });
        [...DEFAULT_EXPENSE].forEach((c) => {
          const ref = doc(collection(db, "categories"));
          batch.set(ref, {
            ...c,
            type: "expense",
            uid: user.uid,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      // Listen
      const unsubscribe = onSnapshot(
        query(
          collection(db, "categories"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "asc")
        ),
        (snap) => {
          const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCategories(cats);
        }
      );
      return unsubscribe;
    };

    fetchAndSeed();
  }, [user]);

  // Fetch Accounts & Seed
  useEffect(() => {
    if (!user) return;
    const fetchAccounts = async () => {
      const q = query(
        collection(db, "accounts"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "asc")
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const batch = writeBatch(db);
        DEFAULT_ACCOUNTS.forEach((acc) => {
          const ref = doc(collection(db, "accounts"));
          batch.set(ref, {
            ...acc,
            uid: user.uid,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      const unsubscribe = onSnapshot(q, (snap) => {
        const accs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAccounts(accs);
        // Set default account if not set
        if (accs.length > 0 && !accountId) {
          setAccountId(accs[0].id);
        }
      });
      return unsubscribe;
    };
    fetchAccounts();
  }, [user]);

  // Set default category
  useEffect(() => {
    const currentCats = categories.filter((c) => c.type === type);
    if (currentCats.length > 0 && !currentCats.find((c) => c.id === category)) {
      setCategory(currentCats[0].id);
    }
  }, [type, categories]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "expenses"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactions(data);

        const inc = data
          .filter((t) => t.type === "income")
          .reduce((acc, curr) => acc + Number(curr.amount), 0);
        const exp = data
          .filter((t) => t.type === "expense")
          .reduce((acc, curr) => acc + Number(curr.amount), 0);
        setIncome(inc);
        setExpense(exp);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching data: ", err);
        setError("無法連線至伺服器，請檢查您的網路連線。");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    try {
      await addDoc(collection(db, "expenses"), {
        uid: user.uid,
        amount: Number(amount),
        description,
        type,
        category,
        accountId: accountId || "uncategorized_account",
        createdAt: serverTimestamp(),
      });
      setAmount("");
      setDescription("");
      setIsAdding(false);
    } catch (error) {
      console.error(error);
      alert("新增失敗");
    }
  };

  // Delete category logic: Move records to 'uncategorized'
  const handleDeleteCategory = async (catId) => {
    if (
      !window.confirm("確定要刪除此分類嗎？相關的記帳紀錄將會變為「未分類」。")
    )
      return;

    try {
      const batch = writeBatch(db);

      // 1. Find all transactions with this category
      const q = query(
        collection(db, "expenses"),
        where("uid", "==", user.uid),
        where("category", "==", catId)
      );
      const snapshot = await getDocs(q);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { category: "uncategorized" });
      });

      // 2. Delete the category itself
      batch.delete(doc(db, "categories", catId));

      await batch.commit();
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("刪除失敗");
    }
  };

  const handleAddCustomCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await addDoc(collection(db, "categories"), {
      uid: user.uid,
      name: newCatName,
      type: type,
      icon: "MoreHorizontal", // Default icon
      createdAt: serverTimestamp(),
    });
    setNewCatName("");
  };

  const handleDelete = async (id) => {
    if (window.confirm("確定要刪除這筆紀錄嗎？")) {
      await deleteDoc(doc(db, "expenses", id));
    }
  };

  // Manage Accounts Logic
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    await addDoc(collection(db, "accounts"), {
      uid: user.uid,
      name: newAccName,
      icon: "CreditCard",
      initialBalance: Number(newAccBalance) || 0,
      createdAt: serverTimestamp(),
    });
    setNewAccName("");
    setNewAccBalance("");
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("確定刪除此帳戶？相關記帳將保留但歸為「未指定帳戶」。"))
      return;
    await deleteDoc(doc(db, "accounts", id));
  };

  // Calculate Account Balances
  const getAccountBalance = (acc) => {
    const accIncome = transactions
      .filter((t) => t.accountId === acc.id && t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const accExpense = transactions
      .filter((t) => t.accountId === acc.id && t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return (acc.initialBalance || 0) + accIncome - accExpense;
  };

  // Calculate Totals including Initial Balances
  const accountsInitialIncome = accounts.reduce(
    (sum, acc) =>
      acc.initialBalance > 0 ? sum + Number(acc.initialBalance) : sum,
    0
  );
  const accountsInitialExpense = accounts.reduce(
    (sum, acc) =>
      acc.initialBalance < 0 ? sum + Math.abs(Number(acc.initialBalance)) : sum,
    0
  );

  const totalIncome = income + accountsInitialIncome;
  const totalExpense = expense + accountsInitialExpense;
  const totalBalance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen pb-20">
      <nav className="navbar">
        <div className="nav-content">
          <div className="user-info">
            {user.photoURL && (
              <img src={user.photoURL} alt="Avatar" className="avatar" />
            )}
            <div>
              <h2 className="font-bold text-lg">
                早安，{user.displayName || "使用者"}
              </h2>
              <p className="text-sm text-muted">開始記帳吧！</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="btn-icon"
            title="登出"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <div className="container animate-enter">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3">
            <div className="bg-red-500 rounded-full p-1">
              <X size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold">連線錯誤</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}
        {/* Stats */}
        <div className="stats-grid">
          <div className="glass-panel">
            <p className="text-muted text-sm mb-1 flex items-center gap-sm">
              <DollarSign size={14} /> 總餘額
            </p>
            <h3 className="text-2xl font-bold">
              NT$ {totalBalance.toLocaleString()}
            </h3>
          </div>
          <div className="glass-panel">
            <p className="text-success text-sm mb-1 flex items-center gap-sm">
              <TrendingUp size={14} /> 本月收入
            </p>
            <h3 className="text-2xl font-bold text-success">
              +{totalIncome.toLocaleString()}
            </h3>
          </div>
          <div className="glass-panel">
            <p className="text-danger text-sm mb-1 flex items-center gap-sm">
              <TrendingDown size={14} /> 本月支出
            </p>
            <h3 className="text-2xl font-bold text-danger">
              -{totalExpense.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="mb-lg">
          <FinanceCharts transactions={transactions} accounts={accounts} />
        </div>

        {/* Accounts Grid (New) */}
        <div className="mb-lg">
          <div className="flex justify-between items-center mb-sm">
            <h3 className="text-lg font-bold">我的錢包</h3>
            <button
              onClick={() => setIsManagingAccs(!isManagingAccs)}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              <Settings size={12} /> 管理帳戶
            </button>
          </div>

          {/* Manage Accounts Panel */}
          {isManagingAccs && (
            <div className="glass-panel p-4 mb-4 bg-black/20">
              <div className="flex gap-2 mb-4 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted mb-1 block">
                    帳戶名稱
                  </label>
                  <input
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder="例如: LinePay"
                    className="input-field text-sm py-2"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-muted mb-1 block">
                    初始金額
                  </label>
                  <input
                    type="number"
                    value={newAccBalance}
                    onChange={(e) => setNewAccBalance(e.target.value)}
                    placeholder="0"
                    className="input-field text-sm py-2"
                  />
                </div>
                <button
                  onClick={handleAddAccount}
                  className="btn btn-primary py-2 px-4 text-sm h-[38px]"
                >
                  新增
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
            {accounts.map((acc) => (
              <div key={acc.id} className="glass-panel p-4 relative group">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Banknote size={16} className="text-blue-300" />
                  </div>
                  {isManagingAccs && (
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted mb-1">{acc.name}</p>
                <p className="font-bold text-lg">
                  NT$ {getAccountBalance(acc).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-lg">
          <h3 className="text-xl font-bold">近期紀錄</h3>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="btn btn-primary"
          >
            <Plus size={18} /> 新增
          </button>
        </div>

        {/* Add Form */}
        {isAdding && (
          <form
            onSubmit={handleAddTransaction}
            className="glass-panel mb-lg animate-enter"
          >
            <div className="flex flex-col gap-md mb-md">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label className="text-sm text-muted mb-sm block">類型</label>
                  <div
                    className="flex gap-sm bg-black/20 p-1 rounded-lg"
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      padding: "4px",
                      borderRadius: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setType("expense")}
                      className={`w-full py-2 rounded-md text-sm transition-all ${
                        type === "expense"
                          ? "bg-danger/20 text-danger"
                          : "text-muted"
                      }`}
                      style={
                        type === "expense"
                          ? {
                              background: "rgba(248,113,113,0.2)",
                              color: "#f87171",
                            }
                          : {}
                      }
                    >
                      支出
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("income")}
                      className={`w-full py-2 rounded-md text-sm transition-all ${
                        type === "income"
                          ? "bg-success/20 text-success"
                          : "text-muted"
                      }`}
                      style={
                        type === "income"
                          ? {
                              background: "rgba(52,211,153,0.2)",
                              color: "#34d399",
                            }
                          : {}
                      }
                    >
                      收入
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted mb-sm block">帳戶</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="input-field"
                    style={{ height: "42px" }} // Match buttons roughly
                  >
                    {accounts.map((acc) => (
                      <option
                        key={acc.id}
                        value={acc.id}
                        className="text-black"
                      >
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-sm block">金額</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="mb-md">
              <div className="flex justify-between items-center mb-sm">
                <label className="text-sm text-muted block">分類</label>
                <button
                  type="button"
                  onClick={() => setIsManagingCats(!isManagingCats)}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <Settings size={12} />{" "}
                  {isManagingCats ? "完成編輯" : "編輯分類"}
                </button>
              </div>

              {isManagingCats ? (
                <div className="glass-panel border-white/10 p-4 mb-2 bg-black/20">
                  <div className="flex gap-2 mb-4">
                    <input
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="新分類名稱..."
                      className="input-field text-sm py-2"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      className="btn btn-primary py-2 px-4 text-sm whitespace-nowrap"
                    >
                      新增
                    </button>
                  </div>
                  <div className="categories-scroll">
                    {categories
                      .filter((c) => c.type === type)
                      .map((cat) => (
                        <div
                          key={cat.id}
                          className="category-pill relative pr-8 justify-between"
                        >
                          <span className="text-sm">{cat.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="categories-scroll">
                  {categories
                    .filter((c) => c.type === type)
                    .map((cat) => {
                      const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`category-pill ${
                            category === cat.id ? "active" : ""
                          }`}
                        >
                          <Icon size={16} />
                          {cat.name}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="mb-md">
              <label className="text-sm text-muted mb-sm block">備註</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                placeholder="早餐、薪水..."
                required
              />
            </div>

            <div className="flex justify-center gap-md">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn"
                style={{ background: "transparent", border: "none" }}
              >
                取消
              </button>
              <button type="submit" className="btn btn-primary">
                確認新增
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="flex flex-col gap-sm">
          {loading ? (
            <div className="text-center py-10 text-muted">載入中...</div>
          ) : transactions.length === 0 ? (
            <div
              className="glass-panel text-center text-muted"
              style={{ padding: "3rem" }}
            >
              <p>還沒有紀錄，新增一筆吧！</p>
            </div>
          ) : (
            transactions.map((t) => {
              const isExpense = t.type === "expense";
              let catName = "未分類";
              let CatIcon = MoreHorizontal;

              // Account Name Lookup
              const accountName =
                accounts.find((a) => a.id === t.accountId)?.name || "現金";

              if (t.category === "uncategorized") {
                catName = "未分類";
                CatIcon = MoreHorizontal;
              } else {
                const foundCat = categories.find((c) => c.id === t.category);
                if (foundCat) {
                  catName = foundCat.name;
                  CatIcon = ICON_MAP[foundCat.icon] || MoreHorizontal;
                }
              }
              // Fallback for old data if any
              if (!t.category) {
                // keep defaults if needed
              }
              return (
                <div key={t.id} className="transaction-item group">
                  <div className="flex items-center gap-md">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: isExpense
                          ? "rgba(248,113,113,0.1)"
                          : "rgba(52,211,153,0.1)",
                        color: isExpense ? "#f87171" : "#34d399",
                      }}
                    >
                      {isExpense ? (
                        <CatIcon size={20} />
                      ) : (
                        <DollarSign size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{t.description}</p>
                      <p className="text-sm text-muted flex items-center gap-2">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs">
                          {accountName}
                        </span>
                        {t.createdAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-md">
                    <span
                      className={`font-bold ${
                        isExpense ? "text-danger" : "text-success"
                      }`}
                    >
                      {isExpense ? "-" : "+"}NT$ {t.amount}
                    </span>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="btn-icon"
                      title="刪除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
