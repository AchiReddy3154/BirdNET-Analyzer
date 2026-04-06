import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Detection = {
  start_time: number;
  end_time: number;
  scientific_name: string;
  common_name: string;
  confidence: number;
};

export type AnalysisResult = {
  file: string;
  spectrogram_image?: string | null;
  detections: Detection[];
  location: {
    lat?: number | null;
    lon?: number | null;
    week?: number | null;
  };
  settings: {
    min_conf?: number;
    sensitivity?: number;
    overlap?: number;
  };
};

type AnalysisContextValue = {
  file: File | null;
  audioUrl: string | null;
  analyzing: boolean;
  result: AnalysisResult | null;
  activeKey: string | null;
  lat: string;
  lon: string;
  minConf: number[];
  sensitivity: number[];
  overlap: number[];
  selectFile: (file: File) => void;
  clearFile: () => void;
  setAnalyzing: (value: boolean) => void;
  setResult: (result: AnalysisResult | null) => void;
  setActiveKey: (value: string | null) => void;
  setLat: (value: string) => void;
  setLon: (value: string) => void;
  setMinConf: (value: number[]) => void;
  setSensitivity: (value: number[]) => void;
  setOverlap: (value: number[]) => void;
  clearSession: () => void;
};

const AnalysisContext = createContext<AnalysisContextValue | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");
  const [minConf, setMinConf] = useState([0.1]);
  const [sensitivity, setSensitivity] = useState([1.0]);
  const [overlap, setOverlap] = useState([0.0]);

  const revokeAudioUrl = (value: string | null) => {
    if (value && typeof URL !== "undefined") {
      URL.revokeObjectURL(value);
    }
  };

  const selectFile = (selectedFile: File) => {
    setFile((currentFile) => {
      void currentFile;
      return selectedFile;
    });

    setResult(null);
    setActiveKey(null);

    setAudioUrl((currentUrl) => {
      revokeAudioUrl(currentUrl);
      return URL.createObjectURL(selectedFile);
    });
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setActiveKey(null);
    setAnalyzing(false);
    setAudioUrl((currentUrl) => {
      revokeAudioUrl(currentUrl);
      return null;
    });
  };

  const clearSession = () => {
    clearFile();
    setLat("");
    setLon("");
    setMinConf([0.1]);
    setSensitivity([1.0]);
    setOverlap([0.0]);
  };

  const value = useMemo<AnalysisContextValue>(
    () => ({
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
      clearSession,
    }),
    [
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
    ],
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysisSession(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error("useAnalysisSession must be used inside AnalysisProvider");
  }
  return ctx;
}
