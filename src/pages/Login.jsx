
import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('登入失敗，請檢查 Firebase 設定或稍後再試。');
      if (err.code === 'auth/configuration-not-found') {
          setError('請設定 Firebase Config (src/firebase.js)');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="glass-panel text-center animate-enter" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="flex justify-center mb-md">
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                <Wallet size={32} className="text-primary" />
            </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-sm">雲端記帳本</h1>
        <p className="text-muted mb-lg">簡單、安全、漂亮的記帳體驗</p>

        {error && (
            <div style={{ background: 'rgba(248, 113, 113, 0.2)', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', color: '#fca5a5' }}>
                {error}
            </div>
        )}

        <button 
          onClick={handleGoogleSignIn}
          className="btn w-full justify-center"
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
