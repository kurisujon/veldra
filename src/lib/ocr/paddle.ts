import { OCRResult } from './types';

const PADDLE_OCR_URL = process.env.PADDLE_OCR_URL || 'http://localhost:8000/ocr';

export async function ocrWithPaddle(buffer: Buffer, mimeType: string, fileName: string = 'document'): Promise<OCRResult> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  formData.append('file', blob, fileName);

  try {
    const response = await fetch(PADDLE_OCR_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OCR Service Error: ${response.status} - ${text}`);
    }

    const result = await response.json();
    return result as OCRResult;
  } catch (error: any) {
    console.error('PaddleOCR Error:', error);
    return {
      success: false,
      engine: 'paddleocr',
      text: '',
      error: error.message
    };
  }
}
