import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { useAnalyzeAudio, useSaveAnalysis } from "@workspace/api-client-react";
import type { AnalysisResult } from "@workspace/api-client-react/src/generated/api.schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Settings2, Save, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
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
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setAnalyzing(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (lat) formData.append("lat", lat);
      if (lon) formData.append("lon", lon);
      formData.append("min_conf", minConf[0].toString());
      formData.append("sensitivity", sensitivity[0].toString());
      formData.append("overlap", overlap[0].toString());

      // The hook uses customFetch, but since it's multipart/form-data, we need to pass the FormData directly
      // Wait, the API spec says `AnalyzeAudioBody` is `{ file: Blob, lat?: number, ... }`
      // The generated hook `analyzeAudio(data: BodyType<AnalyzeAudioBody>)` handles building the FormData internally.
      // So we can just pass the object! Let's check `api.ts`.
      
      const res = await analyzeMutation.mutateAsync({
        data: {
          file,
          lat: lat ? parseFloat(lat) : undefined,
          lon: lon ? parseFloat(lon) : undefined,
          min_conf: minConf[0],
          sensitivity: sensitivity[0],
          overlap: overlap[0]
        }
      } as any); // Type assertion if needed
      
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight">
          Discover the birds in your audio
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload a recording from your phone or field recorder. BirdNET will analyze the audio and identify the species present.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
          {!file ? (
            <FileUpload onFileSelect={handleFileSelect} />
          ) : (
            <Card className="border-primary/20 shadow-md">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 truncate">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Music className="w-6 h-6" />
                  </div>
                  <div className="truncate">
                    <h3 className="font-medium truncate" title={file.name}>{file.name}</h3>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setFile(null); setResult(null); }}>
                    Change
                  </Button>
                  <Button onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Results</h2>
                  <p className="text-muted-foreground">Found {result.detections.length} detections</p>
                </div>
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <Save className="w-4 h-4 mr-2" />
                  Save to History
                </Button>
              </div>

              {result.detections.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-dashed">
                  <Bird className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No birds detected</h3>
                  <p className="text-sm text-muted-foreground/80 mt-1">Try lowering the minimum confidence or using a clearer recording.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {result.detections.map((d, i) => (
                    <Card key={i} className="overflow-hidden hover-elevate transition-all border-l-4 border-l-primary" style={{ animationDelay: `${i * 50}ms` }}>
                      <CardContent className="p-4 flex sm:items-center flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-foreground">{d.common_name}</h4>
                          <p className="text-sm font-serif italic text-muted-foreground">{d.scientific_name}</p>
                        </div>
                        
                        <div className="flex-1 max-w-[200px] w-full">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground font-medium">Confidence</span>
                            <span className="font-bold">{(d.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                d.confidence > 0.8 ? "bg-primary" : 
                                d.confidence > 0.4 ? "bg-secondary" : "bg-accent"
                              )}
                              style={{ width: `${d.confidence * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-right sm:w-24 shrink-0 text-sm font-mono text-muted-foreground bg-muted/50 py-1 px-2 rounded-md">
                          {d.start_time.toFixed(1)}s - {d.end_time.toFixed(1)}s
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Analysis Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Min Confidence</Label>
                  <span className="text-sm text-muted-foreground font-mono">{minConf[0].toFixed(2)}</span>
                </div>
                <Slider value={minConf} onValueChange={setMinConf} max={1} step={0.05} />
                <p className="text-xs text-muted-foreground">Filter out low-confidence predictions.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Sensitivity</Label>
                  <span className="text-sm text-muted-foreground font-mono">{sensitivity[0].toFixed(2)}</span>
                </div>
                <Slider value={sensitivity} onValueChange={setSensitivity} min={0.5} max={1.5} step={0.1} />
                <p className="text-xs text-muted-foreground">Adjust model sensitivity (1.0 is default).</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Overlap</Label>
                  <span className="text-sm text-muted-foreground font-mono">{overlap[0].toFixed(1)}s</span>
                </div>
                <Slider value={overlap} onValueChange={setOverlap} max={2.9} step={0.1} />
                <p className="text-xs text-muted-foreground">Overlap between 3s audio chunks.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location Context
              </CardTitle>
              <CardDescription>Improve accuracy by providing location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input 
                    placeholder="e.g. 42.5" 
                    value={lat} 
                    onChange={e => setLat(e.target.value)} 
                    type="number"
                    step="any"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input 
                    placeholder="e.g. -76.2" 
                    value={lon} 
                    onChange={e => setLon(e.target.value)}
                    type="number"
                    step="any"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { Bird } from "lucide-react";