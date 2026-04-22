// Mock data for SOC Dashboard - Based on CERT v4.2 dataset patterns

export interface ThreatEvent {
  id: string;
  timestamp: string;
  userId: string;
  eventType: 'HTTP' | 'USB' | 'EMAIL' | 'FILE' | 'LOGON' | 'LOGOFF';
  pc: string;
  riskScore: number;
  isThreat: boolean;
  scenario?: 'S1' | 'S2' | 'S3';
  details?: string;
}

export interface FlaggedUser {
  userId: string;
  riskScore: number;
  scenario: 'S1' | 'S2' | 'S3';
  eventCount: number;
  lastActivity: string;
  department: string;
}

export interface UserActivity {
  userId: string;
  events: {
    timestamp: string;
    type: 'HTTP' | 'USB' | 'EMAIL' | 'FILE' | 'LOGON' | 'LOGOFF';
    riskContribution: number;
  }[];
  riskTrend: { time: string; score: number }[];
}

// Generate realistic timestamps
const generateTimestamp = (minutesAgo: number): string => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString().replace('T', ' ').slice(0, 19);
};

// Mock threat events - realistic enterprise activity
export const mockEvents: ThreatEvent[] = [
  { id: 'EVT001', timestamp: generateTimestamp(1), userId: 'ACM2278', eventType: 'HTTP', pc: 'PC-0512', riskScore: 0.94, isThreat: true, scenario: 'S1', details: 'Access to wikileaks.org' },
  { id: 'EVT002', timestamp: generateTimestamp(2), userId: 'BTR1893', eventType: 'LOGON', pc: 'PC-1234', riskScore: 0.12, isThreat: false },
  { id: 'EVT003', timestamp: generateTimestamp(3), userId: 'CWS0045', eventType: 'EMAIL', pc: 'PC-0891', riskScore: 0.08, isThreat: false },
  { id: 'EVT004', timestamp: generateTimestamp(4), userId: 'MBG2190', eventType: 'USB', pc: 'PC-2341', riskScore: 0.91, isThreat: true, scenario: 'S2', details: 'Large file transfer to USB' },
  { id: 'EVT005', timestamp: generateTimestamp(5), userId: 'DKL3421', eventType: 'FILE', pc: 'PC-0123', riskScore: 0.15, isThreat: false },
  { id: 'EVT006', timestamp: generateTimestamp(6), userId: 'PLR7821', eventType: 'HTTP', pc: 'PC-4521', riskScore: 0.22, isThreat: false },
  { id: 'EVT007', timestamp: generateTimestamp(7), userId: 'ACM2278', eventType: 'FILE', pc: 'PC-0512', riskScore: 0.89, isThreat: true, scenario: 'S1', details: 'Zip archive creation' },
  { id: 'EVT008', timestamp: generateTimestamp(8), userId: 'JNS5590', eventType: 'LOGOFF', pc: 'PC-7812', riskScore: 0.05, isThreat: false },
  { id: 'EVT009', timestamp: generateTimestamp(9), userId: 'RMT4421', eventType: 'EMAIL', pc: 'PC-3421', riskScore: 0.11, isThreat: false },
  { id: 'EVT010', timestamp: generateTimestamp(10), userId: 'HYL8834', eventType: 'HTTP', pc: 'PC-9012', riskScore: 0.18, isThreat: false },
  { id: 'EVT011', timestamp: generateTimestamp(11), userId: 'CBT0091', eventType: 'EMAIL', pc: 'PC-5612', riskScore: 0.87, isThreat: true, scenario: 'S3', details: 'Mass internal email' },
  { id: 'EVT012', timestamp: generateTimestamp(12), userId: 'WKR2234', eventType: 'LOGON', pc: 'PC-1890', riskScore: 0.09, isThreat: false },
  { id: 'EVT013', timestamp: generateTimestamp(13), userId: 'MNP7723', eventType: 'FILE', pc: 'PC-4523', riskScore: 0.14, isThreat: false },
  { id: 'EVT014', timestamp: generateTimestamp(14), userId: 'TSK9981', eventType: 'USB', pc: 'PC-2312', riskScore: 0.21, isThreat: false },
  { id: 'EVT015', timestamp: generateTimestamp(15), userId: 'ACM2278', eventType: 'HTTP', pc: 'PC-0512', riskScore: 0.92, isThreat: true, scenario: 'S1', details: 'Data upload detected' },
  { id: 'EVT016', timestamp: generateTimestamp(16), userId: 'BRT5543', eventType: 'EMAIL', pc: 'PC-8901', riskScore: 0.07, isThreat: false },
  { id: 'EVT017', timestamp: generateTimestamp(17), userId: 'LPK3321', eventType: 'LOGOFF', pc: 'PC-3456', riskScore: 0.04, isThreat: false },
  { id: 'EVT018', timestamp: generateTimestamp(18), userId: 'YHN6678', eventType: 'HTTP', pc: 'PC-7834', riskScore: 0.16, isThreat: false },
  { id: 'EVT019', timestamp: generateTimestamp(19), userId: 'MBG2190', eventType: 'FILE', pc: 'PC-2341', riskScore: 0.88, isThreat: true, scenario: 'S2', details: 'Sensitive file access' },
  { id: 'EVT020', timestamp: generateTimestamp(20), userId: 'QRS4456', eventType: 'LOGON', pc: 'PC-5678', riskScore: 0.06, isThreat: false },
];

// Flagged users with high risk scores
export const flaggedUsers: FlaggedUser[] = [
  { userId: 'ACM2278', riskScore: 0.9412, scenario: 'S1', eventCount: 47, lastActivity: generateTimestamp(1), department: 'Engineering' },
  { userId: 'MBG2190', riskScore: 0.9156, scenario: 'S2', eventCount: 23, lastActivity: generateTimestamp(4), department: 'Finance' },
  { userId: 'CBT0091', riskScore: 0.8744, scenario: 'S3', eventCount: 18, lastActivity: generateTimestamp(11), department: 'HR' },
];

// User behavior data for graph visualization
export const users = [
  'ACM2278', 'BTR1893', 'CWS0045', 'MBG2190', 'DKL3421', 
  'PLR7821', 'JNS5590', 'RMT4421', 'HYL8834', 'CBT0091',
  'WKR2234', 'MNP7723', 'TSK9981', 'BRT5543', 'LPK3321'
];

export const workstations = [
  'PC-0512', 'PC-1234', 'PC-0891', 'PC-2341', 'PC-0123',
  'PC-4521', 'PC-7812', 'PC-3421', 'PC-9012', 'PC-5612',
  'PC-1890', 'PC-4523', 'PC-2312', 'PC-8901', 'PC-3456'
];

export const connections: { source: string; target: string; type: ThreatEvent['eventType']; isThreat: boolean }[] = [
  { source: 'ACM2278', target: 'PC-0512', type: 'HTTP', isThreat: true },
  { source: 'BTR1893', target: 'PC-1234', type: 'LOGON', isThreat: false },
  { source: 'CWS0045', target: 'PC-0891', type: 'EMAIL', isThreat: false },
  { source: 'MBG2190', target: 'PC-2341', type: 'USB', isThreat: true },
  { source: 'DKL3421', target: 'PC-0123', type: 'FILE', isThreat: false },
  { source: 'PLR7821', target: 'PC-4521', type: 'HTTP', isThreat: false },
  { source: 'ACM2278', target: 'PC-0512', type: 'FILE', isThreat: true },
  { source: 'JNS5590', target: 'PC-7812', type: 'LOGOFF', isThreat: false },
  { source: 'RMT4421', target: 'PC-3421', type: 'EMAIL', isThreat: false },
  { source: 'HYL8834', target: 'PC-9012', type: 'HTTP', isThreat: false },
  { source: 'CBT0091', target: 'PC-5612', type: 'EMAIL', isThreat: true },
  { source: 'WKR2234', target: 'PC-1890', type: 'LOGON', isThreat: false },
  { source: 'MNP7723', target: 'PC-4523', type: 'FILE', isThreat: false },
  { source: 'TSK9981', target: 'PC-2312', type: 'USB', isThreat: false },
  { source: 'MBG2190', target: 'PC-2341', type: 'FILE', isThreat: true },
];

// User activity trajectory for selected user
export const getUserActivity = (userId: string): UserActivity => {
  const eventTypes: ThreatEvent['eventType'][] = ['HTTP', 'USB', 'EMAIL', 'FILE', 'LOGON', 'LOGOFF'];
  const events = Array.from({ length: 20 }, (_, i) => ({
    timestamp: generateTimestamp(i * 15),
    type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    riskContribution: userId === 'ACM2278' ? 0.3 + Math.random() * 0.6 : Math.random() * 0.3,
  }));

  const riskTrend = Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    score: userId === 'ACM2278' 
      ? 0.4 + Math.sin(i / 4) * 0.3 + Math.random() * 0.2
      : 0.1 + Math.random() * 0.2,
  }));

  return { userId, events, riskTrend };
};

// Model performance metrics
export const modelMetrics = {
  auprc: 0.9741,
  f1Score: 0.9298,
  precision: 0.9725,
  recall: 0.8908,
  accuracy: 0.9999,
};

// Confusion matrix
export const confusionMatrix = {
  tp: 53,
  fp: 2,
  fn: 7,
  tn: 4251959,
};

// Precision-Recall curve data
export const prCurveData = [
  { recall: 0.0, precision: 1.0 },
  { recall: 0.1, precision: 0.99 },
  { recall: 0.2, precision: 0.98 },
  { recall: 0.3, precision: 0.98 },
  { recall: 0.4, precision: 0.97 },
  { recall: 0.5, precision: 0.97 },
  { recall: 0.6, precision: 0.96 },
  { recall: 0.7, precision: 0.95 },
  { recall: 0.8, precision: 0.93 },
  { recall: 0.8908, precision: 0.9725 },
  { recall: 0.9, precision: 0.90 },
  { recall: 1.0, precision: 0.85 },
];

// Per-scenario recall
export const scenarioRecall = {
  S1: 0.8908,
  S2: 0.0,
  S3: 0.0,
};

// SHAP feature importance for explainability
export const shapFeatures = [
  { feature: 'is_exf_domain', contribution: 0.42, positive: true },
  { feature: 'after_working_hours', contribution: 0.28, positive: true },
  { feature: 'is_http', contribution: 0.18, positive: true },
  { feature: 'log_size', contribution: 0.15, positive: true },
  { feature: 'hour_sin', contribution: -0.08, positive: false },
  { feature: 'internal_emails_count', contribution: -0.05, positive: false },
  { feature: 'is_zip', contribution: 0.12, positive: true },
  { feature: 'is_keylogger', contribution: 0.09, positive: true },
];

// System stats
export const systemStats = {
  totalEventsProcessed: 17519784,
  activeAlerts: 3,
  usersMonitored: 4000,
  averageLatency: 12, // ms
};
