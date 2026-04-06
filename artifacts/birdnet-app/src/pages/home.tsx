import { useState, useEffect, useRef } from "react";
import { FileUpload } from "@/components/file-upload";
import { useAnalyzeAudio, useSaveAnalysis } from "@workspace/api-client-react";
import type { AnalysisResult, Detection } from "@/context/analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Loader2, Settings2, Save, MapPin, Music, Bird,
  CheckCircle2, Play, Square, ExternalLink, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useWikipedia } from "@/hooks/use-wikipedia";
import { useAnalysisSession } from "@/context/analysis";

const ANALYSIS_STAGES = [
  { label: "Uploading audio file", duration: 2000 },
  { label: "Reading audio chunks", duration: 4000 },
  { label: "Running neural network", duration: 0 },
  { label: "Processing detections", duration: 1000 },
];

function deduplicateDetections(detections: Detection[]): Detection[] {
  const map = new Map<string, Detection>();
  for (const d of detections) {
    const existing = map.get(d.scientific_name);
    if (!existing || d.confidence > existing.confidence) {
      map.set(d.scientific_name, d);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.confidence - a.confidence);
}

function confidenceLabel(conf: number) {
  if (conf >= 0.8) return { label: "Very High", color: "text-emerald-400" };
  if (conf >= 0.6) return { label: "High", color: "text-green-400" };
  if (conf >= 0.4) return { label: "Moderate", color: "text-yellow-400" };
  return { label: "Low", color: "text-orange-400" };
}

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
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div>
            <p className="font-serif text-lg font-bold text-foreground">Analyzing recording…</p>
            <p className="text-sm text-muted-foreground font-mono">
              {elapsed}s elapsed · ~{Math.max(1, estimatedSeconds - elapsed)}s remaining
            </p>
          </div>
        </div>
        <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="space-y-3 bg-background/50 rounded-xl p-4">
          {ANALYSIS_STAGES.map((stage, i) => (
            <div key={i} className={cn("flex items-center gap-3 text-sm transition-all duration-500",
              i < stageIndex ? "text-primary" :
              i === stageIndex ? "text-foreground font-medium" :
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
  activeKey,
}: {
  detection: Detection;
  index: number;
  onPlay: (startTime: number, endTime: number, key: string) => void;
  activeKey: string | null;
}) {
  const { data: wiki } = useWikipedia(detection.common_name);
  const [isOpen, setIsOpen] = useState(false);
  const key = detection.scientific_name;
  const isActive = activeKey === key;
  const { label: confLabel, color: confColor } = confidenceLabel(detection.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, type: "spring", bounce: 0.3 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 border",
        isActive
          ? "border-primary shadow-[0_0_18px_rgba(0,200,120,0.2)]"
          : "border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-md"
      )}>
        {/* Main row */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">

          {/* Play / Stop button */}
          <Button
            variant={isActive ? "default" : "outline"}
            size="icon"
            className={cn(
              "w-11 h-11 rounded-full shrink-0 transition-all",
              isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            )}
            title={isActive ? `Stop (${detection.start_time.toFixed(1)}s – ${detection.end_time.toFixed(1)}s)` : `Play ${detection.start_time.toFixed(1)}s – ${detection.end_time.toFixed(1)}s`}
            onClick={() => onPlay(detection.start_time, detection.end_time, key)}
          >
            {isActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
          </Button>

          {/* Bird name */}
          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-bold text-lg text-foreground leading-tight">{detection.common_name}</h4>
            <p className="text-xs italic text-muted-foreground">{detection.scientific_name}</p>
          </div>

          {/* Confidence + timestamp */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
            <div className="flex flex-col items-end gap-1 min-w-[90px]">
              <div className="flex items-center gap-1.5">
                <span className={cn("text-xs font-semibold", confColor)}>{confLabel}</span>
                <span className="font-mono font-bold text-sm text-foreground">{(detection.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-24 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${detection.confidence * 100}%` }}
                  transition={{ delay: index * 0.07 + 0.2, duration: 0.8, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    detection.confidence >= 0.8 ? "bg-emerald-400" :
                    detection.confidence >= 0.6 ? "bg-green-400" :
                    detection.confidence >= 0.4 ? "bg-yellow-400" : "bg-orange-400"
                  )}
                />
              </div>
            </div>

            <span className="text-xs font-mono text-muted-foreground bg-background/60 px-2.5 py-1.5 rounded-lg border border-border/50 whitespace-nowrap">
              {detection.start_time.toFixed(1)}s – {detection.end_time.toFixed(1)}s
            </span>

            {/* Expand toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(v => !v)}
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded bird details */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/40 bg-muted/10 p-4">
                {wiki ? (
                  <div className="flex gap-4">
                    {wiki.thumbnail && (
                      <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 shadow-md border border-border/30">
                        <img src={wiki.thumbnail.source} alt={detection.common_name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-3 text-sm">
                      {/* Quick fact badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                          {detection.scientific_name}
                        </span>
                        {wiki.extract.toLowerCase().includes("migrat") && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">Migratory</span>
                        )}
                        {wiki.extract.toLowerCase().includes("habitat") && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">Habitat info</span>
                        )}
                        {(wiki.extract.toLowerCase().includes("feed") || wiki.extract.toLowerCase().includes("diet") || wiki.extract.toLowerCase().includes("eat")) && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">Diet info</span>
                        )}
                      </div>
                      <p className="text-muted-foreground leading-relaxed line-clamp-5">{wiki.extract}</p>
                      {wiki.content_urls?.desktop && (
                        <a
                          href={wiki.content_urls.desktop.page}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors text-xs"
                        >
                          Read full profile on Wikipedia <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium text-sm">{detection.common_name} <span className="italic text-muted-foreground">({detection.scientific_name})</span></p>
                    <p className="text-xs text-muted-foreground">No Wikipedia entry found for this species.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function Home() {
  const {
    file,
    audioUrl,
    analyzing,
    result,
    activeKey,
    lat,
    lon,
    minConf,
    sensitivity,
    overlap,
    selectFile,
    clearFile,
    setAnalyzing,
    setResult,
    setActiveKey,
    setLat,
    setLon,
    setMinConf,
    setSensitivity,
    setOverlap,
  } = useAnalysisSession();
  const audioRef = useRef<HTMLAudioElement>(null);
  const playStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyzeMutation = useAnalyzeAudio();
  const saveMutation = useSaveAnalysis();

  const handleFileSelect = (selectedFile: File) => {
    selectFile(selectedFile);
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
      const unique = deduplicateDetections(res.detections);
      toast.success(`Found ${unique.length} unique species across ${res.detections.length} detections.`);
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
      await saveMutation.mutateAsync({ data: { result, original_filename: file.name } });
      toast.success("Analysis saved to history!");
    } catch {
      toast.error("Failed to save analysis.");
    }
  };

  // Play from startTime to endTime, then auto-stop
  const playSegment = (startTime: number, endTime: number, key: string) => {
    if (!audioRef.current) return;
    // If already playing this segment, stop it
    if (activeKey === key) {
      audioRef.current.pause();
      if (playStopRef.current) clearTimeout(playStopRef.current);
      setActiveKey(null);
      return;
    }
    if (playStopRef.current) clearTimeout(playStopRef.current);
    audioRef.current.currentTime = startTime;
    audioRef.current.play();
    setActiveKey(key);
    const duration = Math.max(500, (endTime - startTime) * 1000);
    playStopRef.current = setTimeout(() => {
      audioRef.current?.pause();
      setActiveKey(null);
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (playStopRef.current) clearTimeout(playStopRef.current);
    };
  }, []);

  const uniqueDetections = result ? deduplicateDetections(result.detections) : [];
  const sessionState = analyzing
    ? "Analyzing"
    : result
      ? "Complete"
      : file
        ? "Ready to analyze"
        : "Awaiting upload";
  const fileSummary = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "No file selected";
  const detectionSummary = result
    ? `${uniqueDetections.length} unique / ${result.detections.length} total`
    : "No detections yet";

  return (
    <div className="max-w-6xl mx-auto w-full h-full space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/60 backdrop-blur-xl px-5 py-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-3 max-w-2xl"
          >
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              BirdNET analysis workspace
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight leading-tight">
                Listen to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">forest</span>.
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl font-light">
                Upload a field recording, tune detection settings, and review species in a compact view.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:max-w-2xl">
            {[
              { label: "Session", value: sessionState },
              { label: "File", value: fileSummary },
              { label: "Detections", value: detectionSummary },
            ].map((item) => (
              <Card key={item.label} className="bg-background/55 border-border/50 shadow-none">
                <CardContent className="p-4 space-y-1.5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">{item.label}</p>
                  <p className="text-sm font-medium text-foreground leading-snug">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_330px] items-start h-[calc(100%-7rem)] min-h-0">
        <div className="space-y-5 min-h-0 overflow-hidden">
          <Card className="border-primary/20 bg-card/60 backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-base font-serif flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                Analysis workspace
              </CardTitle>
              <CardDescription>
                Add a recording, then run BirdNET on the selected file.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {!file ? (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                  <FileUpload onFileSelect={handleFileSelect} />
                </motion.div>
              ) : analyzing ? (
                <AnalysisProgress fileSizeMb={file.size / 1024 / 1024} />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/45 p-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Music className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif font-bold truncate" title={file.name}>{file.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={clearFile}>
                        Change file
                      </Button>
                      <Button size="sm" className="flex-1 sm:flex-none bg-primary shadow-lg shadow-primary/20" onClick={handleAnalyze}>
                        Analyze recording
                      </Button>
                    </div>
                  </div>

                  {audioUrl && result && (
                    <div className="space-y-2 rounded-2xl border border-border/50 bg-background/45 p-4">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Playback - click a species below to hear its segment
                      </p>
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onPause={() => { if (playStopRef.current) clearTimeout(playStopRef.current); setActiveKey(null); }}
                        controls
                        className="w-full h-10 outline-none"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  )}

                  {result?.spectrogram_image && (
                    <div className="space-y-2 rounded-2xl border border-border/50 bg-background/45 p-4">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Spectrogram
                      </p>
                      <div className="overflow-hidden rounded-xl border border-border/40 bg-muted/20">
                        <img
                          src={result.spectrogram_image}
                          alt="Spectrogram generated from the uploaded audio"
                          className="w-full h-auto block"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {result && uniqueDetections.length > 0 && (
            <Card className="bg-card/60 backdrop-blur-md border-border/50 overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/50 pb-4">
                <div>
                  <CardTitle className="text-2xl font-serif">Field Notes</CardTitle>
                  <CardDescription className="mt-0.5">
                    {uniqueDetections.length} unique {uniqueDetections.length === 1 ? "species" : "species"} · {result.detections.length} total detections
                  </CardDescription>
                </div>
                <Button onClick={handleSave} disabled={saveMutation.isPending} variant="secondary" size="sm" className="shrink-0">
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-4 max-h-[calc(100vh-28rem)] overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {uniqueDetections.map((d) => {
                    const { color } = confidenceLabel(d.confidence);
                    return (
                      <span
                        key={d.scientific_name}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                          "bg-card/70 border-border/50 text-foreground"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full bg-current", color)} />
                        {d.common_name}
                      </span>
                    );
                  })}
                </div>

                <div className="grid gap-2">
                  {uniqueDetections.map((d, i) => (
                    <DetectionCard
                      key={d.scientific_name}
                      detection={d}
                      index={i}
                      onPlay={playSegment}
                      activeKey={activeKey}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result && uniqueDetections.length === 0 && (
            <Card className="bg-card/60 backdrop-blur-md border-dashed border-border/50">
              <CardContent className="text-center py-16">
                <Bird className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-serif text-muted-foreground">The forest is quiet</h3>
                <p className="text-sm text-muted-foreground/60 mt-2">No birds detected. Try lowering the minimum confidence.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 min-h-0 overflow-hidden">
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-base font-serif flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                Parameters
              </CardTitle>
              <CardDescription className="text-xs">Tune the model before running a new analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {[
                { label: "Min Confidence", value: minConf, onChange: setMinConf, min: 0, max: 1, step: 0.05, display: minConf[0].toFixed(2) },
                { label: "Sensitivity", value: sensitivity, onChange: setSensitivity, min: 0.5, max: 1.5, step: 0.1, display: sensitivity[0].toFixed(2) },
                { label: "Overlap", value: overlap, onChange: setOverlap, min: 0, max: 2.9, step: 0.1, display: `${overlap[0].toFixed(1)}s` },
              ].map(({ label, value, onChange, min, max, step, display }) => (
                <div key={label} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{label}</Label>
                    <span className="text-xs font-mono bg-background/50 px-2 py-0.5 rounded text-foreground">{display}</span>
                  </div>
                  <Slider value={value} onValueChange={onChange} min={min} max={max} step={step} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-base font-serif flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Location
              </CardTitle>
              <CardDescription className="text-xs">Improves species filtering and regional scoring.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {[
                { label: "Latitude", value: lat, onChange: setLat, placeholder: "42.500" },
                { label: "Longitude", value: lon, onChange: setLon, placeholder: "-76.200" },
              ].map(({ label, value, onChange, placeholder }) => (
                <div key={label} className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{label}</Label>
                  <Input
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    type="number"
                    step="any"
                    className="bg-background/50 font-mono text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
