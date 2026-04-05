import { useListAnalyses, useDeleteAnalysis, getListAnalysesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, FileAudio, Trash2, ArrowRight, History } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

export default function HistoryList() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useListAnalyses();
  const deleteMutation = useDeleteAnalysis();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
      toast.success("Analysis deleted");
    } catch (error) {
      toast.error("Failed to delete analysis");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const analyses = data?.analyses || [];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      <div className="border-b border-border/50 pb-6 pt-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">Archives</h1>
        <p className="text-muted-foreground mt-4 font-light text-lg">Your historical field recordings and findings.</p>
      </div>

      {analyses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 bg-card/30 backdrop-blur-sm rounded-3xl border border-dashed border-border/50"
        >
          <History className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
          <h3 className="text-2xl font-serif font-medium mb-2">No records yet</h3>
          <p className="text-muted-foreground mb-8">Your saved analyses will appear here.</p>
          <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
            <Link href="/">Start Analyzing</Link>
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {analyses.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Card className="group hover:border-primary/40 hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 gap-6">
                    <div className="flex-1 flex flex-col gap-2 min-w-0 w-full">
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(record.analyzed_at), "MMM d, yyyy • h:mm a")}
                      </div>
                      <h3 className="font-serif font-bold text-xl truncate flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <FileAudio className="w-5 h-5" />
                        </div>
                        {record.filename}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm">
                        <span className="font-mono text-xs bg-muted/50 border border-border/50 px-2 py-1 rounded-md">
                          <strong className="text-primary">{record.detection_count}</strong> detections
                        </span>
                        {record.top_species && (
                          <span className="text-muted-foreground italic font-serif">
                            Prominent: <span className="font-medium text-foreground not-italic">{record.top_species}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end border-t sm:border-t-0 border-border/50 pt-4 sm:pt-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-serif">Delete Record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the analysis for "{record.filename}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(record.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button asChild className="gap-2 rounded-full shadow-md transition-transform group-hover:-translate-y-0.5 group-hover:shadow-primary/20">
                        <Link href={`/history/${record.id}`}>
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
