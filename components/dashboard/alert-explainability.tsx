'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Brain, AlertTriangle, Shield, User, Mail, Briefcase, ChevronDown, CheckCircle, Copy, Code, PieChart, Clock, Globe, Database, Monitor
} from 'lucide-react';
import baselineStatsRaw from '@/lib/baseline_stats.json';
import unifiedLdap from '@/lib/unified_ldap.json';
import oceanScoresRaw from '@/lib/ocean_scores.json';

const LDAP_INFO: Record<string, any> = unifiedLdap;
const oceanScores = oceanScoresRaw as Record<string, any>;
const allBaselineStats = baselineStatsRaw as Record<string, any>;

function parseTriggerEvent(event: any, ldap: any, stats: any) {
  const warnings: string[] = [];
  
  if (!event) return warnings;

  let devicePct = 0;
  if (stats?.total_events > 0) {
    const devCount = stats.event_distribution?.device || stats.event_distribution?.DEVICE || stats.event_distribution?.Device || 0;
    devicePct = (devCount / stats.total_events) * 100;
  }
  let ahPct = stats?.after_hours_pct || 0;

  let devLabel = "";
  if (devicePct === 0) devLabel = "This is the first recorded USB activity for this user.";
  else if (devicePct < 10) devLabel = "This is rare USB activity.";
  else if (devicePct > 30) devLabel = "This is unusual USB activity.";

  let ahLabel = "";
  if (ahPct === 0) ahLabel = "This is the first recorded after hours activity for this user.";
  else if (ahPct < 10) ahLabel = "This is rare after hours activity.";
  else if (ahPct > 30) ahLabel = "This is unusual after hours activity.";

  // Removable Media
  if (event.is_Connect === 1 || event.is_Connect === true || event.is_Disconnect === 1 || event.is_Disconnect === true) {
    warnings.push(`Removable Media State Change (USB Activity). ${devLabel}`.trim());
  }

  // After Hours
  if (event.after_working_hours === 1 || event.after_working_hours === true) {
    warnings.push(`Activity occurred outside of usual business hours. ${ahLabel}`.trim());
  }

  const isEmail = event.log_type === 'email' || event.activity_type === 'email';
  const isHttp = event.log_type === 'http' || event.activity_type === 'http';
  const isFile = event.log_type === 'file' || event.activity_type === 'file';

  // Domain Logic
  if (isEmail && (event.is_competitor_domain === 1 || event.is_competitor_domain === true)) {
    warnings.push("Communication with competitor domain");
  }
  if (isHttp && (event.is_competitor_domain === 1 || event.is_competitor_domain === true)) {
    warnings.push("Visiting competitor domain");
  }
  if (event.is_exf_domain === 1 || event.is_exf_domain === true) {
    warnings.push("Visiting high risk suspisous domain");
  }

  // File Extension Logic
  if (isFile || event.filename) {
    const fn = (event.filename || '').toLowerCase();
    const match = fn.match(/\.([a-z0-9]+)$/);
    if (match) {
      warnings.push(`Interaction with .${match[1]} file`);
    }
  }

  // Email activity logic
  if (isEmail) {
    const to = event.to || '';
    const cc = event.cc || '';
    const bcc = event.bcc || '';
    const allEmails = [to, cc, bcc].join(';').split(';').map(s => s.trim()).filter(Boolean);
    
    const internalEmails = allEmails.filter(e => e.toLowerCase().endsWith('@dtaa.com') || !e.includes('@'));
    const externalEmails = allEmails.filter(e => e.includes('@') && !e.toLowerCase().endsWith('@dtaa.com'));
    
    let emailMsg = "";
    if (internalEmails.length > 0) {
      emailMsg += `Email sent to (${internalEmails.length} internal emails: ${internalEmails.join(', ')}). `;
    }
    if (externalEmails.length > 0) {
      emailMsg += `Email sent to (${externalEmails.length} external emails: ${externalEmails.join(', ')}). `;
    }

    const supervisorFirstName = (ldap?.supervisor || '').split(' ')[0].toLowerCase();
    const isSupervisor = supervisorFirstName && allEmails.some(e => e.toLowerCase().includes(supervisorFirstName));
    
    if (event.is_competitor_domain) {
      emailMsg += "Contains competitor email.";
    } else if (isSupervisor) {
      emailMsg += "Contains supervisor email.";
    } else if (internalEmails.length > 0 && externalEmails.length === 0) {
      emailMsg += "Internal communication.";
    }

    if (emailMsg) warnings.push(emailMsg.trim());
  }

  // Always return warnings without injecting a generic string
  return warnings;
}

function UserSelector({
  users,
  selectedUser,
  onSelect,
}: {
  users: any[];
  selectedUser: any;
  onSelect: (user: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-card border border-border rounded-lg hover:border-[#3B82F6]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DC2626]/20 border border-[#DC2626]/30 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
          </div>
          <div className="text-left">
            <p className="font-mono font-bold text-[#DC2626]">{selectedUser.user_name}</p>
            <p className="text-xs text-muted-foreground">{selectedUser.role} • Alert ID: {selectedUser.user_id}</p>
          </div>
        </div>
        <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'transform rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
          {users.map((user, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelect(user);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left',
                selectedUser.timestamp === user.timestamp && 'bg-foreground/10'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-[#DC2626]/20 border border-[#DC2626]/30 flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-[#DC2626]">
                  {(user.risk_score * 100).toFixed(0)}
                </span>
              </div>
              <div>
                <p className="font-mono font-medium text-foreground">{user.user_name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AnnotateEmails({ emailStr, supervisor, isCompetitor, userId, userEmail }: any) {
  if (!emailStr || emailStr === 'N/A') return <span>N/A</span>;
  const supervisorFirstName = (supervisor || '').split(' ')[0].toLowerCase();
  
  const emails = emailStr.split(';').map((e: string) => e.trim()).filter(Boolean);
  
  return (
    <>
      {emails.map((email: string, i: number) => {
        const isSup = supervisorFirstName && email.toLowerCase().includes(supervisorFirstName);
        const isComp = isCompetitor && (!email.toLowerCase().endsWith('@dtaa.com') && email.includes('@'));
        const flags = [];
        if (isSup) flags.push('supervisor');
        if (isComp) flags.push('competitor');
        
        let displayEmail = email;
        const uidStr = String(userId || '');
        if (uidStr && userEmail && displayEmail.toLowerCase().includes(uidStr.toLowerCase())) {
          displayEmail = displayEmail.toLowerCase().replace(`${uidStr.toLowerCase()}@dtaa.com`, userEmail);
        }
        
        return (
          <span key={i}>
            {displayEmail}
            {flags.length > 0 && <span className="text-[#DC2626] font-bold ml-1 text-[10px] uppercase">({flags.join(', ')})</span>}
            {i < emails.length - 1 ? '; ' : ''}
          </span>
        );
      })}
    </>
  );
}

const PSYCHOMETRIC_DATA = [
  { trait: 'O', label: 'Openness', score: 58, color: 'bg-blue-500' },
  { trait: 'C', label: 'Conscientiousness', score: 8, color: 'bg-green-600' },
  { trait: 'E', label: 'Extraversion', score: 62, color: 'bg-yellow-500' },
  { trait: 'A', label: 'Agreeableness', score: 5, color: 'bg-purple-500' },
  { trait: 'N', label: 'Neuroticism', score: 43, color: 'bg-pink-500' }
];

export function AlertExplainability() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [expandedEventIdx, setExpandedEventIdx] = useState<number | null>(null);

  useEffect(() => { setExpandedEventIdx(null); }, [selectedUser]);

  useEffect(() => {
    const DUMMY_ALERTS = [
      {
        user_id: "WDD0366",
        user_name: "Wesley Dustin Dickerson",
        risk_score: 0.92,
        raw_history: [
          { ts: 1718000000, activity: "LOGON", pc: "PC-1200", log_type: "logon", after_working_hours: false },
          { ts: 1718001000, activity: "HTTP", pc: "PC-1200", log_type: "http", url: "github.com", after_working_hours: false },
          { ts: 1718002000, activity: "EMAIL", pc: "PC-1200", log_type: "email", to: "supervisor@dtaa.com", after_working_hours: false },
          { ts: 1718003000, activity: "HTTP", pc: "PC-1200", log_type: "http", url: "stackoverflow.com", after_working_hours: false },
          { ts: 1718004000, activity: "FILE", pc: "PC-1200", log_type: "file", filename: "admin-script.ps1", after_working_hours: false },
          { ts: 1718005000, activity: "HTTP", pc: "PC-1200", log_type: "http", url: "reddit.com", after_working_hours: false },
          { ts: 1718006000, activity: "EMAIL", pc: "PC-1200", log_type: "email", to: "it-support@dtaa.com", after_working_hours: false },
          { ts: 1718007000, activity: "HTTP", pc: "PC-1200", log_type: "http", url: "aws.amazon.com", after_working_hours: false },
          { ts: 1718008000, activity: "LOGON", pc: "PC-1200", log_type: "logon", after_working_hours: false },
          { ts: 1718009000, activity: "FILE", pc: "PC-1200", log_type: "file", filename: "passwords.txt", after_working_hours: false },
          { ts: 1718010000, activity: "HTTP", pc: "PC-1200", log_type: "http", url: "portal.azure.com", after_working_hours: false },
          { ts: 1718011000, activity: "EMAIL", pc: "PC-1200", log_type: "email", to: "security@dtaa.com", after_working_hours: false },
          { ts: 1718012000, activity: "HTTP", pc: "PC-1200", log_type: "http", url: "ycombinator.com", after_working_hours: false },
          { ts: 1718013000, activity: "FILE", pc: "PC-1200", log_type: "file", filename: "logs.zip", after_working_hours: false },
          { ts: 1718014000, activity: "HTTP", pc: "PC-1200", log_type: "http", url: "dtaa.com", after_working_hours: false },
          { ts: 1718015000, activity: "EMAIL", pc: "PC-1200", log_type: "email", to: "colleague@dtaa.com", after_working_hours: false },
          { ts: 1718016000, activity: "LOGOFF", pc: "PC-1200", log_type: "logoff", after_working_hours: false },
          { ts: 1718050000, activity: "LOGON", pc: "PC-1200", log_type: "logon", after_working_hours: true },
          { ts: 1718051000, activity: "CONNECT", pc: "PC-1200", log_type: "device", is_Connect: true, after_working_hours: true },
          { ts: 1718052000, activity: "HTTP", pc: "PC-1200", log_type: "http", url: "mega.nz", is_exf_domain: true, after_working_hours: true },
        ]
        }
      ];
      setAlerts(DUMMY_ALERTS);
    if (!selectedUser) setSelectedUser(DUMMY_ALERTS[0]);
  }, []);

  if (!selectedUser) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground bg-background">
        <div className="text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="uppercase tracking-widest font-bold">No active alerts detected.</p>
        </div>
      </div>
    );
  }

  const userKeyStr = String(selectedUser?.user_id || selectedUser?.user || selectedUser?.user_name || 'Unknown');
  const userKey = userKeyStr.includes('@') ? userKeyStr.split('@')[0] : userKeyStr;

  const ldap = LDAP_INFO[userKey] || {
    name: selectedUser.user_name || 'Unknown User',
    email: 'Unknown',
    role: selectedUser.role || 'Unknown Role',
    department: selectedUser.department || 'Unknown',
    supervisor: 'Unknown'
  };

  const rawHistory = selectedUser?.raw_history || [];
  const triggerEvent = rawHistory[rawHistory.length - 1]; // T-00
  const previousEvents = rawHistory.slice(0, -1);

  const stats = allBaselineStats[userKey] || {
    total_events: 100,
    event_distribution: { HTTP: 80, LOGON: 10, EMAIL: 10 },
    after_hours_pct: 5.0,
    top_domains: { "unknown.com": 1 },
    top_emails: { "unknown@dtaa.com": 1 }
  };

  // Exfiltration sequence detection
  let isLikelyExfiltration = false;
  let exfilAfterHours = false;
  let seenConnect = false;
  let seenSusHttp = false;
  let seenDisconnect = false;
  let exfilUrl = '';

  for (const evt of rawHistory) {
    const act = (evt.activity || evt.log_type || '').toUpperCase();
    const isConn = evt.is_Connect === 1 || evt.is_Connect === true;
    const isDisconn = evt.is_Disconnect === 1 || evt.is_Disconnect === true;
    const isExf = evt.is_exf_domain === 1 || evt.is_exf_domain === true;

    if (isConn) {
      seenConnect = true;
    } else if (seenConnect && act === 'HTTP' && isExf) {
      seenSusHttp = true;
      isLikelyExfiltration = true;
      
      // Attempt to extract the URL
      if (evt.url) {
         exfilUrl = evt.url;
      } else if (evt.activity_details) {
         try {
             const parsed = JSON.parse(evt.activity_details);
             if (parsed.url) exfilUrl = parsed.url;
         } catch(e) {}
      }

      if (evt.after_working_hours === 1 || evt.after_working_hours === true) {
        exfilAfterHours = true;
      }
    } else if (seenConnect && seenSusHttp && isDisconn) {
      seenDisconnect = true;
    }
  }

  const triggerBehaviors = triggerEvent ? parseTriggerEvent(triggerEvent, ldap, stats) : [];

  const formatTs = (ts: number | string) => {
    try {
      const d = new Date(Number(ts) * 1000);
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const weekday = days[d.getUTCDay()];
      const month = months[d.getUTCMonth()];
      const day = d.getUTCDate();
      const year = d.getUTCFullYear();
      const time = d.toISOString().split('T')[1].substring(0, 8);
      return `${weekday}, ${month} ${day}, ${year} ${time} UTC`;
    } catch { return "Unknown Time"; }
  };

  const ocean = oceanScores[userKey] || { O: 0.5, C: 0.5, E: 0.5, A: 0.5, N: 0.5 };

  return (
    <div className="h-full overflow-y-auto p-6 bg-background font-mono text-foreground text-sm">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        
        {alerts.length > 1 && (
          <div className="mb-4 border border-border p-4 bg-card rounded">
            <UserSelector users={alerts} selectedUser={selectedUser} onSelect={setSelectedUser} />
          </div>
        )}

        {/* 1. Header & Identity Profiling */}
        <div className="bg-card border border-[#DC2626]/50 shadow-[0_0_15px_rgba(220,38,38,0.15)] rounded-xl overflow-hidden mt-8">
            <div className="bg-[#DC2626]/10 px-6 py-4 border-b border-[#DC2626]/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-[#DC2626]" />
                    <h2 className="text-lg font-bold text-foreground tracking-wider">Attacker Details</h2>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-[#DC2626] font-bold uppercase tracking-widest">Risk Score</p>
                    <p className="text-2xl font-black text-[#DC2626]">{(selectedUser.risk_score * 100).toFixed(1)}%</p>
                </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <User className="h-4 w-4 text-[#3B82F6]" /> Identity Details
                </h3>
                <div>
                  <div className="text-xl font-bold text-foreground">{ldap.name !== 'Unknown User' ? ldap.name : (selectedUser.user_name || selectedUser.user)}</div>
                  <div className="text-sm font-mono text-[#3B82F6]">{userKey}</div>
                </div>
                <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm truncate">{ldap.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{ldap.role}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Shield className="h-3 w-3 text-[#10B981]" /> Organizational Context
                    </h3>
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Department</p>
                        <p className="text-sm font-medium text-foreground">{ldap.department}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Supervisor</p>
                        <p className="text-sm font-medium text-foreground">{ldap.supervisor}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. Trigger Event Translated Analysis */}
        <div className="mt-8">
            <h3 className="text-[#F59E0B] font-bold border-b border-dashed border-border pb-2 mb-4 uppercase tracking-widest">
                Attack alert
            </h3>
            
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="mb-4">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Timestamp</p>
                    <p className="text-lg text-foreground font-mono">{formatTs(triggerEvent.timestamp || triggerEvent.ts || triggerEvent.date)}</p>
                </div>
                
                  <ul className="space-y-3 font-mono text-sm mt-4">
                    {isLikelyExfiltration && (
                        <li className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-1">
                            <span className="text-foreground font-bold text-base uppercase tracking-wider mb-1">Likely Exfiltration Process Detected</span>
                            <span className="text-red-400">High-risk sequence identified in the last 20 events: <br/><span className="text-foreground font-semibold">USB Connect ➔ Exfiltration Domain Visit {exfilUrl ? `(${exfilUrl})` : ''}{seenDisconnect ? ' ➔ USB Disconnect' : ''}</span></span>
                            {(() => {
                              let devicePct = 0;
                              if (stats?.total_events > 0) {
                                const devCount = stats.event_distribution?.device || stats.event_distribution?.DEVICE || stats.event_distribution?.Device || 0;
                                devicePct = (devCount / stats.total_events) * 100;
                              }
                              let ahPct = stats?.after_hours_pct || 0;

                              let devLabel = "";
                              if (devicePct === 0) devLabel = "This is the first recorded USB activity for this user.";
                              else if (devicePct < 10) devLabel = "This is rare USB activity.";
                              else if (devicePct > 30) devLabel = "This is unusual USB activity.";

                              let ahLabel = "";
                              if (ahPct === 0) ahLabel = "This is the first recorded after hours activity for this user.";
                              else if (ahPct < 10) ahLabel = "This is rare after hours activity.";
                              else if (ahPct > 30) ahLabel = "This is unusual after hours activity.";

                              return (
                                <div className="flex flex-col gap-2 mt-2">
                                    {devLabel && (
                                      <span className="text-red-400 font-bold inline-flex items-start gap-1 bg-red-500/10 px-2 py-1 w-fit max-w-full text-xs rounded border border-red-500/30">
                                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" /> {devLabel}
                                      </span>
                                    )}
                                    {exfilAfterHours && (
                                        <span className="text-[#F59E0B] font-bold inline-flex items-start gap-1 bg-[#F59E0B]/10 px-2 py-1 w-fit max-w-full text-xs rounded border border-[#F59E0B]/30">
                                            <Clock className="h-3 w-3 shrink-0 mt-0.5" /> This exfiltration sequence occurred after normal business hours. {ahLabel}
                                        </span>
                                    )}
                                </div>
                              );
                            })()}
                          </div>
                        </li>
                    )}
                    
                    {(() => {
                      const displayBehaviors = isLikelyExfiltration ? triggerBehaviors.filter(b => 
                        !b.includes('outside of usual business hours') && 
                        !b.includes('Visiting high risk suspisous domain')
                      ) : triggerBehaviors;

                      return (
                        <div key="top-alerts">
                          {displayBehaviors.length > 0 ? (
                            displayBehaviors.map((b, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <span className="text-foreground leading-relaxed">{b}</span>
                              </li>
                            ))
                          ) : null}
                        </div>
                      );
                    })()}
                  </ul>
            </div>
        </div>

        {/* 3. Raw Feature Context */}
        <div className="mt-8 mb-12">
            <h3 className="text-[#3B82F6] font-bold border-b border-dashed border-border pb-2 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Code className="h-4 w-4" /> The last 20 events
            </h3>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-background sticky top-0 z-10">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider w-16">Step</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider w-40">Timestamp</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider w-32">Activity</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider w-24">Target PC</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Behavioral Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363D]">
                    {rawHistory.map((evt: any, idx: number) => {
                      const tIndex = 19 - idx;
                      const ts = formatTs(evt.timestamp || evt.ts || evt.date);
                      const activity = (evt.activity || evt.log_type || 'System').toUpperCase();
                      const pc = evt.pc || '-';
                      
                      // Try to parse specific activity details if it exists
                      let parsedDetails: any = null;
                      let activityDetails = "";
                      try {
                        if (typeof evt.activity_details === 'string') {
                          parsedDetails = JSON.parse(evt.activity_details);
                          if (parsedDetails.url) activityDetails = parsedDetails.url;
                          else if (parsedDetails.to) activityDetails = `To: ${parsedDetails.to}`;
                          else if (parsedDetails.filename) activityDetails = parsedDetails.filename;
                        } else if (activity === 'EMAIL') {
                          // Inject dummy email data if none parsed
                          parsedDetails = {
                            to: evt.to || "external_contact@company.com",
                            cc: "manager@company.com",
                            bcc: "personal_email@gmail.com",
                            subject: "Update regarding recent changes",
                            content: "Please review the attached confidential information regarding the new project.",
                            attachments: "No attachment"
                          };
                          activityDetails = `To: ${parsedDetails.to}`;
                        }
                      } catch(e) {}
                      if (!activityDetails) {
                         activityDetails = evt.url || evt.to || evt.filename || '';
                      }

                      // Re-use our translation function to extract insights
                      const behaviors = parseTriggerEvent(evt, ldap, stats);
                      const nonExpandable = ['DEVICE', 'LOGON', 'LOGOFF', 'CONNECT', 'DISCONNECT'];
                      const canExpand = !nonExpandable.includes(activity);
                      const isExpanded = canExpand && expandedEventIdx === idx;

                      return (
                        <React.Fragment key={idx}>
                          <tr 
                            onClick={() => canExpand && setExpandedEventIdx(isExpanded ? null : idx)}
                            className={cn("transition-colors", canExpand ? "hover:bg-white/5 cursor-pointer" : "opacity-70")}
                          >
                            <td className="px-4 py-3 whitespace-nowrap font-mono text-muted-foreground">T-{tIndex}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-foreground">{ts}</td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-foreground">{activity}</span>
                              {activityDetails && (
                                <div className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={activityDetails}>
                                  {activityDetails}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-foreground">{pc}</td>
                            <td className="px-4 py-3">
                              {behaviors.length > 0 ? (
                                <ul className="space-y-1">
                                  {behaviors.map((b, i) => {
                                    const isRareOrUnusual = b.toLowerCase().includes('rare') || b.toLowerCase().includes('unusual') || b.toLowerCase().includes('high risk');
                                    return (
                                      <li key={i} className="flex items-start gap-1.5 text-[11px]">
                                        <span className={cn("mt-0.5", isRareOrUnusual ? "text-red-500" : "text-[#F59E0B]")}>•</span>
                                        <span className={cn("leading-tight", isRareOrUnusual ? "text-red-400 font-medium" : "text-foreground")}>{b}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <span className="text-muted-foreground text-[10px] uppercase">Standard Activity</span>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-background">
                              <td colSpan={5} className="px-4 py-3 border-b border-border">
                                <div className="text-xs font-mono p-3 rounded bg-card border border-border overflow-x-auto shadow-inner">
                                  <div className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold mb-2">Raw Event Payload</div>
                                  
                                  {activity === 'EMAIL' ? (
                                    <div className="space-y-1">
                                      <div><span className="text-[#3B82F6] font-bold">to:</span> <span className="text-[#10B981] ml-2 break-all"><AnnotateEmails emailStr={parsedDetails?.to} supervisor={ldap.supervisor} isCompetitor={evt.is_competitor_domain} userId={userKey} userEmail={ldap.email} /></span></div>
                                      <div><span className="text-[#3B82F6] font-bold">cc:</span> <span className="text-[#10B981] ml-2 break-all"><AnnotateEmails emailStr={parsedDetails?.cc} supervisor={ldap.supervisor} isCompetitor={evt.is_competitor_domain} userId={userKey} userEmail={ldap.email} /></span></div>
                                      <div><span className="text-[#3B82F6] font-bold">bcc:</span> <span className="text-[#10B981] ml-2 break-all"><AnnotateEmails emailStr={parsedDetails?.bcc} supervisor={ldap.supervisor} isCompetitor={evt.is_competitor_domain} userId={userKey} userEmail={ldap.email} /></span></div>
                                      <div><span className="text-[#3B82F6] font-bold">from:</span> <span className="text-[#10B981] ml-2 break-all">{ldap.email}</span></div>
                                      <div><span className="text-[#3B82F6] font-bold">subject:</span> <span className="text-[#10B981] ml-2 break-all">{parsedDetails?.subject || 'Update regarding recent changes'}</span></div>
                                      <div><span className="text-[#3B82F6] font-bold">content:</span> <span className="text-[#10B981] ml-2 break-all">{parsedDetails?.content || 'Please review the attached confidential information regarding the new project.'}</span></div>
                                      <div><span className="text-[#3B82F6] font-bold">attachment:</span> <span className="text-[#10B981] ml-2 break-all">{parsedDetails?.attachments || parsedDetails?.attachment || 'No attachment'}</span></div>
                                    </div>
                                  ) : activity === 'HTTP' ? (
                                    <div className="space-y-1">
                                      <div>
                                        <span className="text-[#3B82F6] font-bold">url:</span> 
                                        <span className="text-[#10B981] ml-2 break-all">
                                          {parsedDetails?.url || evt.url || 'Unknown URL'}
                                          {evt.is_job_search_domain ? <span className="text-[#DC2626] font-bold ml-1 text-[10px] uppercase">(job search)</span> : null}
                                          {evt.is_exf_domain ? <span className="text-[#DC2626] font-bold ml-1 text-[10px] uppercase">(suspicious domain)</span> : null}
                                          {evt.is_competitor_domain ? <span className="text-[#DC2626] font-bold ml-1 text-[10px] uppercase">(competitor)</span> : null}
                                        </span>
                                      </div>
                                      {parsedDetails?.content && <div><span className="text-[#3B82F6] font-bold">content:</span> <span className="text-[#10B981] ml-2 break-all">{parsedDetails.content}</span></div>}
                                    </div>
                                  ) : activity === 'FILE' ? (
                                    <div className="space-y-1">
                                      <div><span className="text-[#3B82F6] font-bold">filename:</span> <span className="text-[#10B981] ml-2 break-all">{parsedDetails?.filename || evt.filename || 'Unknown'}</span></div>
                                      <div><span className="text-[#3B82F6] font-bold">extension:</span> <span className="text-[#10B981] ml-2 break-all">.{(parsedDetails?.filename || evt.filename || 'unknown.file').split('.').pop()}</span></div>
                                      {parsedDetails?.content && <div><span className="text-[#3B82F6] font-bold">content:</span> <span className="text-[#10B981] ml-2 break-all">{parsedDetails.content}</span></div>}
                                    </div>
                                  ) : parsedDetails ? (
                                    <div className="space-y-1">
                                      {Object.entries(parsedDetails).map(([k, v]) => (
                                        <div key={k}>
                                          <span className="text-[#3B82F6] font-bold">{k}:</span> 
                                          <span className="text-[#10B981] ml-2 break-all">{String(v)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <pre className="text-[#10B981] whitespace-pre-wrap">{JSON.stringify(evt, null, 2)}</pre>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
        </div>

        {/* 4. Historical Baseline Profiling */}
        <div className="mt-12 mb-12">
            <h3 className="text-foreground font-bold border-b border-border pb-2 mb-6 tracking-widest flex items-center gap-2">
                User Statistics
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Event Distribution Card */}
              <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                    <PieChart className="h-3 w-3 text-foreground" /> EVENT DISTRIBUTION
                  </h3>
                  <div className="text-4xl font-semibold text-foreground mb-1">
                    {stats.total_events.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-6">Total Baseline Events</p>
                </div>
                <div className="space-y-4">
                  {Object.entries(stats.event_distribution || {}).map(([type, count]) => {
                    const percentage = ((Number(count) / stats.total_events) * 100).toFixed(1);
                    return (
                      <div key={type} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">{type}</span>
                          <span className="text-xs font-mono text-muted-foreground">{count as React.ReactNode} ({percentage}%)</span>
                        </div>
                        <div className="w-full h-1 bg-background rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", type === 'http' ? 'bg-[#10B981]' : type === 'logon' ? 'bg-[#8B5CF6]' : type === 'email' ? 'bg-[#3B82F6]' : 'bg-[#F59E0B]')} 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Working Hours Card */}
              <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
                <div>
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Clock className="h-3 w-3 text-foreground" /> TEMPORAL HABITS
                  </h3>
                  <div className="text-4xl font-semibold text-[#F97316] mb-1">
                    {(stats.after_hours_pct || 0).toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-4">After-Hours Activity</p>
                </div>
              </div>


              {/* Web Traffic Card */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Globe className="h-3 w-3 text-[#3B82F6]" /> TOP HTTP DOMAINS
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.top_domains || {}).slice(0,5).map(([domain, count], idx) => (
                    <div key={domain} className="flex justify-between items-center p-2 rounded bg-background border border-border">
                      <span className="text-[11px] font-mono text-foreground truncate max-w-[200px]" title={domain}>{idx + 1}. {domain}</span>
                      <span className="text-[11px] font-bold text-foreground bg-foreground/10 px-2 py-0.5 rounded">{count as React.ReactNode}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Communications Card */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Mail className="h-3 w-3 text-[#8B5CF6]" /> TOP EMAIL CONTACTS
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.top_emails || {}).slice(0,5).map(([email, count]) => {
                    return (
                      <div key={email} className="flex justify-between items-center p-2 rounded bg-background border border-border">
                        <span className="text-[11px] font-medium text-foreground truncate max-w-[200px]" title={email}>{email}</span>
                        <span className="text-[11px] font-bold text-foreground bg-foreground/10 px-2 py-0.5 rounded">{count as React.ReactNode}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Row 2: File Usage, Device Footprint, Ocean */}
            <div className="grid grid-cols-1 lg:grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">FILE USAGE</h3>
                <div className="space-y-3">
                  {[
                    { ext: '.doc', count: 35 },
                    { ext: '.pdf', count: 11 },
                    { ext: '.txt', count: 4 },
                    { ext: '.jpg', count: 3 }
                  ].map((f) => (
                    <div key={f.ext} className="flex justify-between items-center">
                      <span className="text-xs font-mono text-foreground">{f.ext}</span>
                      <span className="text-xs font-bold text-foreground">{f.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center text-center">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 self-start">DEVICE FOOTPRINT</h3>
                <div className="text-4xl font-bold text-foreground mb-2">1</div>
                <div className="text-[10px] text-muted-foreground uppercase">UNIQUE WORKSTATIONS</div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">PSYCHOMETRIC (OCEAN)</h3>
                <div className="space-y-4">
                  {PSYCHOMETRIC_DATA.map(item => (
                    <div key={item.trait} className="flex items-center gap-3">
                      <div className="text-xs font-bold w-4 text-center text-foreground">{item.trait}</div>
                      <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.score}%` }} />
                      </div>
                      <div className="text-xs font-mono text-muted-foreground w-6 text-right">{item.score}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0D1117; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #30363D; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8B949E; 
        }
      `}</style>
    </div>
  );
}
