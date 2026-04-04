import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Music, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export function FileUpload({ 
  onFileSelect, 
  accept = {
    'audio/*': ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
  },
  maxSize = 50 * 1024 * 1024 // 50MB
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Max size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError("Invalid file type. Please upload an audio file.");
      } else {
        setError(rejection.errors[0]?.message || "Error uploading file");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [maxSize, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out flex flex-col items-center justify-center gap-4 bg-card hover:bg-muted/50",
          isDragActive && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          error && "border-destructive"
        )}
      >
        <input {...getInputProps()} />
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
          isDragActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
          error && "bg-destructive/10 text-destructive"
        )}>
          {error ? (
            <AlertCircle className="w-8 h-8" />
          ) : isDragActive ? (
            <UploadCloud className="w-8 h-8 animate-bounce" />
          ) : (
            <Music className="w-8 h-8" />
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-lg font-medium">
            {isDragActive ? "Drop the audio here" : "Drag & drop audio here"}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse from your computer
          </p>
        </div>

        {error && (
          <p className="text-sm font-medium text-destructive mt-2">{error}</p>
        )}
        
        <div className="text-xs text-muted-foreground/60 mt-4 flex items-center gap-2">
          <span>Supports WAV, MP3, M4A, FLAC</span>
          <span>•</span>
          <span>Max {Math.round(maxSize / 1024 / 1024)}MB</span>
        </div>
      </div>
    </div>
  );
}
