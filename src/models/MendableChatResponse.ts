export interface MendableChatResponse {
  answer: Answer;
  sources: Source[];
  message_id: number;
  confidence_score: number;
  tools_used: null;
}

export interface Source {
  content: string;
  dataId: string;
  dateAdded: string;
  dateModified: null;
  id: number;
  link: string;
  location: string;
  manualAdd: boolean;
  metadata: Metadata;
  source: string;
  sourceName: null;
  text: string;
  relevance_score: number;
}

export interface Metadata {}

export interface Answer {
  text: string;
}
