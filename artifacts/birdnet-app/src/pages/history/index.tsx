import { useListAnalyses, useDeleteAnalysis, getListAnalysesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, FileAudio, Trash2, ArrowRight } from "lucide-react";
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const analyses = data?.analyses || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Analysis History</h1>
        <p className="text-muted-foreground mt-2">Past recordings and their identified species.</p>
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
          <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-medium">No history yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">Analyze your first audio file to see it here.</p>
          <Button asChild>
            <Link href="/">Analyze Audio</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {analyses.map((record) => (
            <Card key={record.id} className="group hover-elevate transition-all">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-4">
                  <div className="flex-1 flex flex-col gap-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(record.analyzed_at), "MMM d, yyyy • h:mm a")}
                    </div>
                    <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                      <FileAudio className="w-5 h-5 text-primary" />
                      {record.filename}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm">
                      <span className="font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        {record.detection_count} detections
                      </span>
                      {record.top_species && (
                        <span className="text-muted-foreground">
                          Top species: <span className="font-semibold text-foreground">{record.top_species}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Analysis?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the analysis for "{record.filename}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(record.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button asChild className="gap-2">
                      <Link href={`/history/${record.id}`}>
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
import { History } from "lucide-react";