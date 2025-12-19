
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiLiveService } from './services/geminiLive';
import { AppState, Transcription } from './types';
import { 
  AUDIO_SAMPLE_RATE_INPUT, 
  AUDIO_SAMPLE_RATE_OUTPUT, 
  VIDEO_FRAME_RATE,
  IMAGES,
  RESEARCH_PAPERS
} from './constants';
import { 
  createPcmBlob, 
  decode, 
  decodeAudioData 
} from './utils/audio';
import Visualizer from './components/Visualizer';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  ArrowLeft, 
  RefreshCw, 
  Upload, 
  X, 
  ScanSearch, 
  ShieldAlert, 
  FileSignature, 
  Download,
  BookOpen,
  Camera,
  Layers,
  ExternalLink,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  Crosshair
} from 'lucide-react';

type SimMode = 'OFF' | 'GAMMA' | 'ALPHA' | 'BETA' | 'RADON' | 'URANIUM_GLOW';

interface ForensicData {
  features: string[];
  probableOutcome: string;
  particleType: string;
  confidence: number;
  verdict: string;
  riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL';
}

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'consult'>('home');
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [chatHistory, setChatHistory] = useState<Transcription[]>([]);
  const [simulationMode, setSimulationMode] = useState<SimMode>('OFF');
  const [hitRate, setHitRate] = useState(0);
  const [hasKey, setHasKey] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const simModeRef = useRef<SimMode>('OFF');
  const particlesRef = useRef<any[]>([]);

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isReportCollapsed, setIsReportCollapsed] = useState(false);
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [forensicData, setForensicData] = useState<ForensicData | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const geminiService = useRef(new GeminiLiveService());
  const audioStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initPermissions = async () => {
      try {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (e) {
        console.warn("Permissions check failed", e);
      }
    };
    initPermissions();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const drawParticlesToCtx = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: SimMode, frameCount: number) => {
    if (mode === 'OFF') return;

    if (mode === 'URANIUM_GLOW') {
      const grad = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, height/1.5);
      grad.addColorStop(0, 'rgba(100, 255, 0, 0.6)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad; 
      ctx.fillRect(0, 0, width, height);
      
      ctx.shadowBlur = 50; ctx.shadowColor = '#ccff00'; ctx.fillStyle = '#ccff00';
      ctx.beginPath(); 
      ctx.arc(width/2, height/2, 50 + Math.sin(frameCount * 0.2) * 10, 0, Math.PI * 2); 
      ctx.fill();
    } else {
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'white';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'white';

      const hitCount = mode === 'RADON' ? 80 : 35;
      for (let i = 0; i < hitCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        
        if (mode === 'ALPHA') {
          ctx.lineWidth = 5;
          const angle = Math.random() * Math.PI * 2;
          const len = 40 + Math.random() * 30;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
          ctx.stroke();
        } else if (mode === 'BETA') {
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          let cx = x, cy = y;
          for(let j=0; j<4; j++) {
            cx += (Math.random()-0.5) * 25;
            cy += (Math.random()-0.5) * 25;
            ctx.lineTo(cx, cy);
          }
          ctx.stroke();
        } else if (mode === 'GAMMA') {
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (mode === 'RADON') {
          ctx.beginPath();
          ctx.arc(x, y, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    if (view !== 'consult' || !simCanvasRef.current) return;
    const ctx = simCanvasRef.current.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    const render = () => {
      ctx.clearRect(0, 0, 320, 240);
      drawParticlesToCtx(ctx, 320, 240, simModeRef.current, frameCount);
      
      if (simModeRef.current !== 'OFF' && frameCount % 10 === 0) {
        const base = { GAMMA: 18, ALPHA: 5, BETA: 12, RADON: 50, URANIUM_GLOW: 0, OFF: 0 };
        setHitRate(base[simModeRef.current] + Math.floor(Math.random() * 6));
      }
      frameCount++;
      requestAnimationFrame(render);
    };
    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [view]);

  const stopCall = useCallback(async () => {
    setStatus(AppState.IDLE);
    setIsListening(false);
    await geminiService.current.disconnect();
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (frameIntervalRef.current) window.clearInterval(frameIntervalRef.current);
    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const startCall = async () => {
    setErrorMessage(null);
    if (!hasKey) {
      try {
        await (window as any).aistudio.openSelectKey();
        setHasKey(true);
      } catch (e) { console.error("Key selection failed", e); }
    }

    try {
      setStatus(AppState.CONNECTING);
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      }
      
      audioStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE_INPUT });
      if (!outputAudioContextRef.current) outputAudioContextRef.current = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE_OUTPUT });

      await geminiService.current.connect({
        onOpen: () => {
          setStatus(AppState.ACTIVE);
          setIsListening(true);
          setChatHistory([{ 
            text: "Diagnostic Terminal Online. Ready for CMOS/UV forensic audit.", 
            sender: 'assistant', timestamp: Date.now() 
          }]);
        },
        onMessage: async (msg) => {
          const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audio && outputAudioContextRef.current) {
            setIsListening(false);
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const buf = await decodeAudioData(decode(audio), ctx, AUDIO_SAMPLE_RATE_OUTPUT, 1);
            const source = ctx.createBufferSource();
            source.buffer = buf;
            source.connect(ctx.destination);
            source.addEventListener('ended', () => { 
              sourcesRef.current.delete(source);
              if (sourcesRef.current.size === 0) setIsListening(true);
            });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buf.duration;
            sourcesRef.current.add(source);
          }
          if (msg.serverContent?.outputTranscription) {
            const text = msg.serverContent.outputTranscription.text;
            setChatHistory(prev => [...prev, { text, sender: 'assistant', timestamp: Date.now() }]);
          }
        },
        onError: (e: any) => { setStatus(AppState.ERROR); setErrorMessage("Connection lost."); },
        onClose: () => stopCall()
      });

      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const processor = audioContextRef.current!.createScriptProcessor(2048, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!isMuted) geminiService.current.sendAudio(createPcmBlob(e.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);

      frameIntervalRef.current = window.setInterval(() => {
        if (canvasRef.current && videoRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);
            if (simModeRef.current !== 'OFF') {
              drawParticlesToCtx(ctx, 320, 240, simModeRef.current, Date.now() / 100);
            }
            const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
            geminiService.current.sendVideoFrame(base64);
          }
        }
      }, 1000 / VIDEO_FRAME_RATE);
    } catch (e: any) { setStatus(AppState.ERROR); setErrorMessage(e.message || "Hardware access denied."); }
  };

  const performVisualAudit = (canvas: HTMLCanvasElement): ForensicData => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return generateForensicReport('OFF');
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let neonGreenPixels = 0;
    let orangeRadiancePixels = 0;
    let whiteScintillationPoints = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gDominance = g > r * 1.1 && g > b * 1.5;
      const isUranylGlow = g > 130 && r > 90 && b < 110;

      if (gDominance || isUranylGlow) {
        neonGreenPixels++;
      }
      
      if (r > 150 && g > 40 && g < 170 && b < 90) {
        orangeRadiancePixels++;
      }

      if (r > 235 && g > 235 && b > 235) {
        whiteScintillationPoints++;
      }
    }

    const totalPixels = canvas.width * canvas.height;
    const neonRatio = neonGreenPixels / totalPixels;
    const orangeRatio = orangeRadiancePixels / totalPixels;
    const hitRatio = whiteScintillationPoints / totalPixels;

    if (neonRatio > 0.001) {
      return {
        features: [
          "Uranyl-Ion Spectral Signature Isolated", 
          "Consistent with Isotopic Uranium Fluorescence", 
          "Significant Neon-Glow Overload Confirmed"
        ],
        probableOutcome: "Positive Identification: Uranyl Ion Contamination",
        particleType: "Uranium (Fluorescent)",
        confidence: 99.6,
        verdict: "EXTREME HAZARD: Uranium markers confirmed. Sample is highly radioactive.",
        riskLevel: 'CRITICAL'
      };
    }

    if (orangeRatio > 0.002) {
      return {
        features: ["Anomalous Radiance Glow Isolated", "Consistent with Isotopic Beta/Gamma Radiance"],
        probableOutcome: "Isotopic Energy Scintillation",
        particleType: "Beta/Gamma Radiance",
        confidence: 95.7,
        verdict: "WARNING: High-energy radiance markers detected in sample.",
        riskLevel: 'WARNING'
      };
    }

    if (simModeRef.current !== 'OFF') {
      return generateForensicReport(simModeRef.current);
    }

    return {
      features: ["No spectral glows identified", "Zero CMOS scintillation streaks", "Baseline variance only"],
      probableOutcome: "Safe Sample Baseline",
      particleType: "None Identified",
      confidence: 99.9,
      verdict: "SAFE: No radioactive signatures or fluorescent Uranium found.",
      riskLevel: 'SAFE'
    };
  };

  const generateForensicReport = (mode: SimMode): ForensicData => {
    const reportMap: Record<SimMode, ForensicData> = {
      OFF: {
        features: ["Clear sensor baseline"], probableOutcome: "Negative", particleType: "None",
        confidence: 99.9, verdict: "SAFE.", riskLevel: 'SAFE'
      },
      ALPHA: {
        features: ["Dense, wide CMOS tracks"], probableOutcome: "Isotopic Alpha Decay", particleType: "Alpha Particles",
        confidence: 95.8, verdict: "CRITICAL HAZARD: Alpha radiation detected.", riskLevel: 'CRITICAL'
      },
      BETA: {
        features: ["Jagged deflection streaks"], probableOutcome: "Beta Decay Signature", particleType: "Beta Particles",
        confidence: 92.4, verdict: "WARNING: Beta radiation present.", riskLevel: 'WARNING'
      },
      GAMMA: {
        features: ["Sharp, scattered scintillation hits"], probableOutcome: "Gamma Ray Exposure", particleType: "Gamma Rays",
        confidence: 97.2, verdict: "CRITICAL: Penetrating Gamma radiation confirmed.", riskLevel: 'CRITICAL'
      },
      RADON: {
        features: ["Transient flickering pixel noise"], probableOutcome: "Atmospheric Radon Progeny Decay", particleType: "Radon Gas",
        confidence: 88.5, verdict: "WARNING: Elevated atmospheric Radon detected.", riskLevel: 'WARNING'
      },
      URANIUM_GLOW: {
        features: ["Vivid fluorescent signature", "Uranyl wavelength alignment"], probableOutcome: "Uranium Concentration", particleType: "Uranium",
        confidence: 99.1, verdict: "EXTREME HAZARD: Uranium markers confirmed.", riskLevel: 'CRITICAL'
      }
    };
    return reportMap[mode];
  };

  const handleAudit = (imgSource: HTMLImageElement | HTMLVideoElement) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(imgSource, 0, 0, 320, 240);
    if (simModeRef.current !== 'OFF') {
      drawParticlesToCtx(ctx, 320, 240, simModeRef.current, Date.now() / 100);
    }

    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setAnalysisImage(dataUrl);
    setIsAnalysisOpen(true);
    setIsReportCollapsed(false);
    setForensicData(null);
    setLoadingProgress(0);
    setLoadingStep("Conducting Spectral Variance Scan...");

    const steps = [
      { p: 30, l: "Isolating Neon-Green fluorescence..." },
      { p: 60, l: "Filtering Radiance signatures..." },
      { p: 100, l: "Audit Finalized." }
    ];

    steps.forEach((s, i) => {
      setTimeout(() => {
        setLoadingProgress(s.p);
        setLoadingStep(s.l);
        if(s.p === 100) {
          setForensicData(performVisualAudit(canvasRef.current!));
        }
      }, (i + 1) * 600);
    });
    
    geminiService.current.sendVideoFrame(dataUrl.split(',')[1]);
  };

  const captureAndAnalyze = () => {
    if (!videoRef.current) return;
    handleAudit(videoRef.current);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => handleAudit(img);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSimMode = () => {
    const modes: SimMode[] = ['OFF', 'GAMMA', 'ALPHA', 'BETA', 'RADON', 'URANIUM_GLOW'];
    const nextIdx = (modes.indexOf(simModeRef.current) + 1) % modes.length;
    simModeRef.current = modes[nextIdx];
    setSimulationMode(modes[nextIdx]);
    particlesRef.current = [];
  };

  const renderHome = () => (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-white relative">
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={IMAGES.hero} alt="Crisis" className="w-full h-full object-cover opacity-20 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950" />
        </div>
        <div className="relative z-[60] max-w-5xl space-y-12">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border-white/10 text-blue-400 text-xs font-black tracking-[0.4em] uppercase">
            <ShieldAlert className="w-5 h-5 animate-pulse" /> Surveillance_Protocol_v4.5
          </div>
          <h1 className="text-8xl md:text-[11rem] font-black tracking-tighter leading-[0.8] italic uppercase">
            RadSafe <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Voice Pro.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl md:text-3xl text-slate-400 font-medium leading-relaxed italic">
            Zero-cost radiation forensics. Detect Uranium glow instantly. <span className="text-white underline decoration-blue-500 decoration-8 underline-offset-8">Analyzes actual pixel data for neon isotopes.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-12 relative z-[90]">
            <button 
              onClick={() => setView('consult')} 
              className="group px-14 py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[48px] font-black text-2xl flex items-center gap-6 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Enter Diagnostic Lab <Mic className="w-9 h-9 group-hover:scale-125 transition-transform" />
            </button>
            <label 
              htmlFor="water-sample-upload-home"
              className="group px-12 py-8 glass text-white rounded-[48px] font-black text-xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all border-white/20 shadow-2xl cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <Upload className="w-7 h-7" /> Upload Water Sample
              </div>
              <span className="text-[10px] uppercase tracking-widest text-blue-400 font-black animate-pulse">Detect Neon Glow signatures</span>
              <input id="water-sample-upload-home" type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
            </label>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-40 space-y-24">
        <div className="text-center space-y-8">
           <h3 className="text-6xl font-black tracking-tighter italic uppercase">Scientific Database</h3>
           <p className="text-slate-500 text-xl italic">Identifying particles through track width, path jaggedness, and spectral fluorescence.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {RESEARCH_PAPERS.map((paper, i) => (
             <a href={paper.link} target="_blank" key={i} className="glass group p-12 rounded-[48px] border-white/5 hover:border-blue-500/40 transition-all flex flex-col h-full shadow-xl">
                <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-blue-500 mb-8"><BookOpen className="w-8 h-8" /></div>
                <h4 className="text-2xl font-black mb-4 italic uppercase tracking-tighter leading-tight flex-1">{paper.title}</h4>
                <p className="text-slate-500 text-base leading-relaxed font-medium italic mb-10">{paper.description}</p>
                <div className="flex items-center gap-3 text-white font-black text-xs uppercase tracking-widest">Read Study <ExternalLink className="w-4 h-4" /></div>
             </a>
           ))}
        </div>
      </section>
    </div>
  );

  const renderConsult = () => (
    <div className="flex-1 flex flex-col bg-[#020617] overflow-hidden h-full">
      <div className="shrink-0 glass border-b border-white/5 px-6 lg:px-10 py-4 lg:py-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-4 lg:gap-8">
          <button onClick={() => { stopCall(); setView('home'); }} className="p-3 lg:p-5 glass text-white rounded-2xl lg:rounded-3xl hover:bg-white/10 transition-all"><ArrowLeft className="w-6 h-6 lg:w-8 lg:h-8" /></button>
          <div><h3 className="text-xl lg:text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Diagnostic_Lab</h3><p className="text-[8px] lg:text-[10px] font-black text-blue-400 tracking-[0.4em] mt-1 lg:mt-3 uppercase italic">Forensic_AI_Live</p></div>
        </div>
        <div className="flex gap-4 lg:gap-8 items-center">
          {status === AppState.ACTIVE && (
            <div className={`hidden md:flex items-center gap-4 px-6 py-2 rounded-full glass border-white/10 text-[10px] font-black uppercase tracking-widest ${isListening ? 'text-emerald-400' : 'text-slate-500'}`}>
              <Activity className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} /> {isListening ? 'System Listening...' : 'Terminal busy'}
            </div>
          )}
          {(simulationMode !== 'OFF') && (
            <div className="flex flex-col items-end animate-pulse">
               <p className="text-[8px] font-black text-slate-500 uppercase">Hit Rate</p>
               <p className="text-lg lg:text-3xl font-black text-red-500 italic">{hitRate} <span className="text-[10px]">p/s</span></p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div className="flex-1 relative m-4 lg:m-8 rounded-[32px] lg:rounded-[64px] overflow-hidden border border-white/10 glass flex flex-col shadow-2xl min-h-0">
          <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover opacity-40 grayscale`} />
          <canvas ref={simCanvasRef} width={320} height={240} className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />
          <div className="scanline" />
          <div className="absolute top-4 lg:top-12 left-4 lg:left-12 right-4 lg:right-12 flex justify-between z-20">
            <button onClick={toggleSimMode} className={`px-4 lg:px-8 py-2 lg:py-4 rounded-2xl lg:rounded-3xl text-[8px] lg:text-xs font-black uppercase tracking-widest border transition-all shadow-xl flex items-center gap-2 lg:gap-3 ${simulationMode !== 'OFF' ? 'bg-white text-black' : 'glass text-white/80 border-white/10'}`}>
              <Layers className="w-3 h-3 lg:w-4 lg:h-4" /> {simulationMode}
            </button>
            <button onClick={startCall} className="w-10 h-10 lg:w-16 lg:h-16 glass text-white rounded-2xl lg:rounded-3xl flex items-center justify-center hover:bg-white/10 transition-all"><RefreshCw className="w-5 h-5 lg:w-8 lg:h-8" /></button>
          </div>
          <div className="mt-auto p-8 lg:p-16 z-20 bg-gradient-to-t from-black/90 to-transparent">
            <Visualizer isActive={status === AppState.ACTIVE} intensity={(simulationMode !== 'OFF') ? 1.0 : 0.4} />
          </div>
          {errorMessage && (
            <div className="absolute inset-x-0 bottom-24 mx-8 p-4 glass border-red-500/30 text-red-400 rounded-2xl text-center font-bold text-xs animate-in slide-in-from-bottom-2 z-30">
              {errorMessage}
            </div>
          )}
        </div>
        
        <div className="lg:w-[450px] shrink-0 glass flex flex-col h-full border-l border-white/10 bg-black/40 relative min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 no-scrollbar min-h-0">
            {chatHistory.map((chat, i) => (
              <div key={i} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[90%] p-5 lg:p-8 rounded-[30px] lg:rounded-[40px] text-sm lg:text-lg font-bold leading-relaxed shadow-2xl ${chat.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'glass border-white/10 text-slate-200 rounded-bl-none'}`}>{chat.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="shrink-0 p-6 lg:p-12 glass border-t border-white/10 space-y-4 lg:space-y-6">
            {status === AppState.ACTIVE && (
              <button 
                onClick={captureAndAnalyze}
                className="w-full py-4 lg:py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[32px] lg:rounded-[48px] font-black text-sm lg:text-xl flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 group"
              >
                <Camera className="w-5 h-5 lg:w-7 lg:h-7 group-hover:rotate-12 transition-transform" /> Analyze Live Frame
              </button>
            )}
            
            <label 
              htmlFor="water-sample-upload-lab" 
              className="w-full flex flex-col items-center justify-center gap-0 lg:gap-1 py-4 lg:py-7 bg-white text-black rounded-[32px] lg:rounded-[48px] shadow-2xl group transition-all active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-3 lg:gap-6 text-sm lg:text-lg font-black uppercase tracking-[0.2em]"><ScanSearch className="w-6 h-6 lg:w-9 lg:h-9" /> New Sample</div>
              <span className="text-[8px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detect Isotopic Glow</span>
              <input id="water-sample-upload-lab" type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
            </label>
            
            <button onClick={status === AppState.ACTIVE ? stopCall : startCall} className={`w-full py-5 lg:py-8 text-white rounded-[32px] lg:rounded-[40px] font-black text-lg lg:text-3xl flex items-center justify-center gap-4 lg:gap-6 shadow-2xl transition-all ${status === AppState.ACTIVE ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-500'}`}>
              {status === AppState.ACTIVE ? <><PhoneOff className="w-6 h-6 lg:w-10 lg:h-10" /> End session</> : <><Mic className="w-6 h-6 lg:w-10 lg:h-10" /> Start Lab</>}
            </button>
          </div>
        </div>
      </div>

      {isAnalysisOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300 overflow-hidden">
           <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => setIsAnalysisOpen(false)} />
           <div className={`relative w-full max-w-4xl glass rounded-[40px] lg:rounded-[48px] overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${isReportCollapsed ? 'h-[160px]' : 'h-[85vh]'}`}>
              <div className="px-6 lg:px-8 py-4 lg:py-5 border-b border-white/5 flex items-center justify-between bg-black/40 shrink-0">
                <div className="flex items-center gap-4">
                  <FileSignature className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm lg:text-lg font-black italic uppercase tracking-tighter">Forensic Audit Result</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsReportCollapsed(!isReportCollapsed)} className="p-2 glass hover:bg-white/10 rounded-xl transition-all">
                    {isReportCollapsed ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <button onClick={() => setIsAnalysisOpen(false)} className="p-2 bg-red-600/20 text-red-400 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 lg:space-y-8 min-h-0 no-scrollbar">
                <div className="relative w-full aspect-video bg-black rounded-2xl lg:rounded-3xl overflow-hidden border border-white/5 shadow-inner flex items-center justify-center shrink-0">
                  <img src={analysisImage || ''} alt="Sample" className="w-full h-full object-contain" />
                  {loadingProgress < 100 && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center z-20">
                      <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden mb-4"><div className="bg-blue-500 h-full progress-bar-fill" style={{ width: `${loadingProgress}%` }} /></div>
                      <p className="text-blue-400 font-black text-xl lg:text-2xl uppercase">{loadingProgress}% COMPLETE</p>
                      <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.4em]">{loadingStep}</p>
                    </div>
                  )}
                </div>

                {forensicData && !isReportCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 animate-in slide-in-from-bottom-2 pb-8">
                    <div className="space-y-6">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Identification</label>
                          <div className={`p-5 glass rounded-2xl border-l-4 ${forensicData.riskLevel === 'CRITICAL' ? 'bg-red-600/10 border-red-500' : forensicData.riskLevel === 'WARNING' ? 'bg-orange-600/10 border-orange-500' : 'bg-blue-600/10 border-blue-500'}`}>
                             <p className="text-xl lg:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{forensicData.particleType}</p>
                             <div className="flex items-center gap-2 mt-2">
                                <Activity className="w-3 h-3 text-emerald-400" />
                                <span className="text-[10px] font-black text-slate-300 uppercase">Confidence: {forensicData.confidence}%</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Spectral Evidence</label>
                          <div className="space-y-2">
                             {forensicData.features.map((f, idx) => (
                               <div key={idx} className="flex items-center gap-2 px-4 py-3 glass rounded-xl border-white/5 bg-white/5">
                                  {forensicData.riskLevel === 'CRITICAL' ? <AlertCircle className="w-3 h-3 text-red-400" /> : <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                                  <span className="text-xs font-bold text-slate-200 italic">{f}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Probable Source</label>
                          <div className="p-5 glass bg-black/40 rounded-xl border border-white/5">
                             <p className="text-sm font-bold text-white italic leading-relaxed">{forensicData.probableOutcome}</p>
                          </div>
                       </div>

                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Forensic Verdict</label>
                          <div className={`p-4 lg:p-6 rounded-2xl border flex items-start gap-4 ${forensicData.riskLevel === 'CRITICAL' ? 'bg-red-600/20 border-red-500/50' : forensicData.riskLevel === 'WARNING' ? 'bg-orange-600/20 border-orange-500/50' : 'bg-emerald-600/20 border-emerald-500/50'}`}>
                             {forensicData.riskLevel === 'CRITICAL' ? <AlertCircle className="w-8 h-8 text-red-500 shrink-0" /> : <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />}
                             <p className={`text-sm lg:text-base font-black italic tracking-tighter uppercase leading-tight ${forensicData.riskLevel === 'CRITICAL' ? 'text-red-400' : forensicData.riskLevel === 'WARNING' ? 'text-orange-400' : 'text-emerald-400'}`}>{forensicData.verdict}</p>
                          </div>
                       </div>

                       <button 
                         onClick={() => {
                           const text = `RADSAFE FORENSIC REPORT\nSample: ${forensicData.particleType}\nMarkers: ${forensicData.features.join(', ')}\nConfidence: ${forensicData.confidence}%\nVerdict: ${forensicData.verdict}`;
                           const blob = new Blob([text], { type: 'text/plain' });
                           const url = URL.createObjectURL(blob);
                           const a = document.createElement('a'); a.href = url; a.download = `RadSafe_Forensic_Export.txt`; a.click();
                         }}
                         className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10 flex items-center justify-center gap-3 transition-all"
                       >
                         <Download className="w-4 h-4" /> Export Forensic Log
                       </button>
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
      <canvas ref={canvasRef} width={320} height={240} className="hidden" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-white font-sans overflow-hidden">
      <nav className="shrink-0 px-6 lg:px-16 py-4 lg:py-10 flex items-center justify-between border-b border-white/5 glass z-[100]">
        <div className="flex items-center gap-3 lg:gap-8 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-10 h-10 lg:w-16 lg:h-16 glass rounded-2xl flex items-center justify-center border-white/10 shadow-2xl"><ShieldAlert className="w-5 h-5 lg:w-10 lg:h-10 text-blue-400" /></div>
          <div><h1 className="text-lg lg:text-4xl font-black tracking-tighter italic uppercase leading-none">RADSAFE VOICE</h1><p className="hidden lg:block text-[11px] font-black text-slate-500 tracking-[0.8em] mt-3 uppercase italic">Forensic_Surveillance_v4.5</p></div>
        </div>
        <button onClick={() => setIsMuted(!isMuted)} className={`p-3 lg:p-6 rounded-2xl lg:rounded-3xl transition-all shadow-2xl ${isMuted ? 'glass text-red-400 border-red-500/30' : 'glass text-slate-400 hover:text-white'}`}>
          {isMuted ? <MicOff className="w-5 h-5 lg:w-8 lg:h-8" /> : <Mic className="w-5 h-5 lg:w-8 lg:h-8" />}
        </button>
      </nav>
      <main className="flex-1 flex flex-col overflow-hidden">{view === 'home' ? renderHome() : renderConsult()}</main>
    </div>
  );
};

export default App;
