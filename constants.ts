
import { StylePreset, FeaturedPrompt } from './types';

export const STYLE_PRESETS: StylePreset[] = [
  { id: 'none', name: 'None', promptSuffix: '', previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop' },
  { id: 'photo', name: 'Realistic Photo', promptSuffix: 'highly detailed, 8k, photorealistic, professional photography, sharp focus, f/1.8', previewUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&h=200&fit=crop' },
  { id: 'anime', name: 'Anime', promptSuffix: 'stylized anime art, vibrant colors, clean lineart, digital illustration, cel shaded', previewUrl: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=200&h=200&fit=crop' },
  { id: 'cinematic', name: 'Cinematic', promptSuffix: 'epic cinematic shot, movie still, dramatic lighting, volumetric fog, anamorphic', previewUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=200&fit=crop' },
  { id: '3d', name: '3D Render', promptSuffix: 'unreal engine 5, octane render, raytraced, 4k, hyper-detailed, masterpiece', previewUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200&h=200&fit=crop' },
  { id: 'oil', name: 'Oil Painting', promptSuffix: 'thick brush strokes, impasto technique, canvas texture, classical art style', previewUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&h=200&fit=crop' },
  { id: 'watercolor', name: 'Watercolor', promptSuffix: 'soft watercolor bleeds, elegant paint splashes, traditional paper texture', previewUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&h=200&fit=crop' },
  { id: 'cyberpunk', name: 'Cyberpunk', promptSuffix: 'neon lights, futuristic technology, rainy night street, gritty atmosphere', previewUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=200&h=200&fit=crop' },
];

export const FEATURED_PROMPTS: FeaturedPrompt[] = [
  {
    id: 'warrior-1',
    title: 'Futuristic Warrior',
    prompt: 'Create a highly detailed cinematic character portrait of a young futuristic warrior. The character has sharp facial features, expressive eyes, and a confident yet calm expression. Wearing advanced sci-fi armor with subtle glowing accents, realistic textures, and fine details. Soft dramatic lighting with a shallow depth of field, ultra-realistic skin texture, high resolution, 8K quality, professional concept art style. Background is blurred with a futuristic city atmosphere, neon lights, and soft fog. Photorealistic, sharp focus, masterpiece quality.',
    style: 'cinematic',
    aspectRatio: '16:9',
    previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop'
  },
  {
    id: 'space-explorer',
    title: 'Interstellar Voyager',
    prompt: 'Astronaut walking on a crystal planet surface, nebulae in the sky, giant moons, bioluminescent flora, cinematic composition, cosmic colors.',
    style: '3d',
    aspectRatio: '16:9',
    previewUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=400&fit=crop'
  },
  {
    id: 'cyber-samurai',
    title: 'Cyber Samurai',
    prompt: 'A ronin samurai standing in the middle of a neon-drenched Tokyo street, rain falling, katana glowing with blue energy, reflections on puddles.',
    style: 'cyberpunk',
    aspectRatio: '9:16',
    previewUrl: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?w=600&h=1000&fit=crop'
  }
];

export const MOODS = ['Default', 'Vibrant', 'Dark', 'Soft', 'Dramatic', 'Ethereal', 'Gritty', 'Surreal'];
export const LIGHTING = ['Default', 'Studio', 'Natural', 'Sunset', 'Neon', 'God Rays', 'Muted', 'Backlit'];
export const COLOR_TONES = ['Default', 'Warm', 'Cool', 'Pastel', 'Monochrome', 'Vintage', 'High Saturation'];

export const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' as const },
  { label: '4:3', value: '4:3' as const },
  { label: '3:4', value: '3:4' as const },
  { label: '16:9', value: '16:9' as const },
  { label: '9:16', value: '9:16' as const },
];

export const RESOLUTIONS = ['1K', '2K', '4K'] as const;
