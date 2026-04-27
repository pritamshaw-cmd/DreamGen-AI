
import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, GenerationMode } from "./types";
import { STYLE_PRESETS } from "./constants";

const CAMERA_ANGLES = [
  "Extreme close-up shot, macro detail, shallow depth of field",
  "Wide angle landscape shot, showing full environment, expansive view",
  "Low angle heroic shot, looking up at the subject, powerful perspective",
  "Bird's eye view, top-down perspective, high altitude looking down",
  "Side profile shot, dramatic rim lighting, silhouette focus",
  "Dutch angle, tilted horizon, dynamic and cinematic composition"
];

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const enhancePrompt = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Improve the following image generation prompt to be more descriptive, artistic, and effective. Provide ONLY the enhanced prompt text: "${prompt}"`,
    });
    return response.text || prompt;
  } catch (error) {
    console.error("Prompt enhancement failed:", error);
    return prompt;
  }
};

export const translatePrompt = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following prompt to English if it is in another language. If it is already in English, return it exactly as is. Output ONLY the translated prompt: "${prompt}"`,
    });
    return response.text || prompt;
  } catch (error) {
    return prompt;
  }
};

export const generateImage = async (
  prompt: string,
  settings: GenerationSettings,
  mode: GenerationMode = 'text-to-image',
  baseImage?: string,
  maskImage?: string
): Promise<string[]> => {
  const modelName = settings.useProModel ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const images: string[] = [];

  for (let i = 0; i < settings.numImages; i++) {
    const ai = getAiClient();
    
    // Determine the camera angle for this specific iteration
    const angleSuffix = settings.diverseAngles ? CAMERA_ANGLES[i % CAMERA_ANGLES.length] : "";

    const stylePreset = STYLE_PRESETS.find(s => s.id === settings.style);
    const fullPrompt = [
      prompt,
      angleSuffix,
      stylePreset?.promptSuffix,
      settings.mood !== 'Default' ? `${settings.mood} mood` : '',
      settings.lighting !== 'Default' ? `${settings.lighting} lighting` : '',
      settings.colorTone !== 'Default' ? `${settings.colorTone} color tone` : '',
      settings.negativePrompt ? `Exclude: ${settings.negativePrompt}` : '',
    ].filter(Boolean).join(', ');

    const parts: any[] = [{ text: fullPrompt }];

    if (baseImage && (mode === 'image-to-image' || mode === 'inpainting' || mode === 'outpainting')) {
      const mimeType = baseImage.split(';')[0].split(':')[1];
      const data = baseImage.split(',')[1];
      parts.unshift({
        inlineData: { data, mimeType }
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: settings.aspectRatio,
            ...(settings.useProModel ? { imageSize: settings.resolution } : {}),
          }
        }
      });

      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            images.push(`data:image/png;base64,${part.inlineData.data}`);
          }
        }
      }
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
         throw new Error("The selected API key is invalid or lacks required permissions. Please select a valid key.");
      }
      throw error;
    }
  }

  if (images.length === 0) throw new Error("No image data returned from API.");
  return images;
};
