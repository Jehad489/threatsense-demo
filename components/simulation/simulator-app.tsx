'use client';

import { useState } from 'react';
import { X, Usb, Globe, File, Mail, Play, AlertTriangle } from 'lucide-react';

const JOB_BOARDS = [
  'careerbuilder.com', 'craigslist.org', 'indeed.com', 'job-hunt.org', 'jobhuntersbible.com',
  'linkedin.com', 'monster.com', 'simplyhired.com', 'aol.com/jobs', 'yahoo.com/hotjobs'
];

const COMPETITORS = [
  'boeing.com', 'harris.com', 'hp.com', 'lockheedmartin.com',
  'northropgrumman.com', 'raytheon.com'
];

type Tab = 'usb' | 'http' | 'file' | 'email';

export function SimulatorApp({ user, onClose, onSimulate }: { user: string; onClose: () => void, onSimulate?: (payload: any) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('http');

  // USB State
  const [usbConnected, setUsbConnected] = useState(false);

  // HTTP State
  const [customUrl, setCustomUrl] = useState('http://google.com/search');

  // File State
  const [fileExt, setFileExt] = useState('.doc');

  // Email State
  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailBcc, setEmailBcc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [hasAttachment, setHasAttachment] = useState(false);

  const handleSimulate = () => {
    // Generate the base CERT payload structure
    const payload: any = {
      id: `{SIM-${Math.random().toString(36).substring(2, 10).toUpperCase()}}`,
      date: new Date().toISOString(),
      user: user,
      pc: `PC-${Math.floor(Math.random() * 9000) + 1000}`,
      is_threat: false,
      after_working_hours: false, // Calculated dynamically in backend based on date
    };

    if (activeTab === 'usb') {
      payload.activity = usbConnected ? 'Disconnect' : 'Connect';
      payload.is_Connect = !usbConnected;
      payload.is_Disconnect = usbConnected;
      setUsbConnected(!usbConnected);
      
    } else if (activeTab === 'http') {
      const lowerUrl = customUrl.toLowerCase();
      
      const isJob = JOB_BOARDS.some(d => lowerUrl.includes(d));
      const isCompetitor = COMPETITORS.some(d => lowerUrl.includes(d));
      const isSus = lowerUrl.includes('wikileaks');

      payload.activity = 'Http';
      payload.is_http = true;
      payload.is_exf_domain = isSus;
      payload.is_keylogger = false; 
      payload.is_competitor_domain = isCompetitor;
      payload.is_job_search_domain = isJob;
      
      payload.activity_details = JSON.stringify({ url: customUrl });
      
    } else if (activeTab === 'file') {
      payload.activity = 'File';
      payload.is_file = true;
      payload.is_doc = fileExt === '.doc';
      payload.is_pdf = fileExt === '.pdf';
      payload.is_txt = fileExt === '.txt';
      payload.is_jpg = fileExt === '.jpg';
      payload.is_zip = fileExt === '.zip';
      payload.is_exe = fileExt === '.exe';
      payload.activity_details = JSON.stringify({ filename: `confidential_draft${fileExt}` });
      
    } else if (activeTab === 'email') {
      const allRecipientsStr = `${emailTo} ${emailCc} ${emailBcc}`.toLowerCase();
      
      // Split by commas, semicolons, or spaces to count properly
      const allRecipients = allRecipientsStr.split(/[,\s;]+/).filter(e => e.includes('@'));
      
      const internalCount = allRecipients.filter(e => e.endsWith('@dtaa.com')).length;
      const externalCount = allRecipients.filter(e => !e.endsWith('@dtaa.com')).length;
      
      const isCompetitor = COMPETITORS.some(d => allRecipientsStr.includes(d));
      const hasSupervisor = allRecipientsStr.includes('supervisor@dtaa.com');

      payload.activity = 'Email';
      payload.is_email = true;
      payload.has_attachments = hasAttachment;
      payload.contain_supervisor = hasSupervisor;
      payload.is_competitor_domain = isCompetitor;
      
      payload.internal_emails_count = internalCount;
      payload.external_emails_count = externalCount;
      
      payload.activity_details = JSON.stringify({ 
        to: emailTo, 
        cc: emailCc,
        bcc: emailBcc,
        from: `${user.toLowerCase()}@dtaa.com`, 
        subject: emailSubject,
        content: "Please review the attached confidential information regarding the new project.",
        attachment: hasAttachment ? 'attached_file.pdf' : '' 
      });
    }

    // Set high-risk flags automatically if certain combinations are met
    if (payload.is_exf_domain || payload.is_competitor_domain || (activeTab === 'email' && hasAttachment && payload.external_emails_count > 0)) {
      payload.is_threat = true;
    }

    // Output to the parent
    if (onSimulate) {
      onSimulate(payload);
    }
  };

  const isSimulateDisabled = () => {
    if (activeTab === 'email') {
      const hasRecipient = (emailTo + emailCc + emailBcc).trim().length > 0;
      return !hasRecipient;
    }
    if (activeTab === 'http') {
      return !customUrl.trim();
    }
    return false;
  };

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[480px] bg-[#1E1E1E] border border-gray-600 rounded-md shadow-2xl flex flex-col font-sans">
      
      {/* Title Bar */}
      <div className="h-8 bg-[#333333] flex items-center justify-between px-3 cursor-move rounded-t-md">
        <div className="flex items-center gap-2 text-white text-xs">
          <Play className="w-3 h-3 text-green-400" />
          <span>Real-Time Event Simulator</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-red-500 px-2 py-1 rounded-sm transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-40 bg-[#252526] border-r border-gray-700 flex flex-col py-2">
          <button 
            onClick={() => setActiveTab('http')}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${activeTab === 'http' ? 'bg-[#37373D] text-white border-l-2 border-blue-500' : 'text-gray-400 hover:bg-[#2A2D2E] hover:text-gray-200'}`}
          >
            <Globe className="w-4 h-4" /> Web (HTTP)
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${activeTab === 'email' ? 'bg-[#37373D] text-white border-l-2 border-blue-500' : 'text-gray-400 hover:bg-[#2A2D2E] hover:text-gray-200'}`}
          >
            <Mail className="w-4 h-4" /> Email
          </button>
          <button 
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${activeTab === 'file' ? 'bg-[#37373D] text-white border-l-2 border-blue-500' : 'text-gray-400 hover:bg-[#2A2D2E] hover:text-gray-200'}`}
          >
            <File className="w-4 h-4" /> File System
          </button>
          <button 
            onClick={() => setActiveTab('usb')}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${activeTab === 'usb' ? 'bg-[#37373D] text-white border-l-2 border-blue-500' : 'text-gray-400 hover:bg-[#2A2D2E] hover:text-gray-200'}`}
          >
            <Usb className="w-4 h-4" /> Devices (USB)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#1E1E1E] p-4 flex flex-col">
          <div className="flex-1">
            
            {activeTab === 'http' && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-white text-sm font-semibold mb-4">Simulate HTTP Request</h3>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Target URL</label>
                  <input 
                    type="text" 
                    value={customUrl} 
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="e.g. http://google.com"
                    className="w-full bg-[#3C3C3C] text-white border border-gray-600 rounded px-2 py-1.5 text-sm outline-none"
                  />
                </div>
                
                
              </div>
            )}

            {activeTab === 'email' && (
              <div className="flex flex-col h-full bg-white rounded shadow overflow-hidden animate-in fade-in">
                <div className="bg-[#F3F2F1] p-2 border-b border-gray-300 flex items-center justify-between">
                  <h3 className="text-gray-700 font-semibold text-xs ml-2">New Message</h3>
                </div>
                
                <div className="flex-1 flex flex-col p-4 gap-2 text-sm">
                  {/* To Field */}
                  <div className="flex border-b border-gray-200 pb-1 items-center">
                    <span className="text-gray-500 w-12 font-medium">To</span>
                    <input 
                      type="email" 
                      multiple
                      list="email-options"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="e.g. coworker@dtaa.com"
                      className="flex-1 outline-none text-gray-800 bg-transparent placeholder-gray-400"
                    />
                  </div>
                  
                  {/* CC Field */}
                  <div className="flex border-b border-gray-200 pb-1 items-center">
                    <span className="text-gray-500 w-12 font-medium">Cc</span>
                    <input 
                      type="email" 
                      multiple
                      list="email-options"
                      value={emailCc}
                      onChange={(e) => setEmailCc(e.target.value)}
                      placeholder="e.g. supervisor@dtaa.com, team@dtaa.com"
                      className="flex-1 outline-none text-gray-800 bg-transparent placeholder-gray-400"
                    />
                  </div>

                  {/* BCC Field */}
                  <div className="flex border-b border-gray-200 pb-1 items-center">
                    <span className="text-gray-500 w-12 font-medium">Bcc</span>
                    <input 
                      type="email" 
                      multiple
                      list="email-options"
                      value={emailBcc}
                      onChange={(e) => setEmailBcc(e.target.value)}
                      placeholder="e.g. personal@gmail.com"
                      className="flex-1 outline-none text-gray-800 bg-transparent placeholder-gray-400"
                    />
                  </div>

                  

                  {/* Attachment Toggle */}
                  <div className="flex items-center gap-2 mt-2 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer border px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={hasAttachment} 
                        onChange={(e) => setHasAttachment(e.target.checked)} 
                        className="rounded"
                      />
                      <span className="text-gray-700 text-xs font-medium">📎 Attach File</span>
                    </label>
                  </div>

                  {/* Datalist for suggestions */}
                  <datalist id="email-options">
                    <option value="coworker@dtaa.com">Internal Colleague</option>
                    <option value="supervisor@dtaa.com">Direct Supervisor</option>
                    <option value="hr@dtaa.com">Human Resources</option>
                    <option value="it-support@dtaa.com">IT Support</option>
                    <option value="marketing@dtaa.com">Marketing Department</option>
                    <option value="recruiter@boeing.com">Competitor Domain (Boeing)</option>
                    <option value="careers@lockheedmartin.com">Competitor Domain (Lockheed)</option>
                    <option value="personal@gmail.com">External Personal Email</option>
                    <option value="contact@yahoo.com">External Contact</option>
                    <option value="vendor@outlook.com">External Vendor</option>
                  </datalist>
                </div>
              </div>
            )}

            {activeTab === 'file' && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-white text-sm font-semibold mb-4">Simulate File System Activity</h3>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">File Extension</label>
                  <select 
                    value={fileExt} 
                    onChange={(e) => setFileExt(e.target.value)}
                    className="w-full bg-[#3C3C3C] text-white border border-gray-600 rounded px-2 py-1.5 text-sm outline-none"
                  >
                    <option value=".doc">.doc</option>
                    <option value=".pdf">.pdf</option>
                    <option value=".txt">.txt</option>
                    <option value=".jpg">.jpg</option>
                    <option value=".zip">.zip (is_zip)</option>
                    <option value=".exe">.exe (is_exe)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'usb' && (
              <div className="space-y-4 animate-in fade-in flex flex-col items-center justify-center h-full pt-4">
                <Usb className={`w-16 h-16 ${usbConnected ? 'text-green-400' : 'text-gray-500'} mb-4`} />
                <p className="text-white text-sm font-medium mb-1">
                  Status: {usbConnected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-gray-400 text-xs mb-6 text-center max-w-xs">
                  {usbConnected ? 'A USB mass storage device is currently mounted.' : 'No removable media detected.'}
                </p>
                <button 
                  onClick={handleSimulate}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${usbConnected ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                  {usbConnected ? 'Trigger Disconnect Event' : 'Trigger Connect Event'}
                </button>
              </div>
            )}

          </div>

          {/* Action Footer */}
          {activeTab !== 'usb' && (
            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
              <button 
                onClick={handleSimulate}
                disabled={isSimulateDisabled()}
                className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors ${
                  isSimulateDisabled() 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Play className="w-4 h-4" /> Simulate Event
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
