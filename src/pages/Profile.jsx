import React, { useState } from 'react';
import { 
  updateProfile, 
  updatePassword, 
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Trash2, 
  ArrowLeft, 
  Save,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 判斷登入方式
  const isEmailUser = user?.providerData?.some(p => p.providerId === 'password');
  const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com');
  const isAppleUser = user?.providerData?.some(p => p.providerId === 'apple.com');
  const isAnonymous = user?.isAnonymous;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile(user, {
        displayName: displayName
      });
      setSuccess('顯示名稱已更新!');
    } catch (err) {
      console.error(err);
      setError('更新失敗,請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('新密碼與確認密碼不符');
      return;
    }

    if (newPassword.length < 6) {
      setError('密碼至少需要 6 個字元');
      return;
    }

    setLoading(true);

    try {
      // 需要重新驗證
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // 更新密碼
      await updatePassword(user, newPassword);
      setSuccess('密碼已更新!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('目前密碼錯誤');
      } else {
        setError('更新密碼失敗,請稍後再試。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    setLoading(true);

    try {
      // 刪除所有使用者資料
      const batch = writeBatch(db);
      
      // 刪除交易記錄
      const expensesQuery = query(collection(db, 'expenses'), where('uid', '==', user.uid));
      const expensesSnapshot = await getDocs(expensesQuery);
      expensesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // 刪除分類
      const categoriesQuery = query(collection(db, 'categories'), where('uid', '==', user.uid));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      categoriesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // 刪除帳戶
      const accountsQuery = query(collection(db, 'accounts'), where('uid', '==', user.uid));
      const accountsSnapshot = await getDocs(accountsQuery);
      accountsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      await batch.commit();

      // 刪除使用者帳號
      await deleteUser(user);
      
      navigate('/login');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('為了安全起見,請先登出再重新登入後刪除帳號。');
      } else {
        setError('刪除帳號失敗,請稍後再試。');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <nav className="navbar">
        <div className="nav-content">
          <button
            onClick={() => navigate('/')}
            className="btn-icon"
            title="返回"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-bold text-lg">帳號管理</h2>
          <div style={{ width: '40px' }}></div>
        </div>
      </nav>

      <div className="container animate-enter">
        {/* 帳號資訊 */}
        <div className="glass-panel mb-lg">
          <div className="flex items-center gap-md mb-md">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="avatar" style={{ width: '64px', height: '64px' }} />
            ) : (
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'rgba(129,140,248,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={32} className="text-primary" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">{user.displayName || '使用者'}</h3>
              <p className="text-sm text-muted">{user.email || '匿名使用者'}</p>
            </div>
          </div>

          {/* 登入方式 */}
          <div className="flex flex-wrap gap-sm">
            {isEmailUser && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs flex items-center gap-1">
                <Mail size={12} /> Email
              </span>
            )}
            {isGoogleUser && (
              <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs flex items-center gap-1">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '12px', height: '12px' }} />
                Google
              </span>
            )}
            {isAppleUser && (
              <span className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs flex items-center gap-1">
                🍎 Apple
              </span>
            )}
            {isAnonymous && (
              <span className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs flex items-center gap-1">
                👤 匿名
              </span>
            )}
          </div>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(248, 113, 113, 0.2)', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            marginBottom: '1rem', 
            fontSize: '0.9rem', 
            color: '#fca5a5',
            border: '1px solid rgba(248, 113, 113, 0.3)'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            background: 'rgba(52, 211, 153, 0.2)', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            marginBottom: '1rem', 
            fontSize: '0.9rem', 
            color: '#34d399',
            border: '1px solid rgba(52, 211, 153, 0.3)'
          }}>
            {success}
          </div>
        )}

        {/* 更新顯示名稱 */}
        {!isAnonymous && (
          <form onSubmit={handleUpdateProfile} className="glass-panel mb-lg">
            <h3 className="text-lg font-bold mb-md flex items-center gap-2">
              <User size={20} className="text-primary" />
              更新顯示名稱
            </h3>
            <div className="mb-md">
              <label className="text-sm text-muted mb-sm block">顯示名稱</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                placeholder="請輸入顯示名稱"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center"
            >
              <Save size={18} />
              儲存變更
            </button>
          </form>
        )}

        {/* 更新密碼 (僅 Email 使用者) */}
        {isEmailUser && (
          <form onSubmit={handleUpdatePassword} className="glass-panel mb-lg">
            <h3 className="text-lg font-bold mb-md flex items-center gap-2">
              <Lock size={20} className="text-primary" />
              更新密碼
            </h3>
            <div className="mb-md">
              <label className="text-sm text-muted mb-sm block">目前密碼</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
                placeholder="請輸入目前密碼"
                required
              />
            </div>
            <div className="mb-md">
              <label className="text-sm text-muted mb-sm block">新密碼</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="至少 6 個字元"
                required
              />
            </div>
            <div className="mb-md">
              <label className="text-sm text-muted mb-sm block">確認新密碼</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="再次輸入新密碼"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center"
            >
              <Shield size={18} />
              更新密碼
            </button>
          </form>
        )}

        {/* 刪除帳號 */}
        <div className="glass-panel" style={{ borderColor: 'rgba(248, 113, 113, 0.3)' }}>
          <h3 className="text-lg font-bold mb-md flex items-center gap-2 text-danger">
            <AlertTriangle size={20} />
            危險區域
          </h3>
          <p className="text-sm text-muted mb-md">
            刪除帳號後,所有記帳資料將永久刪除且無法復原。
          </p>
          
          {!showDeleteConfirm ? (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="btn w-full justify-center"
              style={{ 
                background: 'rgba(248, 113, 113, 0.2)', 
                color: '#f87171',
                border: '1px solid rgba(248, 113, 113, 0.3)'
              }}
            >
              <Trash2 size={18} />
              刪除帳號
            </button>
          ) : (
            <div>
              <p className="text-sm text-danger mb-md font-bold">
                ⚠️ 確定要刪除帳號嗎?此操作無法復原!
              </p>
              <div className="flex gap-md">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn flex-1 justify-center"
                >
                  取消
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="btn flex-1 justify-center"
                  style={{ 
                    background: 'rgba(248, 113, 113, 0.3)', 
                    color: '#f87171',
                    border: '1px solid rgba(248, 113, 113, 0.5)'
                  }}
                >
                  <Trash2 size={18} />
                  確認刪除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
