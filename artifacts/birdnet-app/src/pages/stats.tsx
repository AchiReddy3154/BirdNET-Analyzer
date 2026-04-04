import { useGetStats, useGetTopSpecies } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity, Bird, FileAudio, Hash } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Stats() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: topSpeciesData, isLoading: speciesLoading } = useGetTopSpecies({ limit: 10 });

  if (statsLoading || speciesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const chartData = topSpeciesData?.species.map(s => ({
    name: s.common_name,
    count: s.count,
    scientific: s.scientific_name,
    avgConf: s.avg_confidence
  })) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Overview Statistics</h1>
        <p className="text-muted-foreground mt-2">Aggregate metrics across all your analyses.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Analyses" 
          value={stats?.total_analyses || 0} 
          icon={FileAudio} 
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatCard 
          title="Total Detections" 
          value={stats?.total_detections || 0} 
          icon={Activity} 
          color="text-secondary"
          bg="bg-secondary/10"
        />
        <StatCard 
          title="Unique Species" 
          value={stats?.unique_species || 0} 
          icon={Bird} 
          color="text-accent"
          bg="bg-accent/10"
        />
        <StatCard 
          title="Avg Detections/File" 
          value={(stats?.avg_detections_per_analysis || 0).toFixed(1)} 
          icon={Hash} 
          color="text-muted-foreground"
          bg="bg-muted"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Detected Species</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            {chartData.length > 0 ? (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border shadow-lg rounded-lg p-3">
                              <p className="font-bold text-popover-foreground">{data.name}</p>
                              <p className="text-sm font-serif italic text-muted-foreground mb-2">{data.scientific}</p>
                              <p className="text-sm"><span className="font-semibold">Count:</span> {data.count}</p>
                              <p className="text-sm"><span className="font-semibold">Avg Confidence:</span> {(data.avgConf * 100).toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.5 + (0.5 * (10 - index) / 10)})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Not enough data yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Species Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {topSpeciesData?.species.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No species recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {topSpeciesData?.species.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-6 text-center font-bold text-muted-foreground">{i + 1}</div>
                      <div className="truncate">
                        <p className="font-medium text-sm truncate">{s.common_name}</p>
                        <p className="text-xs text-muted-foreground font-serif italic truncate">{s.scientific_name}</p>
                      </div>
                    </div>
                    <div className="font-mono text-sm font-semibold bg-muted px-2 py-1 rounded-md">
                      {s.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h4 className="text-2xl font-bold text-foreground">{value}</h4>
        </div>
      </CardContent>
    </Card>
  );
}