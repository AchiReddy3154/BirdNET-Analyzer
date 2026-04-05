import { useGetStats, useGetTopSpecies } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity, Bird, FileAudio, Hash } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";

export default function Stats() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: topSpeciesData, isLoading: speciesLoading } = useGetTopSpecies({ limit: 10 });

  if (statsLoading || speciesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
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
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      <div className="border-b border-border/50 pb-6 pt-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">Ecosystem Data</h1>
        <p className="text-muted-foreground mt-4 font-light text-lg">Aggregate intelligence from all your field recordings.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Field Notes" 
          value={stats?.total_analyses || 0} 
          icon={FileAudio} 
          color="text-primary"
          bg="bg-primary/20"
          delay={0}
        />
        <StatCard 
          title="Total Detections" 
          value={stats?.total_detections || 0} 
          icon={Activity} 
          color="text-secondary"
          bg="bg-secondary/20"
          delay={0.1}
        />
        <StatCard 
          title="Unique Species" 
          value={stats?.unique_species || 0} 
          icon={Bird} 
          color="text-accent"
          bg="bg-accent/20"
          delay={0.2}
        />
        <StatCard 
          title="Avg per File" 
          value={(stats?.avg_detections_per_analysis || 0).toFixed(1)} 
          icon={Hash} 
          color="text-muted-foreground"
          bg="bg-muted/50"
          delay={0.3}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 h-full">
            <CardHeader className="pb-8">
              <CardTitle className="font-serif text-2xl">Dominant Species</CardTitle>
            </CardHeader>
            <CardContent className="pl-0 pb-6">
              {chartData.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'var(--font-sans)' }} 
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        dy={10}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)' }} 
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        dx={-10}
                      />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--primary)/0.1)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card/90 backdrop-blur-xl border border-border shadow-xl rounded-xl p-4">
                                <p className="font-bold font-serif text-lg">{data.name}</p>
                                <p className="text-sm font-serif italic text-muted-foreground mb-3">{data.scientific}</p>
                                <div className="space-y-1 font-mono text-sm">
                                  <p><span className="text-muted-foreground uppercase tracking-wider text-[10px]">Count:</span> {data.count}</p>
                                  <p><span className="text-muted-foreground uppercase tracking-wider text-[10px]">Avg Conf:</span> {(data.avgConf * 100).toFixed(1)}%</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.4 + (0.6 * (10 - index) / 10)})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <BarChart className="w-16 h-16 mb-4" />
                  <p className="font-serif">Insufficient data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 h-full">
            <CardHeader className="pb-6">
              <CardTitle className="font-serif text-2xl">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {topSpeciesData?.species.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 font-serif italic">The ledger is empty.</p>
              ) : (
                <div className="space-y-4">
                  {topSpeciesData?.species.slice(0, 8).map((s, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center font-mono text-xs font-bold text-muted-foreground shrink-0 border border-border/50">
                          {i + 1}
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-sm truncate">{s.common_name}</p>
                          <p className="text-xs text-muted-foreground font-serif italic truncate">{s.scientific_name}</p>
                        </div>
                      </div>
                      <div className="font-mono text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 shrink-0">
                        {s.count}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, type: "spring", bounce: 0.4 }}>
      <Card className="bg-card/60 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors duration-300">
        <CardContent className="p-6 flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${bg} ${color}`}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
            <h4 className="text-3xl font-mono font-bold text-foreground">{value}</h4>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
