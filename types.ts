
export enum AppState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ANALYZING = 'ANALYZING',
  ERROR = 'ERROR'
}

export interface Transcription {
  text: string;
  sender: 'user' | 'assistant';
  timestamp: number;
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string };
}
