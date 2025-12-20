
import React, { useState } from 'react';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Wallet, Mail, Lock, User } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Google 登入失敗,請稍後再試。');
      if (err.code === 'auth/configuration-not-found') {
        setError('請設定 Firebase Config (src/firebase.js)');
      }
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // 註冊
        if (password.length < 6) {
          setError('密碼至少需要 6 個字元');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // 更新顯示名稱
        if (displayName) {
          await updateProfile(userCredential.user, {
            displayName: displayName
          });
        }
        navigate('/');
      } else {
        // 登入
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('此信箱已被註冊');
          break;
        case 'auth/invalid-email':
          setError('信箱格式不正確');
          break;
        case 'auth/weak-password':
          setError('密碼強度不足');
          break;
        case 'auth/user-not-found':
          setError('找不到此帳號');
          break;
        case 'auth/wrong-password':
          setError('密碼錯誤');
          break;
        case 'auth/invalid-credential':
          setError('帳號或密碼錯誤');
          break;
        default:
          setError(isRegister ? '註冊失敗,請稍後再試' : '登入失敗,請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="glass-panel text-center animate-enter" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="flex justify-center mb-md">
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            <Wallet size={32} className="text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-sm">雲端記帳本</h1>
        <p className="text-muted mb-lg">簡單、安全、漂亮的記帳體驗</p>

        {/* 切換登入/註冊 */}
        <div className="flex gap-sm bg-black/20 p-1 rounded-lg mb-lg">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            className={`w-full py-2 rounded-md text-sm transition-all ${
              !isRegister ? 'bg-primary/20 text-primary' : 'text-muted'
            }`}
            style={!isRegister ? { background: 'rgba(129,140,248,0.2)', color: '#818cf8' } : {}}
          >
            登入
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className={`w-full py-2 rounded-md text-sm transition-all ${
              isRegister ? 'bg-primary/20 text-primary' : 'text-muted'
            }`}
            style={isRegister ? { background: 'rgba(129,140,248,0.2)', color: '#818cf8' } : {}}
          >
            註冊
          </button>
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

        {/* 帳號密碼表單 */}
        <form onSubmit={handleEmailAuth} className="mb-lg">
          {isRegister && (
            <div className="mb-md text-left">
              <label className="text-sm text-muted mb-sm block">
                <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                顯示名稱
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                placeholder="請輸入你的名字"
                required={isRegister}
              />
            </div>
          )}

          <div className="mb-md text-left">
            <label className="text-sm text-muted mb-sm block">
              <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
              電子信箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="mb-lg text-left">
            <label className="text-sm text-muted mb-sm block">
              <Lock size={14} style={{ display: 'inline', marginRight: '4px' }} />
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder={isRegister ? "至少 6 個字元" : "請輸入密碼"}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center mb-md"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '處理中...' : (isRegister ? '註冊帳號' : '登入')}
          </button>
        </form>

        {/* 分隔線 */}
        <div className="flex items-center gap-md mb-md">
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span className="text-xs text-muted">或</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        {/* Google 登入 */}
        <button 
          onClick={handleGoogleSignIn}
          className="btn w-full justify-center"
          type="button"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            style={{ width: '20px', height: '20px', marginRight: '8px' }}
          />
          使用 Google 帳號登入
        </button>

        <p className="mt-md text-sm text-muted">
          安全登入由 Firebase Authentication 提供
        </p>
      </div>
    </div>
  );
};

export default Login;
