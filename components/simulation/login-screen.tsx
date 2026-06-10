'use client';

import { useState, useEffect } from 'react';
import { User, ArrowRight } from 'lucide-react';

const VALID_USERS = ['KLH0596', 'WDD0366', 'PPF0435', 'JRG0207'];

export function LoginScreen({ onLogin }: { onLogin: (userId: string) => void }) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Init State
  const [initUser, setInitUser] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatus, setInitStatus] = useState('');

  const TARGET_DATES: Record<string, number> = {
    "KLH0596": 1297494710,
    "WDD0366": 1298576981,
    "PPF0435": 1297220427,
    "JRG0207": 1295468705
  };

  const handleInitialize = async () => {
    if (!initUser) return;
    setIsInitializing(true);
    setInitStatus('Sending request...');
    
    try {
      const targetDate = TARGET_DATES[initUser];
      const payload = { target_dates: { [initUser]: targetDate } };
      
      const res = await fetch('http://localhost:8000/init-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('API Request Failed');
      
      // Poll for status
      setInitStatus('Initializing model state...');
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch('http://localhost:8000/fast_forward_status');
          const data = await statusRes.json();
          if (data.status === 'completed') {
            clearInterval(poll);
            setInitStatus(`✅ Success: Processed ${data.events_processed} events.`);
            setIsInitializing(false);
          } else if (data.status === 'error') {
            clearInterval(poll);
            setInitStatus(`❌ Error: ${data.error}`);
            setIsInitializing(false);
          } else {
            setInitStatus(`Running: ${data.events_processed} events...`);
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
      
    } catch (err: any) {
      setInitStatus(`Error: ${err.message}`);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    
    const upperId = userId.trim().toUpperCase();
    
    if (VALID_USERS.includes(upperId)) {
      setIsSubmitting(true);
      // Fake loading delay for realism
      setTimeout(() => {
        onLogin(upperId);
      }, 800);
    } else {
      setError(true);
    }
  };

  if (!currentTime) return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center backdrop-blur-md bg-black/20">
      
      {/* Clock Area */}
      <div className="absolute bottom-24 left-12 flex flex-col items-start text-white drop-shadow-lg">
        <h1 className="text-8xl font-light tracking-tight">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </h1>
        <p className="text-4xl font-light mt-2">
          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Login Box */}
      <div className="flex flex-col items-center mb-16">
        <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border-2 border-white/30 shadow-2xl overflow-hidden mb-6">
          <User className="w-24 h-24 text-white/80" strokeWidth={1} />
        </div>
        
        <h2 className="text-3xl font-light text-white mb-8 drop-shadow-md">Sign In</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col items-center relative">
          <div className="relative flex items-center w-72">
            <input
              type="text"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value.toUpperCase());
                setError(false);
              }}
              placeholder="Enter User ID"
              className="w-full h-10 px-4 pr-12 bg-black/40 border border-white/20 rounded-sm text-white placeholder-white/50 outline-none focus:border-white/50 focus:bg-black/60 transition-all uppercase"
              autoFocus
              disabled={isSubmitting}
            />
            <button 
              type="submit"
              disabled={!userId || isSubmitting}
              className="absolute right-1 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-sm disabled:opacity-50 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          {error && (
            <p className="absolute -bottom-8 text-sm text-red-300 font-medium tracking-wide drop-shadow-md">
              Incorrect User ID or password.
            </p>
          )}
          
          {isSubmitting && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white/80 text-sm">Welcome</p>
            </div>
          )}
        </form>

        {/* Initialize Simulator Section */}
        <div className="mt-16 p-4 bg-black/40 border border-white/10 rounded-md flex flex-col items-center">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-3">Backend Management</p>
          <div className="flex items-center gap-2">
            <select 
              value={initUser} 
              onChange={(e) => setInitUser(e.target.value)}
              disabled={isInitializing}
              className="h-8 px-2 bg-black/60 border border-white/20 rounded-sm text-white text-sm outline-none"
            >
              <option value="" disabled>Select User</option>
              {VALID_USERS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button
              onClick={handleInitialize}
              disabled={isInitializing || !initUser}
              className="h-8 px-4 bg-red-600/80 hover:bg-red-600 border border-red-500/50 rounded-sm text-white text-sm transition-colors disabled:opacity-50"
            >
              {isInitializing ? 'Initializing...' : 'Initialize State'}
            </button>
          </div>
          {initStatus && (
            <p className={`mt-3 text-xs ${initStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {initStatus}
            </p>
          )}
        </div>
      </div>
      
    </div>
  );
}
