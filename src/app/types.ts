// UNS Export JSON 类型定义
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
