import { useState, useEffect, useRef } from "react";
import { FileUpload } from "@/components/file-upload";
import { useAnalyzeAudio, useSaveAnalysis } from "@workspace/api-client-react";
import type { AnalysisResult, Detection } from "@workspace/api-client-react/src/generated/api.schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Settings2, Save, MapPin, Music, Bird, CheckCircle2, Play, Pause, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useWikipedia } from "@/hooks/use-wikipedia";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ANALYSIS_STAGES = [
  { label: "Uploading audio file", duration: 2000 },
  { label: "Reading audio chunks", duration: 4000 },
  { label: "Running neural network", duration: 0 },
  { label: "Processing detections", duration: 1000 },
];

function AnalysisProgress({ fileSizeMb }: { fileSizeMb: number }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  const estimatedSeconds = Math.max(15, Math.round(fileSizeMb * 8));

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cumulativeDelay = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < ANALYSIS_STAGES.length - 1; i++) {
      cumulativeDelay += ANALYSIS_STAGES[i - 1].duration;
      const delay = cumulativeDelay;
      const idx = i;
      timers.push(setTimeout(() => setStageIndex(idx), delay));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const progressPct = Math.min(95, (elapsed / estimatedSeconds) * 100);

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur-md overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <CardContent className="p-6 space-y-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 shadow-inner">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div>
            <p className="font-serif text-lg font-bold text-foreground">Analyzing recording…</p>
            <p className="text-sm text-muted-foreground font-mono">
              {elapsed}s elapsed · ~{Math.max(1, estimatedSeconds - elapsed)}s remaining
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(var(--primary),0.5)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="space-y-3 bg-background/50 rounded-xl p-4">
          {ANALYSIS_STAGES.map((stage, i) => (
            <div key={i} className={cn("flex items-center gap-3 text-sm transition-all duration-500",
              i < stageIndex ? "text-primary" :
              i === stageIndex ? "text-foreground font-medium scale-105 origin-left" :
              "text-muted-foreground/40"
            )}>
              {i < stageIndex ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : i === stageIndex ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current shrink-0 opacity-30" />
              )}
              {stage.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DetectionCard({ 
  detection, 
  index, 
  onPlay, 
  isActive 
}: { 
  detection: Detection; 
  index: number;
  onPlay: (time: number) => void;
  isActive: boolean;
}) {
  const { data: wiki } = useWikipedia(detection.common_name);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: "spring", bounce: 0.4 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300",
        isActive ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-[1.02]" : "hover:border-primary/50 hover:shadow-md border-transparent bg-card/60 backdrop-blur-sm"
      )}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Button 
                variant={isActive ? "default" : "secondary"} 
                size="icon" 
                className={cn("w-12 h-12 rounded-full shrink-0 transition-all", isActive && "animate-pulse")}
                onClick={() => onPlay(detection.start_time)}
              >
                {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
              </Button>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h4 className="text-lg font-serif font-bold text-foreground truncate">{detection.common_name}</h4>
                <p className="text-sm font-serif italic text-muted-foreground truncate">{detection.scientific_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 sm:w-auto w-full justify-between sm:justify-end">
              <div className="w-32">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Confidence</span>
                  <span className="font-bold font-mono">{(detection.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${detection.confidence * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      detection.confidence > 0.8 ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" : 
                      detection.confidence > 0.4 ? "bg-secondary" : "bg-accent"
                    )}
                  />
                </div>
              </div>

              <div className="text-xs font-mono text-muted-foreground bg-background/50 py-1.5 px-3 rounded-lg border border-border/50 whitespace-nowrap">
                {detection.start_time.toFixed(1)}s - {detection.end_time.toFixed(1)}s
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {isOpen && wiki && (
              <CollapsibleContent forceMount asChild>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-4 pt-0 border-t border-border/50 bg-muted/20">
                    <div className="flex gap-4 mt-4">
                      {wiki.thumbnail && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 shadow-md">
                          <img src={wiki.thumbnail.source} alt={detection.common_name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 text-sm space-y-3">
                        <p className="text-muted-foreground leading-relaxed">{wiki.extract}</p>
                        {wiki.content_urls?.desktop && (
                          <a 
                            href={wiki.content_urls.desktop.page} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            Read more on Wikipedia <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Collapsible>
      </Card>
    </motion.div>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");
  const [minConf, setMinConf] = useState([0.1]);
  const [sensitivity, setSensitivity] = useState([1.0]);
  const [overlap, setOverlap] = useState([0.0]);

  const analyzeMutation = useAnalyzeAudio();
  const saveMutation = useSaveAnalysis();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(selectedFile));
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setAnalyzing(true);
    setResult(null);
    
    try {
      const res = await analyzeMutation.mutateAsync({
        data: {
          file,
          lat: lat ? parseFloat(lat) : undefined,
          lon: lon ? parseFloat(lon) : undefined,
          min_conf: minConf[0],
          sensitivity: sensitivity[0],
          overlap: overlap[0]
        }
      } as any);
      
      setResult(res);
      toast.success(`Analysis complete! Found ${res.detections.length} detections.`);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to analyze audio.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result || !file) return;
    
    try {
      await saveMutation.mutateAsync({
        data: {
          result,
          original_filename: file.name
        }
      });
      toast.success("Analysis saved to history!");
    } catch (error) {
      toast.error("Failed to save analysis.");
    }
  };

  const playAtTime = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
  };

  // Cleanup object url on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4 py-12 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground tracking-tight leading-tight">
            Listen to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">forest</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 font-light">
            Upload a field recording. Let BirdNET uncover the hidden life in your audio.
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          {!file ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <FileUpload onFileSelect={handleFileSelect} />
            </motion.div>
          ) : analyzing ? (
            <AnalysisProgress fileSizeMb={file.size / 1024 / 1024} />
          ) : (
            <Card className="border-primary/20 bg-card/60 backdrop-blur-md overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto truncate">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                      <Music className="w-7 h-7" />
                    </div>
                    <div className="truncate flex-1">
                      <h3 className="font-serif font-bold text-lg truncate" title={file.name}>{file.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none border-border/50" onClick={() => { setFile(null); setResult(null); }}>
                      Change
                    </Button>
                    <Button className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={handleAnalyze}>
                      Analyze
                    </Button>
                  </div>
                </div>
                
                {audioUrl && result && (
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <audio 
                      ref={audioRef} 
                      src={audioUrl} 
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      controls 
                      className="w-full h-12 outline-none custom-audio-player" 
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-6 pt-4">
              <div className="flex items-end justify-between border-b border-border/50 pb-4">
                <div>
                  <h2 className="text-3xl font-serif font-bold">Field Notes</h2>
                  <p className="text-muted-foreground mt-1 font-mono text-sm">{result.detections.length} detections found</p>
                </div>
                <Button onClick={handleSave} disabled={saveMutation.isPending} variant="secondary" className="shadow-md">
                  <Save className="w-4 h-4 mr-2" />
                  Save Record
                </Button>
              </div>

              {result.detections.length === 0 ? (
                <div className="text-center py-16 bg-card/30 backdrop-blur-sm rounded-2xl border border-dashed border-border/50">
                  <Bird className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-serif font-medium text-muted-foreground">The forest is quiet</h3>
                  <p className="text-sm text-muted-foreground/60 mt-2">No birds detected. Try lowering minimum confidence.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {result.detections.map((d, i) => {
                    const isActive = isPlaying && currentTime >= d.start_time && currentTime <= d.end_time;
                    return (
                      <DetectionCard 
                        key={`${d.scientific_name}-${d.start_time}`} 
                        detection={d} 
                        index={i} 
                        onPlay={playAtTime}
                        isActive={isActive}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Min Confidence</Label>
                  <span className="text-sm text-foreground font-mono bg-background/50 px-2 py-0.5 rounded">{minConf[0].toFixed(2)}</span>
                </div>
                <Slider value={minConf} onValueChange={setMinConf} max={1} step={0.05} className="py-2" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Sensitivity</Label>
                  <span className="text-sm text-foreground font-mono bg-background/50 px-2 py-0.5 rounded">{sensitivity[0].toFixed(2)}</span>
                </div>
                <Slider value={sensitivity} onValueChange={setSensitivity} min={0.5} max={1.5} step={0.1} className="py-2" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Overlap</Label>
                  <span className="text-sm text-foreground font-mono bg-background/50 px-2 py-0.5 rounded">{overlap[0].toFixed(1)}s</span>
                </div>
                <Slider value={overlap} onValueChange={setOverlap} max={2.9} step={0.1} className="py-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location
              </CardTitle>
              <CardDescription className="text-xs">Optional context for accuracy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Latitude</Label>
                <Input 
                  placeholder="42.500" 
                  value={lat} 
                  onChange={e => setLat(e.target.value)} 
                  type="number"
                  step="any"
                  className="bg-background/50 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Longitude</Label>
                <Input 
                  placeholder="-76.200" 
                  value={lon} 
                  onChange={e => setLon(e.target.value)}
                  type="number"
                  step="any"
                  className="bg-background/50 font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <style>{`
        /* Custom Audio Player Styling */
        .custom-audio-player::-webkit-media-controls-panel {
          background-color: hsl(var(--muted) / 0.5);
          border-radius: var(--radius);
        }
        .custom-audio-player::-webkit-media-controls-current-time-display,
        .custom-audio-player::-webkit-media-controls-time-remaining-display {
          color: hsl(var(--foreground));
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .dark .custom-audio-player {
          color-scheme: dark;
        }
      `}</style>
    </div>
  );
}
