'use client';

import { useState, useEffect } from 'react';
import { Monitor, FolderClosed, FileText, Settings, Wifi, Battery, Volume2, Power, Terminal } from 'lucide-react';
import { SimulatorApp } from './simulator-app';

export function Desktop({ user, onLogout }: { user: string; onLogout: () => void }) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Dispatch Logon Event
    const logonPayload = {
      id: `{SIM-${Math.random().toString(36).substring(2, 10).toUpperCase()}}`,
      date: new Date().toISOString(),
      user: user,
      pc: `PC-${Math.floor(Math.random() * 9000) + 1000}`,
      is_threat: false,
      activity: 'Logon',
      is_Logon: true
    };
    setLogs([logonPayload]);

    return () => clearInterval(timer);
  }, [user]);

  return (
    <div className="w-full h-full flex flex-col relative" onClick={() => setStartMenuOpen(false)}>
      
      {/* Desktop Area */}
      <div className="flex-1 p-4 flex flex-col flex-wrap content-start gap-6 relative">
        <DesktopIcon icon={<Monitor className="w-10 h-10 text-white fill-white/10" />} label="This PC" />
        <DesktopIcon icon={<FolderClosed className="w-10 h-10 text-yellow-400 fill-yellow-400/20" />} label="Network Logs" />
        <DesktopIcon icon={<FileText className="w-10 h-10 text-blue-300 fill-blue-300/20" />} label="Activity Report" />
        <DesktopIcon 
          icon={<Terminal className="w-10 h-10 text-green-400" />} 
          label="Real-Time Simulator" 
          onClick={() => setIsSimulatorOpen(true)}
        />
      </div>

      {/* Sticky Note */}
      <div className="absolute top-10 right-10 w-64 bg-yellow-200/90 backdrop-blur-sm p-4 shadow-lg transform rotate-2 z-0 font-sans text-gray-800 rounded-sm border border-yellow-300">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-6 bg-yellow-400/50 rounded shadow-sm opacity-50" />
        <h3 className="font-bold text-sm mb-2 uppercase tracking-wide border-b border-yellow-300 pb-1">Known Domains</h3>
        
        <div className="text-xs mb-3">
          <span className="font-semibold text-red-700">Competitors:</span><br/>
          boeing.com, harris.com, hp.com, lockheedmartin.com, northropgrumman.com, raytheon.com
        </div>
        
        <div className="text-xs mb-3">
          <span className="font-semibold text-blue-700">Job Boards:</span><br/>
          careerbuilder, craigslist, indeed, linkedin, monster, simplyhired, aol.com/jobs...
        </div>

        <div className="text-xs">
          <span className="font-semibold text-purple-700">Suspicious:</span><br/>
          wikileaks.org
        </div>
      </div>

      {isSimulatorOpen && <SimulatorApp user={user} onClose={() => setIsSimulatorOpen(false)} onSimulate={async (payload) => {
        setLogs(prev => [...prev, payload]);
        try {
          const res = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: payload.user,
              pc_id: payload.pc,
              timestamp: new Date().getTime() / 1000,
              features: payload
            })
          });
          const data = await res.json();
          if (data.is_alert) {
            setNotifications(prev => [...prev, {
              id: Date.now(),
              risk: (data.risk * 100).toFixed(1),
              message: data.shap_summary?.sequence_flag || "Anomalous activity detected."
            }]);
          }
        } catch(e) {
          console.error("API Error", e);
        }
      }} />}

      {/* Notifications Area */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50">
        {notifications.map(notif => (
          <div key={notif.id} className="w-96 bg-red-900/90 border-2 border-red-500 rounded-sm p-3 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-in slide-in-from-top-5 flex flex-col">
            <div className="flex justify-between items-start">
              <span className="text-red-100 font-bold text-sm tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                SECURITY ALERT
              </span>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-red-300 hover:text-white leading-none text-xs"
              >
                X
              </button>
            </div>
            <p className="text-red-200 text-xs mt-2">{notif.message}</p>
            <p className="text-red-300 text-[10px] mt-1 font-mono">Risk Score: {notif.risk}%</p>
          </div>
        ))}
      </div>

      {/* Persistent CMD Terminal for Logs */}
      {logs.length > 0 && (
        <div className="absolute bottom-16 right-4 w-[450px] h-[300px] bg-black border-2 border-gray-700 shadow-2xl flex flex-col font-mono z-40 rounded-sm overflow-hidden">
          <div className="bg-white flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 text-black font-semibold text-xs">
              <Terminal className="w-3 h-3" />
              <span>Event Logs</span>
            </div>
            <button onClick={() => setLogs([])} className="text-black hover:bg-gray-300 px-2 leading-none text-xs">
              X
            </button>
          </div>
          <div className="flex-1 p-2 overflow-y-auto text-green-400 text-[10px] leading-tight break-all flex flex-col gap-3">
          
            {logs.map((log, idx) => {
              const formattedTime = new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return (
                <div key={idx} className="border-l-2 border-green-500 pl-2">
                  <div className="mt-1 text-green-300">
                    &gt; Event Dispatched: [{log.activity?.toUpperCase()}] at {formattedTime}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Start Menu Overlay */}
      {startMenuOpen && (
        <div 
          className="absolute bottom-12 left-0 w-80 h-96 bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 p-4">
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">Pinned</h3>
            <div className="grid grid-cols-4 gap-4">
              {/* Dummy Apps */}
              <div className="flex flex-col items-center gap-1 group cursor-pointer">
                <div className="w-12 h-12 rounded bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/40 transition-colors">
                  <Monitor className="text-blue-400" />
                </div>
                <span className="text-[10px] text-white">Edge</span>
              </div>
              <div className="flex flex-col items-center gap-1 group cursor-pointer">
                <div className="w-12 h-12 rounded bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/40 transition-colors">
                  <FolderClosed className="text-yellow-400" />
                </div>
                <span className="text-[10px] text-white">Files</span>
              </div>
              <div className="flex flex-col items-center gap-1 group cursor-pointer">
                <div className="w-12 h-12 rounded bg-gray-500/20 flex items-center justify-center group-hover:bg-gray-500/40 transition-colors">
                  <Settings className="text-gray-300" />
                </div>
                <span className="text-[10px] text-white">Settings</span>
              </div>
            </div>
          </div>
          
          <div className="h-16 bg-black/40 border-t border-white/10 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user.substring(0, 2)}
              </div>
              <span className="text-sm text-white font-medium">{user}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // Dispatch Logoff Event
                const logoffPayload = {
                  id: `{SIM-${Math.random().toString(36).substring(2, 10).toUpperCase()}}`,
                  date: new Date().toISOString(),
                  user: user,
                  pc: `PC-${Math.floor(Math.random() * 9000) + 1000}`,
                  is_threat: false,
                  activity: 'Logoff',
                  is_Logoff: true
                };
                setLogs(prev => [...prev, logoffPayload]);
                
                // Delay actual logout to let user see the terminal update
                setTimeout(() => {
                  onLogout();
                }, 1000);
              }}
              className="p-2 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Sign out"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="h-12 bg-black/70 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-2 z-50">
        
        {/* Left / Center: Start & Pinned Apps */}
        <div className="flex-1 flex justify-center items-center gap-1">
          {/* Start Button */}
          <button 
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${startMenuOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
            onClick={(e) => {
              e.stopPropagation();
              setStartMenuOpen(!startMenuOpen);
            }}
          >
            <div className="grid grid-cols-2 gap-[2px]">
              <div className="w-[8px] h-[8px] bg-blue-400 rounded-sm"></div>
              <div className="w-[8px] h-[8px] bg-blue-400 rounded-sm"></div>
              <div className="w-[8px] h-[8px] bg-blue-400 rounded-sm"></div>
              <div className="w-[8px] h-[8px] bg-blue-400 rounded-sm"></div>
            </div>
          </button>
          
          <div className="w-[1px] h-6 bg-white/20 mx-2" />
          
          {/* Running App (Dummy) */}
          <button className="w-10 h-10 rounded-md hover:bg-white/10 flex items-center justify-center">
            <FolderClosed className="w-5 h-5 text-yellow-400" />
          </button>
        </div>
        
        {/* Right: System Tray */}
        <div className="flex items-center gap-1 px-2 h-full text-white/90">
          <button className="p-2 rounded hover:bg-white/10">
            <Wifi className="w-4 h-4" />
          </button>
          <button className="p-2 rounded hover:bg-white/10">
            <Volume2 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded hover:bg-white/10">
            <Battery className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col items-end justify-center ml-2 text-[11px] leading-tight hover:bg-white/10 px-2 rounded h-full cursor-default select-none">
            {currentTime && (
              <>
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>{currentTime.toLocaleDateString()}</span>
              </>
            )}
          </div>
          
          {/* Show desktop sliver */}
          <div className="w-1 h-full border-l border-white/20 ml-2 hover:bg-white/10 cursor-pointer" />
        </div>

      </div>
    </div>
  );
}

function DesktopIcon({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <div 
      className="w-20 flex flex-col items-center gap-1 p-1 rounded hover:bg-white/10 border border-transparent hover:border-white/20 cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      <div className="drop-shadow-md group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <span className="text-white text-xs text-center leading-tight drop-shadow-md break-words line-clamp-2 px-1 text-shadow">
        {label}
      </span>
      <style jsx>{`
        .text-shadow {
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        }
      `}</style>
    </div>
  );
}
