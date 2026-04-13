import { Link } from "wouter";
import { Activity, Download, ArrowLeft, BarChart3, Clock, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  useGetPeakTimes, 
  useGetAvgWaitTimes, 
  useListIncidents,
  getGetPeakTimesQueryKey,
  getGetAvgWaitTimesQueryKey,
  getListIncidentsQueryKey
} from "@workspace/api-client-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

export default function Analytics() {
  const { data: peakTimes, isLoading: isLoadingPeak } = useGetPeakTimes({
    query: { queryKey: getGetPeakTimesQueryKey() }
  });

  const { data: waitTimes, isLoading: isLoadingWait } = useGetAvgWaitTimes({
    query: { queryKey: getGetAvgWaitTimesQueryKey() }
  });

  const { data: incidents, isLoading: isLoadingIncidents } = useListIncidents({
    query: { queryKey: getListIncidentsQueryKey() }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/staff"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <div className="flex items-center gap-2 text-primary">
              <BarChart3 className="w-5 h-5" />
              <span className="font-bold text-lg hidden sm:inline-block">Post-Event Analytics</span>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Crowd Density Over Time */}
          <Card className="border-border shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Crowd Density Over Time</CardTitle>
              <CardDescription>Total venue attendees recorded by hour</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPeak ? (
                <Skeleton className="w-full h-[300px]" />
              ) : (
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={peakTimes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area type="monotone" dataKey="attendees" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendees)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wait Times by Zone */}
          <Card className="border-border shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Wait Time Analysis</CardTitle>
              <CardDescription>Average vs Peak wait times across functional zones</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingWait ? (
                <Skeleton className="w-full h-[300px]" />
              ) : (
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={waitTimes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="zoneName" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} unit="m" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        cursor={{ fill: 'hsl(var(--secondary)/0.5)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="avgWaitMinutes" name="Avg Wait" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="peakWaitMinutes" name="Peak Wait" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Incident Log */}
        <Card className="border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertOctagon className="w-5 h-5 text-primary"/> Incident Log</CardTitle>
            <CardDescription>Record of all critical events and resolution times</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingIncidents ? (
              <div className="space-y-2">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/50">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Time</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Incident Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resolution Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No incidents recorded.</TableCell>
                      </TableRow>
                    ) : (
                      incidents?.map((incident) => {
                        const start = new Date(incident.occurredAt);
                        const end = incident.resolvedAt ? new Date(incident.resolvedAt) : null;
                        const duration = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;

                        return (
                          <TableRow key={incident.id} className="border-border">
                            <TableCell className="font-mono text-xs whitespace-nowrap">
                              {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </TableCell>
                            <TableCell className="font-medium">{incident.zoneName}</TableCell>
                            <TableCell className="capitalize">{incident.type.replace('_', ' ')}</TableCell>
                            <TableCell>
                              <Badge variant={incident.severity === 'critical' ? 'destructive' : 'outline'} className={incident.severity === 'critical' ? '' : 'text-orange-500 border-orange-500/50'}>
                                {incident.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {incident.resolvedAt ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Resolved</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 pulse-glow">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {duration ? `${duration} mins` : '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
