import { useParams, Link } from "wouter";
import { useGetAnalysis } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, FileAudio, MapPin, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HistoryDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: record, isLoading } = useGetAnalysis(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Analysis not found</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href="/history">Return to History</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <Button asChild variant="ghost" className="mb-4 -ml-4 text-muted-foreground">
          <Link href="/history" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </Link>
        </Button>
        <h1 className="text-3xl font-serif font-bold tracking-tight truncate flex items-center gap-3">
          <FileAudio className="w-8 h-8 text-primary" />
          {record.filename}
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-2">
          <Calendar className="w-4 h-4" />
          {format(new Date(record.analyzed_at), "MMMM d, yyyy 'at' h:mm a")}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-bold">Detections ({record.detections.length})</h2>
          
          {record.detections.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed">
              <p className="text-muted-foreground">No birds were detected in this recording.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {record.detections.map((d, i) => (
                <Card key={i} className="overflow-hidden border-l-4 border-l-primary">
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

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {record.location.lat != null && record.location.lon != null ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Latitude</span>
                    <span className="font-mono text-sm">{record.location.lat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Longitude</span>
                    <span className="font-mono text-sm">{record.location.lon}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No location provided</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Min Confidence</span>
                  <span className="font-mono text-sm">{record.settings.min_conf ?? 0.1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Sensitivity</span>
                  <span className="font-mono text-sm">{record.settings.sensitivity ?? 1.0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Overlap</span>
                  <span className="font-mono text-sm">{record.settings.overlap ?? 0.0}s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
