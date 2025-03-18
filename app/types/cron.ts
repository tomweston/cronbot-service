export interface CronHistoryEntry {
  id: string;
  timestamp: string;
  prompt: string;
  expression: string;
  isNonsensical: boolean;
  responseMessage?: string;
  comment?: string;
  userAgent?: string;
  clientTimezone?: string;
  language?: string;
  platform?: string;
}
