
export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  originalIndex: number;
  base64: string; // For saving state
}

export interface ImageTransform {
  pan: Point;
  zoom: number;
  rotation: number;
}

export const layouts = [
    'grid', 'masonry', 'rows', 'columns', 'random', 
    'polaroid', 'filmstrip', 'geometric', 'heart', 'circlepack', 
    'honeycomb', 'spiral'
] as const;
export type CollageLayout = typeof layouts[number];

export const aspectRatios = ['free', '1:1', '4:3', '16:9', '3:4', '9:16'] as const;
export type AspectRatio = typeof aspectRatios[number];

export const exportFormats = ['png', 'jpeg'] as const;
export type ExportFormat = typeof exportFormats[number];

export interface CollageState {
  images: {
    name: string;
    type: string;
    base64: string;
    width: number;
    height: number;
  }[];
  imageTransforms: ImageTransform[];
  layout: CollageLayout;
  backgroundColor: string;
  spacing: number;
  cornerRadius: number;
  aspectRatio: AspectRatio;
  exportFormat: ExportFormat;
  jpgQuality: number;
  outputResolution?: OutputResolution;
  customWidth?: number;
  customHeight?: number;
}

export interface Point {
  x: number;
  y: number;
}

export type OutputResolution = '2000px' | '3000px' | '4096px' | 'a4' | 'custom';
