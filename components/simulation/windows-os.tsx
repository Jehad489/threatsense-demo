'use client';

import { useState } from 'react';
import { LoginScreen } from './login-screen';
import { Desktop } from './desktop';

export function WindowsOS() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const handleLogin = (userId: string) => {
    setCurrentUser(userId);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <div className="relative w-full h-full font-sans overflow-hidden select-none" style={{ backgroundColor: '#005A9E' }}>
      {/* Background Wallpaper */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ 
          backgroundImage: 'linear-gradient(to bottom right, #005A9E, #002244)',
          opacity: isLoggedIn ? 1 : 0.4
        }}
      />
      
      <div className="absolute inset-0 z-10">
        {!isLoggedIn ? (
          <LoginScreen onLogin={handleLogin} />
        ) : (
          <Desktop user={currentUser!} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}
