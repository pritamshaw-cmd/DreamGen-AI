
export type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
export type Resolution = '1K' | '2K' | '4K';
export type GenerationMode = 'text-to-image' | 'image-to-image' | 'inpainting' | 'outpainting';

export interface StylePreset {
  id: string;
  name: string;
  promptSuffix: string;
  previewUrl: string;
}

export interface FeaturedPrompt {
  id: string;
  title: string;
  prompt: string;
  style: string;
  aspectRatio: AspectRatio;
  previewUrl: string;
}

export interface GenerationSettings {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  style: string;
  mood: string;
  lighting: string;
  colorTone: string;
  negativePrompt: string;
  seed: number | null;
  numImages: number;
  useProModel: boolean;
  diverseAngles: boolean;
  useSearch?: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  settings: GenerationSettings;
  originalImage?: string;
}
