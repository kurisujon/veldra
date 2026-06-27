export type OCRResult = {
  success: boolean;
  engine: string;
  text: string;
  pages?: Array<{
    page: number;
    text: string;
    lines: Array<{
      text: string;
      confidence: number;
      box: number[][];
    }>;
  }>;
  error?: string;
};
