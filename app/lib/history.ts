import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { CronHistoryEntry } from '../types/cron';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'cron-history.json');

// Ensure the data directory exists
const ensureDataDir = () => {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Initialize history file if it doesn't exist
const initHistoryFile = () => {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
  }
};

export const saveToHistory = async (entry: Omit<CronHistoryEntry, 'id' | 'timestamp'>) => {
  initHistoryFile();
  
  const history = await loadHistory();
  const newEntry: CronHistoryEntry = {
    ...entry,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  };
  
  history.unshift(newEntry); // Add new entries at the start
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  
  return newEntry;
};

export const loadHistory = async (): Promise<CronHistoryEntry[]> => {
  initHistoryFile();
  
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
};
