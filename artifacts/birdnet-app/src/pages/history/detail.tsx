import { useParams, Link } from "wouter";
import { useGetAnalysis } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, FileAudio, MapPin, Settings2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useWikipedia } from "@/hooks/use-wikipedia";
import { useState } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Detection } from "@workspace/api-client-react/src/generated/api.schemas";

function HistoryDetectionCard({ detection, index }: { detection: Detection; index: number }) {
  const { data: wiki } = useWikipedia(detection.common_name);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Card className="overflow-hidden hover:border-primary/50 transition-all duration-300 border-transparent bg-card/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <Collapsible open={isOpen}>
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50" />
            <div className="flex-1 pl-2">
              <h4 className="text-lg font-serif font-bold text-foreground">{detection.common_name}</h4>
              <p className="text-sm font-serif italic text-muted-foreground">{detection.scientific_name}</p>
            </div>
            
            <div className="flex items-center gap-6 sm:w-auto w-full justify-between sm:justify-end pl-2 sm:pl-0">
              <div className="w-32">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Confidence</span>
                  <span className="font-bold font-mono">{(detection.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full",
                      detection.confidence > 0.8 ? "bg-primary" : 
                      detection.confidence > 0.4 ? "bg-secondary" : "bg-accent"
                    )}
                    style={{ width: `${detection.confidence * 100}%` }}
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
                  <div className="p-4 pt-0 border-t border-border/50 bg-muted/10 ml-1">
                    <div className="flex gap-4 mt-4">
                      {wiki.thumbnail && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 shadow-md">
                          <img src={wiki.thumbnail.source} alt={detection.common_name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 text-sm space-y-2">
                        <p className="text-muted-foreground leading-relaxed line-clamp-3">{wiki.extract}</p>
                        {wiki.content_urls?.desktop && (
                          <a 
                            href={wiki.content_urls.desktop.page} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Read more <ExternalLink className="w-3.5 h-3.5" />
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

export default function HistoryDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: record, isLoading } = useGetAnalysis(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-32">
        <h2 className="text-3xl font-serif font-bold mb-4">Record not found</h2>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/history">Return to Archives</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 pt-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button asChild variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground rounded-full">
          <Link href="/history" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Archives
          </Link>
        </Button>
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 sm:p-10 shadow-xl shadow-black/5">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight truncate flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-inner">
              <FileAudio className="w-8 h-8" />
            </div>
            {record.filename}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-4 font-mono text-sm ml-[68px]">
            <Calendar className="w-4 h-4" />
            {format(new Date(record.analyzed_at), "MMMM d, yyyy 'at' h:mm a")}
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <h2 className="text-2xl font-serif font-bold">Detections</h2>
            <span className="font-mono text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">{record.detections.length} total</span>
          </div>
          
          {record.detections.length === 0 ? (
            <div className="text-center py-16 bg-card/30 rounded-2xl border border-dashed border-border/50">
              <p className="text-muted-foreground italic font-serif">No birds were detected in this recording.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {record.detections.map((d, i) => (
                <HistoryDetectionCard key={i} detection={d} index={i} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {record.location.lat != null && record.location.lon != null ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Latitude</span>
                      <span className="font-mono text-sm bg-background/50 px-2 py-1 rounded">{record.location.lat}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Longitude</span>
                      <span className="font-mono text-sm bg-background/50 px-2 py-1 rounded">{record.location.lon}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic font-serif">Location unknown</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card/60 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Parameters Used
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Min Conf</span>
                    <span className="font-mono text-sm bg-background/50 px-2 py-1 rounded">{record.settings.min_conf ?? 0.1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Sensitivity</span>
                    <span className="font-mono text-sm bg-background/50 px-2 py-1 rounded">{record.settings.sensitivity ?? 1.0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Overlap</span>
                    <span className="font-mono text-sm bg-background/50 px-2 py-1 rounded">{record.settings.overlap ?? 0.0}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
