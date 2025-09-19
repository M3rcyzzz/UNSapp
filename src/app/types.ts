// UNS Export JSON Type Definitions
export interface UnsExportTopic {
  path: string;
  type?: string;
  estMps?: number;
  description?: string;
  template?: Record<string, unknown>;
}

export interface UnsExportData {
  version: string;
  topics: UnsExportTopic[];
}
