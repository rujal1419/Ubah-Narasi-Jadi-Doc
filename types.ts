export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GeneratedDocument {
  htmlContent: string;
}

export interface FileData {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export type DocumentFormat = 'pdf' | 'doc';

export type PaperSize = 'A4' | 'Letter' | 'A3' | 'A5' | 'Legal';