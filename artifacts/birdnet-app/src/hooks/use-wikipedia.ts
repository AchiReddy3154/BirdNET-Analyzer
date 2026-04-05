import { useQuery } from "@tanstack/react-query";

export interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page: string } };
}

export function useWikipedia(commonName: string) {
  return useQuery({
    queryKey: ["wikipedia", commonName],
    queryFn: async () => {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(commonName)}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch from Wikipedia");
      }
      return res.json() as Promise<WikiSummary>;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    retry: 1
  });
}
