export interface PiiDetectionResult {
  entityType: string;
  label: string;
  originalText: string;
  replacedText: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  validationStatus: 'valid' | 'invalid' | 'warning';
  validationMessage?: string;
}

export type MaskingMode = 'placeholder' | 'mask' | 'hash' | 'synthetic';

export interface AuditIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  location: string;
  originalCodeSnippet: string;
  issueAnalysis: string;
  consequence: string;
  fixedSolution: string;
  tags: string[];
}

export interface PresetSample {
  id: string;
  name: string;
  fileType: 'docx' | 'xlsx' | 'pdf';
  description: string;
  content: string;
}

export interface CustomRegexRule {
  id: string;
  name: string;
  entityType: string;
  pattern: string;
  flags?: string;
  enabled: boolean;
  score: number;
  description?: string;
  exampleMatch?: string;
}
