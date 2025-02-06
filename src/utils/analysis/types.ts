export interface ComponentAnalysis {
  complexity: string;
  performance: string;
  bestPractices: string;
  improvements: string[];
}

export interface AnalysisComponent {
  name: string;
  code: string;
}