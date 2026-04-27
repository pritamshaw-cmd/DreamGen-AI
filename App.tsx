
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  Trash2, 
  AlertCircle,
  Menu,
  X,
  Star,
  ExternalLink,
  Zap,
  Wand2,
  Camera,
  Layers,
  Settings2,
  Sliders,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Maximize
} from 'lucide-react';
import { 
  GeneratedImage, 
  GenerationSettings, 
  GenerationMode,
  AspectRatio
} from './types';
import { 
  STYLE_PRESETS, 
  ASPECT_RATIOS, 
  FEATURED_PROMPTS,
  MOODS,
  LIGHTING,
  COLOR_TONES
} from './constants';
import { generateImage, enhancePrompt, translatePrompt } from './geminiService';

const DB_NAME = 'DreamGenDB';
const STORE_NAME = 'images';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveImagesToDB = async (images: GeneratedImage[]) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    images.forEach(img => store.put(img));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("DB Save Error:", err);
  }
};

const getImagesFromDB = async (): Promise<GeneratedImage[]> => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    return [];
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const [prompt, setPrompt] = useState('');
  const [settings, setSettings] = useState<GenerationSettings>({
    aspectRatio: '1:1',
    resolution: '1K',
    style: 'none',
    mood: 'Default',
    lighting: 'Default',
    colorTone: 'Default',
    negativePrompt: '',
    seed: null,
    numImages: 1,
    useProModel: false,
    diverseAngles: false
  });

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentResult, setCurrentResult] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getImagesFromDB().then(setGeneratedImages);
  }, []);

  const handleGenerate = async () => {
    const baseSource = editingImage || uploadedImage;
    if (!prompt.trim() && !baseSource) {
      setError("Please describe what you want to create.");
      return;
    }

    const aistudio = (window as any).aistudio;
    if (settings.useProModel && aistudio) {
      try {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) await aistudio.openSelectKey();
      } catch (e) {}
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentMode: GenerationMode = editingImage ? 'image-to-image' : (uploadedImage ? 'image-to-image' : 'text-to-image');
      const translated = await translatePrompt(prompt);
      const results = await generateImage(translated, settings, currentMode, baseSource || undefined);
      
      setCurrentResult(results);
      
      const newItems: GeneratedImage[] = results.map(url => ({
        id: Math.random().toString(36).substr(2, 9),
        url,
        prompt,
        timestamp: Date.now(),
        settings: { ...settings },
        originalImage: baseSource || undefined
      }));

      setGeneratedImages(prev => [...newItems, ...prev]);
      await saveImagesToDB(newItems);
      setEditingImage(null);
    } catch (err: any) {
      setError(err.message || "Generation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRefine = (imageUrl: string) => {
    setEditingImage(imageUrl);
    setUploadedImage(null);
    setPrompt('');
    setActiveTab('generate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => promptRef.current?.focus(), 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setEditingImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const SectionLabel = ({ title }: { title: string }) => (
    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{title}</h3>
  );

  const getRatioIcon = (ratio: AspectRatio) => {
    switch(ratio) {
      case '1:1': return <Square className="w-4 h-4" />;
      case '16:9': return <RectangleHorizontal className="w-5 h-3" />;
      case '9:16': return <RectangleVertical className="w-3 h-5" />;
      case '4:3': return <RectangleHorizontal className="w-4 h-3.5" />;
      case '3:4': return <RectangleVertical className="w-3.5 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  // Modern CSS Aspect Ratio Calculation
  const getAspectRatioStyle = (ratio: AspectRatio) => {
    return { aspectRatio: ratio.replace(':', ' / ') };
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f1d] text-slate-200">
      {/* Main Workspace (Left) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-gradient-to-br from-[#0a0f1d] via-[#0d111a] to-[#05070a] relative">
        <header className="p-4 lg:p-6 flex items-center justify-between border-b border-white/5 bg-[#0a0f1d]/90 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline">DreamGen AI</span>
            <nav className="flex gap-6 ml-4">
              <button onClick={() => setActiveTab('generate')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'generate' ? 'text-blue-500 border-b-2 border-blue-500 pb-1' : 'text-slate-500'}`}>Studio</button>
              <button onClick={() => setActiveTab('gallery')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gallery' ? 'text-blue-500 border-b-2 border-blue-500 pb-1' : 'text-slate-500'}`}>Vault</button>
            </nav>
          </div>
          <button className="lg:hidden p-2 text-slate-400 bg-slate-900 rounded-lg border border-white/5" onClick={() => setIsPanelOpen(!isPanelOpen)}>
            <Sliders className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 p-4 lg:p-10 max-w-6xl mx-auto w-full space-y-8 pb-24">
          {activeTab === 'generate' ? (
            <>
              {/* Prompt Section */}
              <div className="space-y-4">
                {(editingImage || uploadedImage) && (
                  <div className="flex items-center gap-4 p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl animate-in slide-in-from-top duration-500">
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-blue-600/30 shadow-lg bg-slate-800">
                      <img src={(editingImage || uploadedImage)!} className="w-full h-full object-cover" alt="Source" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 leading-none mb-1">{editingImage ? 'Image Refinement' : 'Reference View'}</p>
                      <p className="text-[11px] text-slate-400 italic">Modify this perspective or add detail.</p>
                    </div>
                    <button onClick={() => {setEditingImage(null); setUploadedImage(null);}} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                <div className="relative group">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${editingImage ? 'from-purple-600/20 to-pink-600/20' : 'from-blue-600/20 to-purple-600/20'} rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-40 transition-all duration-1000`}></div>
                  <textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={editingImage ? "What perspective or detail should change?" : "A defiant angel with obsidian wings, standing atop a floating ruin, dramatic lightning, 8k..."}
                    className="relative w-full h-36 bg-slate-900/60 border-2 border-white/5 rounded-[2rem] p-8 text-lg focus:border-blue-500/30 outline-none resize-none transition-all placeholder:text-slate-800 font-medium tracking-tight leading-relaxed no-scrollbar"
                  />
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={handleEnhancePrompt} 
                      disabled={isLoading || !prompt}
                      title="Magic Enhance"
                      className="p-3 bg-slate-800/80 backdrop-blur rounded-xl text-blue-400 hover:text-white transition-all border border-white/5 shadow-lg active:scale-95 disabled:opacity-30"
                    >
                      <Wand2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Primary Generate Button - Prominent Full Width below Prompt */}
                <button 
                  onClick={handleGenerate} 
                  disabled={isLoading} 
                  className={`w-full group relative overflow-hidden flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-[0.98] ${editingImage ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  {isLoading ? <RefreshCw className="animate-spin w-5 h-5" /> : (editingImage ? <Wand2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />)}
                  <span>{isLoading ? 'Synthesizing...' : 'Ignite Creation'}</span>
                </button>
              </div>

              {/* Viewport Area - FORCED ASPECT RATIO CONTAINER */}
              <div className="min-h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] p-6 lg:p-10 relative bg-slate-900/5 overflow-hidden">
                {error && (
                  <div className="max-w-xl w-full p-6 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start gap-5 animate-in zoom-in duration-300">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                    <div className="space-y-1">
                      <h4 className="font-black uppercase tracking-widest text-red-400 text-[10px]">Error Detected</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
                      <button onClick={() => setError(null)} className="px-3 py-1 bg-slate-800 rounded text-[9px] font-black uppercase text-white mt-2">Dismiss</button>
                    </div>
                  </div>
                )}

                {isLoading && currentResult.length === 0 && (
                  <div className="text-center space-y-6">
                    <div className="relative">
                       <div className="w-20 h-20 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto shadow-2xl shadow-blue-500/20" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                       </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black uppercase tracking-[0.3em] text-white">Visualizing</h3>
                      <p className="text-slate-500 text-[9px] font-black animate-pulse uppercase tracking-widest">Constructing Masterpiece...</p>
                    </div>
                  </div>
                )}

                {currentResult.length > 0 && (
                  <div className="w-full">
                    {/* The Grid adapts to the number of results, and items force the selected ratio via inline style */}
                    <div className={`grid gap-6 ${currentResult.length > 4 ? 'grid-cols-2 lg:grid-cols-3' : currentResult.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {currentResult.map((url, idx) => (
                        <div 
                          key={idx} 
                          style={getAspectRatioStyle(settings.aspectRatio)}
                          className="group relative rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-slate-900/20 animate-in fade-in duration-700 w-full"
                        >
                          <img 
                            src={url} 
                            alt="Result" 
                            className={`w-full h-full object-cover transition-all duration-1000 ${isLoading ? 'blur-2xl opacity-40 scale-105' : 'hover:scale-105'}`} 
                          />
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-5 backdrop-blur-md">
                            <button title="Refine this shot" onClick={() => handleStartRefine(url)} className="p-4 bg-purple-600 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all"><Wand2 className="w-5 h-5" /></button>
                            <button title="Download High Res" onClick={() => { const a = document.createElement('a'); a.href = url; a.download = 'dreamgen.png'; a.click(); }} className="p-4 bg-blue-600 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all"><Download className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isLoading && currentResult.length === 0 && !error && (
                  <div className="text-center space-y-4 opacity-5 pointer-events-none select-none">
                    <Maximize className="w-16 h-16 mx-auto" />
                    <p className="font-black uppercase tracking-[0.4em] text-[10px]">Vault Waiting for Input</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Vault Grid - Uses square thumbnails for consistent gallery display */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
              {generatedImages.length === 0 ? (
                <div className="col-span-full py-40 text-center opacity-20">
                  <Layers className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">History is Empty</p>
                </div>
              ) : (
                generatedImages.map(img => (
                  <div key={img.id} className="group relative aspect-square rounded-[2rem] overflow-hidden border border-white/5 bg-slate-900 shadow-xl">
                    <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Saved" />
                    <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-all p-5 flex flex-col justify-center gap-2 backdrop-blur-sm">
                       <button onClick={() => handleStartRefine(img.url)} className="w-full py-3 bg-purple-600 text-white text-[10px] font-black uppercase rounded-xl">Edit View</button>
                       <button onClick={() => {setPrompt(img.prompt); setActiveTab('generate')}} className="w-full py-3 bg-white/5 text-slate-300 text-[10px] font-black uppercase rounded-xl border border-white/5 hover:bg-white/10">Use Prompt</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Control Panel (Right Corner) */}
      <aside className={`fixed lg:relative inset-y-0 right-0 z-40 w-80 glass-panel border-l border-white/5 transition-transform duration-300 lg:translate-x-0 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto no-scrollbar pb-16">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
               <Settings2 className="w-4 h-4 text-blue-500" />
               <h2 className="text-[11px] font-black uppercase tracking-widest text-white">Studio Engine</h2>
            </div>
            <button className="lg:hidden p-1 text-slate-500" onClick={() => setIsPanelOpen(false)}><X className="w-5 h-5" /></button>
          </div>

          {/* Model Toggle */}
          <section className="space-y-3">
            <SectionLabel title="AI Processor" />
            <div className="grid grid-cols-2 gap-2">
               <button onClick={() => setSettings({...settings, useProModel: false})} className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all ${!settings.useProModel ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'}`}>
                 <Zap className="w-4 h-4" />
                 <span className="text-[9px] font-black uppercase">Standard</span>
               </button>
               <button onClick={() => setSettings({...settings, useProModel: true})} className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all ${settings.useProModel ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'}`}>
                 <Star className="w-4 h-4" />
                 <span className="text-[9px] font-black uppercase">Master Pro</span>
               </button>
            </div>
          </section>

          {/* Canvas Size - ASPECT RATIO SCALE */}
          <section className="space-y-3">
            <SectionLabel title="Aspect Ratio Scale" />
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map((r) => (
                <button 
                  key={r.value} 
                  onClick={() => setSettings({ ...settings, aspectRatio: r.value })} 
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black border transition-all ${settings.aspectRatio === r.value ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white hover:border-white/10'}`}
                >
                  <div className="opacity-70">{getRatioIcon(r.value)}</div>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Batch Settings */}
          <section className="space-y-3">
            <SectionLabel title="Batch & Perspective" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 4, 6].map(num => (
                <button 
                  key={num} 
                  onClick={() => setSettings({...settings, numImages: num})}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${settings.numImages === num ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'}`}
                >
                  {num}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setSettings({...settings, diverseAngles: !settings.diverseAngles})}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.diverseAngles ? 'bg-orange-600/20 border-orange-500 text-orange-100' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'}`}
            >
              <div className="flex items-center gap-3">
                <Camera className="w-4 h-4" />
                <div className="text-left">
                  <span className="block text-[10px] font-black uppercase tracking-tight">Angle Burst</span>
                  <span className="block text-[8px] opacity-60 font-bold">Diverse Views</span>
                </div>
              </div>
              <div className={`w-7 h-3.5 rounded-full relative transition-colors ${settings.diverseAngles ? 'bg-orange-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${settings.diverseAngles ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </button>
          </section>

          {/* Style Presets */}
          <section className="space-y-3">
            <SectionLabel title="Artistic Aesthetic" />
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto no-scrollbar pr-1">
              {STYLE_PRESETS.map((s) => (
                <button key={s.id} onClick={() => setSettings({ ...settings, style: s.id })} className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${settings.style === s.id ? 'border-blue-500' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                  <img src={s.previewUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={s.name} />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 backdrop-blur-[0.5px]">
                    <span className="text-[8px] font-black uppercase text-center text-white drop-shadow-md">{s.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Environmental Controls */}
          <section className="space-y-4">
            <SectionLabel title="Scene Atmosphere" />
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-600 uppercase block ml-1">Vibe / Mood</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {MOODS.map(m => (
                    <button key={m} onClick={() => setSettings({...settings, mood: m})} className={`py-2 px-2 rounded-lg text-[9px] font-bold border transition-all truncate ${settings.mood === m ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-600 uppercase block ml-1">Illumination</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {LIGHTING.map(l => (
                    <button key={l} onClick={() => setSettings({...settings, lighting: l})} className={`py-2 px-2 rounded-lg text-[9px] font-bold border transition-all truncate ${settings.lighting === l ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300'}`}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Reference Actions */}
          <section className="space-y-3">
             <SectionLabel title="Visual Guidance" />
             <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all text-slate-400 hover:text-white group">
                  <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" /> Reference Image
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
             </div>
          </section>
        </div>
      </aside>
    </div>
  );
};

export default App;
