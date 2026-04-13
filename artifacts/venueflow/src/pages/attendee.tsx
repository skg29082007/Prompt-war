import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  useListQueues, 
  useJoinQueue, 
  useListAlerts, 
  useListZones, 
  useLeaveQueue,
  useGetZone,
  useListQueueEntries,
  getListQueuesQueryKey, 
  getListAlertsQueryKey, 
  getListZonesQueryKey,
  getListQueueEntriesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, AlertCircle, ChevronRight, CheckCircle2, Ticket, MapPin, Coffee, Utensils, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function Attendee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null);
  const [attendeeName, setAttendeeName] = useState("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  const [activeQueueId, setActiveQueueId] = useState<number | null>(null);

  const { data: queues, isLoading: isLoadingQueues } = useListQueues({
    query: { queryKey: getListQueuesQueryKey(), refetchInterval: 30000 }
  });

  const { data: alerts } = useListAlerts(
    { resolved: false },
    { query: { queryKey: getListAlertsQueryKey({ resolved: false }), refetchInterval: 30000 } }
  );

  const { data: zones } = useListZones({
    query: { queryKey: getListZonesQueryKey(), refetchInterval: 60000 }
  });

  // Pulling queue entries to sync active entry
  const { data: activeQueueEntries } = useListQueueEntries(activeQueueId || 0, {
    query: {
      queryKey: getListQueueEntriesQueryKey(activeQueueId || 0),
      enabled: !!activeQueueId,
      refetchInterval: 10000
    }
  });

  const activeEntryDetails = activeQueueEntries?.find(e => e.id === activeEntryId);

  const joinQueue = useJoinQueue({
    mutation: {
      onSuccess: (data, variables) => {
        setIsJoinDialogOpen(false);
        setAttendeeName("");
        
        setActiveEntryId(data.id);
        setActiveQueueId(data.queueId);
        
        toast({ 
          title: "Successfully joined queue!", 
          description: `You are number ${data.position} in line.` 
        });
        queryClient.invalidateQueries({ queryKey: getListQueuesQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to join queue. It may be closed or full.", variant: "destructive" });
      }
    }
  });

  const leaveQueue = useLeaveQueue({
    mutation: {
      onSuccess: () => {
        setActiveEntryId(null);
        setActiveQueueId(null);
        toast({ title: "Left Queue", description: "You have left the virtual queue." });
        queryClient.invalidateQueries({ queryKey: getListQueuesQueryKey() });
      }
    }
  });

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueId || !attendeeName.trim()) return;
    
    joinQueue.mutate({
      id: selectedQueueId,
      data: { attendeeName }
    });
  };

  const handleLeaveQueue = () => {
    if (!activeEntryId) return;
    leaveQueue.mutate({ entryId: activeEntryId });
  };

  const getZoneIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('food') || n.includes('concession')) return <Utensils className="w-5 h-5 text-orange-400" />;
    if (n.includes('coffee') || n.includes('cafe')) return <Coffee className="w-5 h-5 text-amber-600" />;
    if (n.includes('gate') || n.includes('entrance')) return <Ticket className="w-5 h-5 text-primary" />;
    return <MapPin className="w-5 h-5 text-blue-400" />;
  };

  // Only show info or warning alerts to attendees, filter out critical system ones if needed
  const publicAlerts = alerts?.filter(a => a.severity !== 'critical' || a.type === 'gate_closed');

  const activeQueueInfo = queues?.find(q => q.id === activeQueueId);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col pb-20">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">V</span>
            VenueFlow
          </Link>
          <Badge variant="secondary" className="bg-secondary/50">Attendee Mode</Badge>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-6">
        
        {/* Active Ticket / Queue Status */}
        <AnimatePresence>
          {activeEntryDetails && activeQueueInfo && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.9 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6"
            >
              <Card className="border-primary bg-primary/5 shadow-lg shadow-primary/10 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-primary">Active Pass</p>
                      <h3 className="font-bold text-xl">{activeQueueInfo.zoneName}</h3>
                      <p className="text-xs text-muted-foreground capitalize mt-1">Status: {activeEntryDetails.status}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-col">
                      <span className="text-xs text-primary font-bold">#{activeEntryDetails.position}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Est. Wait</p>
                      <p className="font-mono text-xl">{activeEntryDetails.estimatedWaitMinutes} <span className="text-sm text-muted-foreground">min</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Ahead of you</p>
                      <p className="font-mono text-xl">{Math.max(0, activeEntryDetails.position - 1)}</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleLeaveQueue}
                    disabled={leaveQueue.isPending}
                  >
                    <X className="w-4 h-4 mr-2" /> Leave Queue
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Public Alerts */}
        {publicAlerts && publicAlerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Updates</h2>
            {publicAlerts.map(alert => (
              <div key={alert.id} className="bg-card border border-border rounded-xl p-3 flex gap-3 text-sm shadow-sm">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.zoneName}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Virtual Queues */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">Virtual Queues</h2>
            <span className="text-xs text-muted-foreground">Live updates</span>
          </div>

          {isLoadingQueues ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {queues?.filter(q => q.isOpen).map(queue => (
                <Card key={queue.id} className="overflow-hidden border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
                  <div className="flex p-4 items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      {getZoneIcon(queue.zoneName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate">{queue.zoneName}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {queue.estimatedWaitMinutes}m
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {queue.queueLength}
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant={queue.estimatedWaitMinutes > 20 ? "secondary" : "default"}
                      onClick={() => {
                        setSelectedQueueId(queue.id);
                        setIsJoinDialogOpen(true);
                      }}
                      disabled={activeEntryId !== null}
                    >
                      Join
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Zone Info Explorer */}
        {zones && zones.length > 0 && (
          <div className="space-y-4 mt-8">
             <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display">Explore Venue</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {zones.filter(z => z.type === 'restroom' || z.type === 'food_court').map(zone => (
                <Card key={zone.id} className="border-border bg-card">
                  <CardContent className="p-3">
                    <p className="font-bold text-sm truncate">{zone.name}</p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className={zone.status === 'critical' ? 'text-destructive' : zone.status === 'busy' ? 'text-orange-500' : 'text-green-500'}>
                        {zone.status}
                      </span>
                      {zone.waitTimeMinutes > 0 && <span className="text-muted-foreground">{zone.waitTimeMinutes}m wait</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <Card className="bg-secondary/30 border-dashed border-border mt-8">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Enjoy the event. Your digital pass will update automatically.</p>
          </CardContent>
        </Card>

      </main>

      {/* Join Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Join Virtual Queue</DialogTitle>
            <DialogDescription>
              {queues?.find(q => q.id === selectedQueueId)?.zoneName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinSubmit}>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Your Name</label>
                <Input 
                  id="name" 
                  placeholder="e.g. Alex" 
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>Estimated wait: <span className="font-bold">{queues?.find(q => q.id === selectedQueueId)?.estimatedWaitMinutes} mins</span>. We'll hold your spot.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsJoinDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!attendeeName.trim() || joinQueue.isPending}>
                {joinQueue.isPending ? "Joining..." : "Confirm & Join"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
