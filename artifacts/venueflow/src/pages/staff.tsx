import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertTriangle, MessageSquare, Map as MapIcon, BarChart3, Users, AlertCircle, CheckCircle2, Check, Globe } from "lucide-react";
import GoogleMapsHeatmap from "@/components/GoogleMapsHeatmap";
import { 
  useGetZonesSummary, 
  useListZones, 
  useListAlerts, 
  useListStaffMessages, 
  useCreateStaffMessage, 
  useUpdateZoneOccupancy,
  useCreateAlert,
  useResolveAlert,
  getGetZonesSummaryQueryKey, 
  getListZonesQueryKey, 
  getListAlertsQueryKey, 
  getListStaffMessagesQueryKey 
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CreateStaffMessageBodyRole, CreateAlertBodyType, CreateAlertBodySeverity } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function Staff() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  
  // Occupancy Update State
  const [isUpdateOccupancyOpen, setIsUpdateOccupancyOpen] = useState(false);
  const [selectedZoneForUpdate, setSelectedZoneForUpdate] = useState<number | null>(null);
  const [newOccupancyCount, setNewOccupancyCount] = useState("");

  // Alert Creation State
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const [alertZoneId, setAlertZoneId] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<CreateAlertBodyType>(CreateAlertBodyType.general);
  const [alertSeverity, setAlertSeverity] = useState<CreateAlertBodySeverity>(CreateAlertBodySeverity.warning);

  const { data: summary, isLoading: isLoadingSummary } = useGetZonesSummary({
    query: { queryKey: getGetZonesSummaryQueryKey(), refetchInterval: 30000 }
  });

  const { data: zones, isLoading: isLoadingZones } = useListZones({
    query: { queryKey: getListZonesQueryKey(), refetchInterval: 30000 }
  });

  const { data: alerts, isLoading: isLoadingAlerts } = useListAlerts(
    { resolved: false },
    { query: { queryKey: getListAlertsQueryKey({ resolved: false }), refetchInterval: 30000 } }
  );

  const { data: messages, isLoading: isLoadingMessages } = useListStaffMessages({
    query: { queryKey: getListStaffMessagesQueryKey(), refetchInterval: 30000 }
  });

  const createMessage = useCreateStaffMessage({
    mutation: {
      onSuccess: () => {
        setMessageText("");
        toast({ title: "Message sent", description: "Your message has been broadcasted." });
        queryClient.invalidateQueries({ queryKey: getListStaffMessagesQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      }
    }
  });

  const updateOccupancy = useUpdateZoneOccupancy({
    mutation: {
      onSuccess: () => {
        setIsUpdateOccupancyOpen(false);
        setNewOccupancyCount("");
        toast({ title: "Zone updated", description: "Occupancy count has been updated." });
        queryClient.invalidateQueries({ queryKey: getListZonesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetZonesSummaryQueryKey() });
      }
    }
  });

  const createAlert = useCreateAlert({
    mutation: {
      onSuccess: () => {
        setIsCreateAlertOpen(false);
        setAlertMessage("");
        toast({ title: "Alert Created", description: "Alert broadcasted to venue." });
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey({ resolved: false }) });
        queryClient.invalidateQueries({ queryKey: getGetZonesSummaryQueryKey() });
      }
    }
  });

  const resolveAlert = useResolveAlert({
    mutation: {
      onSuccess: () => {
        toast({ title: "Alert Resolved", description: "Alert marked as resolved." });
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey({ resolved: false }) });
        queryClient.invalidateQueries({ queryKey: getGetZonesSummaryQueryKey() });
      }
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    createMessage.mutate({
      data: {
        author: "Command Center", 
        role: CreateStaffMessageBodyRole.operations,
        message: messageText,
      }
    });
  };

  const handleUpdateOccupancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneForUpdate || !newOccupancyCount) return;
    updateOccupancy.mutate({
      id: selectedZoneForUpdate,
      data: { currentCount: parseInt(newOccupancyCount, 10) }
    });
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertZoneId || !alertMessage) return;
    createAlert.mutate({
      data: {
        zoneId: parseInt(alertZoneId, 10),
        message: alertMessage,
        type: alertType,
        severity: alertSeverity
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-destructive text-destructive-foreground";
      case "busy": return "bg-orange-500 text-white";
      case "normal": return "bg-green-500 text-white";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case "warning": return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "info": return <Activity className="w-5 h-5 text-primary" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <Activity className="w-6 h-6 pulse-glow" />
              <span className="font-bold text-lg hidden sm:inline-block">VenueFlow Command</span>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hidden sm:inline-flex">
              LIVE
            </Badge>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="destructive" size="sm" onClick={() => setIsCreateAlertOpen(true)}>
              <AlertTriangle className="w-4 h-4 mr-2" /> New Alert
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/analytics"><BarChart3 className="w-4 h-4 mr-2" /> Analytics</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card shadow-lg border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Occupancy</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? <Skeleton className="h-8 w-24" /> : (
                <div className="flex flex-col">
                  <span className="text-3xl font-bold">{summary?.totalAttendees.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {summary?.overallOccupancyPercent}% of {summary?.totalCapacity.toLocaleString()} capacity
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-card shadow-lg border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical Zones</CardTitle>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-destructive">{summary?.criticalZones}</span>
                  <span className="text-xs text-muted-foreground mt-1">Require immediate attention</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-orange-500">{summary?.activeAlerts}</span>
                  <span className="text-xs text-muted-foreground mt-1">Unresolved incidents</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Wait Time</CardTitle>
              <Activity className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
                <div className="flex flex-col">
                  <span className="text-3xl font-bold">{summary?.avgWaitTimeMinutes}m</span>
                  <span className="text-xs text-muted-foreground mt-1">Across all active queues</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="zones" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-card border border-border p-1 h-12 rounded-xl">
            <TabsTrigger value="zones" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><MapIcon className="w-4 h-4 mr-2" /> Zone Monitor</TabsTrigger>
            <TabsTrigger value="gmaps" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><Globe className="w-4 h-4 mr-2" /> Live Map</TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><AlertTriangle className="w-4 h-4 mr-2" /> Alerts {alerts && alerts.length > 0 && <Badge variant="destructive" className="ml-2 px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">{alerts.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><MessageSquare className="w-4 h-4 mr-2" /> Comms</TabsTrigger>
          </TabsList>

          <TabsContent value="zones" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="h-full border-border shadow-xl overflow-hidden">
                  <CardHeader className="bg-card border-b border-border">
                    <CardTitle>Live Venue Map</CardTitle>
                    <CardDescription>Real-time zone occupancy heatmap</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 relative min-h-[400px] bg-secondary/10 flex items-center justify-center">
                    {isLoadingZones ? (
                      <Skeleton className="w-full h-[400px]" />
                    ) : (
                      <div className="w-full h-[400px] relative p-8">
                        {/* Fake SVG Map Grid representing a stadium */}
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <rect x="0" y="0" width="100" height="100" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="5,5" />
                          <circle cx="50" cy="50" r="30" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
                          <circle cx="50" cy="50" r="15" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
                          
                          {zones?.map((zone) => {
                            // Determine color based on occupancy
                            let color = "hsl(var(--primary))";
                            let opacity = 0.2 + (zone.occupancyPercent / 100) * 0.8;
                            
                            if (zone.status === "critical") color = "hsl(var(--destructive))";
                            else if (zone.status === "busy") color = "hsl(24.6, 95%, 53.1%)"; // orange

                            return (
                              <g key={zone.id} className="transition-all duration-1000 ease-in-out cursor-pointer hover:opacity-80" onClick={() => {
                                setSelectedZoneForUpdate(zone.id);
                                setNewOccupancyCount(zone.currentCount.toString());
                                setIsUpdateOccupancyOpen(true);
                              }}>
                                <circle 
                                  cx={zone.x} 
                                  cy={zone.y} 
                                  r={4 + (zone.capacity / 1000)} 
                                  fill={color}
                                  fillOpacity={opacity}
                                  className={zone.status === "critical" ? "pulse-glow" : ""}
                                />
                                <circle 
                                  cx={zone.x} 
                                  cy={zone.y} 
                                  r={4 + (zone.capacity / 1000)} 
                                  fill="none"
                                  stroke={color}
                                  strokeWidth="1"
                                />
                                <text 
                                  x={zone.x} 
                                  y={zone.y + (6 + (zone.capacity / 1000))} 
                                  fontSize="3" 
                                  fill="hsl(var(--foreground))" 
                                  textAnchor="middle"
                                  className="font-mono"
                                >
                                  {zone.occupancyPercent}%
                                </text>
                              </g>
                            )
                          })}
                        </svg>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Zone Details
                </h3>
                <div className="space-y-3 h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                  {isLoadingZones ? (
                    Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                  ) : (
                    zones?.sort((a,b) => b.occupancyPercent - a.occupancyPercent).map((zone) => (
                      <Card key={zone.id} className="border-border bg-card hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold">{zone.name}</h4>
                              <p className="text-xs text-muted-foreground capitalize">{zone.type.replace('_', ' ')}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className={getStatusColor(zone.status)}>{zone.status}</Badge>
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs h-auto py-1" onClick={() => {
                                setSelectedZoneForUpdate(zone.id);
                                setNewOccupancyCount(zone.currentCount.toString());
                                setIsUpdateOccupancyOpen(true);
                              }}>
                                Update
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{zone.currentCount} / {zone.capacity}</span>
                              <span className="font-bold">{zone.occupancyPercent}%</span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${zone.status === 'critical' ? 'bg-destructive' : zone.status === 'busy' ? 'bg-orange-500' : 'bg-primary'}`} 
                                style={{ width: `${Math.min(100, zone.occupancyPercent)}%` }}
                              />
                            </div>
                            {zone.waitTimeMinutes > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground flex items-center">
                                <Activity className="w-3 h-3 mr-1 text-primary" />
                                {zone.waitTimeMinutes}m wait
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gmaps" className="mt-0">
            <Card className="border-border shadow-xl overflow-hidden">
              <CardHeader className="bg-card border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" /> Google Maps Live Heatmap
                </CardTitle>
                <CardDescription>Real-time crowd density overlaid on venue satellite view. Brighter = more congested.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingZones ? (
                  <Skeleton className="w-full h-[520px]" />
                ) : (
                  <GoogleMapsHeatmap
                    className="w-full h-[520px]"
                    points={(zones ?? []).map((zone) => ({
                      lat: 34.0136 + (zone.y - 50) * 0.0004,
                      lng: -118.2878 + (zone.x - 50) * 0.0006,
                      weight: zone.occupancyPercent / 100,
                      label: zone.name,
                    }))}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <Card className="border-border shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Alerts</CardTitle>
                  <CardDescription>Live incident reports requiring attention</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAlerts ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : alerts?.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">All Clear</h3>
                    <p className="text-muted-foreground">No active alerts at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {alerts?.map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-4 rounded-xl border flex gap-4 items-center ${
                            alert.severity === 'critical' ? 'bg-destructive/10 border-destructive/30' :
                            alert.severity === 'warning' ? 'bg-orange-500/10 border-orange-500/30' :
                            'bg-primary/10 border-primary/30'
                          }`}
                        >
                          <div className="mt-1 self-start">{getSeverityIcon(alert.severity)}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-foreground">{alert.message}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs bg-background/50">{alert.zoneName}</Badge>
                              <Badge variant="outline" className="text-xs capitalize bg-background/50">{alert.type.replace('_', ' ')}</Badge>
                            </div>
                          </div>
                          <div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => resolveAlert.mutate({ id: alert.id })}
                              disabled={resolveAlert.isPending}
                              className="border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-500"
                            >
                              <Check className="w-4 h-4 mr-1" /> Resolve
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <Card className="border-border shadow-xl h-[600px] flex flex-col">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle>Staff Comms</CardTitle>
                <CardDescription>Coordinate with operations team</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-3/4" />
                      <Skeleton className="h-16 w-1/2 ml-auto" />
                      <Skeleton className="h-16 w-2/3" />
                    </div>
                  ) : (
                    messages?.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.author === 'Command Center' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.author === 'Command Center' 
                            ? 'bg-primary text-primary-foreground rounded-br-sm' 
                            : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="font-medium">{msg.author} ({msg.role})</span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.zoneName && (
                            <>
                              <span>•</span>
                              <span className="text-primary">{msg.zoneName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-border bg-card">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input 
                      placeholder="Type a message..." 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="bg-background border-border"
                      disabled={createMessage.isPending}
                    />
                    <Button type="submit" disabled={createMessage.isPending || !messageText.trim()}>
                      {createMessage.isPending ? "Sending..." : "Send"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Update Occupancy Dialog */}
      <Dialog open={isUpdateOccupancyOpen} onOpenChange={setIsUpdateOccupancyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Zone Occupancy</DialogTitle>
            <DialogDescription>
              {zones?.find(z => z.id === selectedZoneForUpdate)?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateOccupancy}>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Current Headcount</label>
              <Input 
                type="number" 
                value={newOccupancyCount}
                onChange={(e) => setNewOccupancyCount(e.target.value)}
                min="0"
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUpdateOccupancyOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateOccupancy.isPending}>
                {updateOccupancy.isPending ? "Updating..." : "Update Headcount"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Alert Dialog */}
      <Dialog open={isCreateAlertOpen} onOpenChange={setIsCreateAlertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Broadcast Alert</DialogTitle>
            <DialogDescription>
              Create a new operational alert
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAlert}>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Zone</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={alertZoneId}
                  onChange={(e) => setAlertZoneId(e.target.value)}
                  required
                >
                  <option value="">Select a zone</option>
                  {zones?.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as CreateAlertBodyType)}
                  required
                >
                  {Object.values(CreateAlertBodyType).map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Severity</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value as CreateAlertBodySeverity)}
                  required
                >
                  {Object.values(CreateAlertBodySeverity).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Input 
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  required
                  placeholder="Describe the incident"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateAlertOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={createAlert.isPending}>
                {createAlert.isPending ? "Broadcasting..." : "Broadcast Alert"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

