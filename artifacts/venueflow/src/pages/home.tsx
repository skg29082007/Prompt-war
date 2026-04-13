import { Link } from "wouter";
import { Shield, Users, Activity, ChevronRight, LogIn, LogOut, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, loading, signInWithGoogle, signOutUser } = useFirebaseAuth();
  const { permissionGranted, enable } = useNotifications();
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    const token = await enable();
    if (token) {
      toast({ title: "Notifications enabled", description: "You'll receive live venue alerts." });
    } else {
      toast({ title: "Notifications blocked", description: "Please allow notifications in your browser.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top auth bar */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        {!permissionGranted && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleEnableNotifications}>
            <Bell className="w-4 h-4" /> Enable Alerts
          </Button>
        )}
        {loading ? null : user ? (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} />
              <AvatarFallback>{user.displayName?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hidden md:block">{user.displayName}</span>
            <Button variant="ghost" size="sm" onClick={signOutUser} className="gap-2">
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={signInWithGoogle} className="gap-2">
            <LogIn className="w-4 h-4" /> Sign in with Google
          </Button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10 mb-12"
      >
        <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-card border border-border shadow-2xl">
          <Activity className="w-8 h-8 text-primary pulse-glow" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">VenueFlow</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
          Real-time physical event experience management system.
        </p>
        {user && (
          <p className="mt-3 text-sm text-primary">
            Welcome back, {user.displayName?.split(" ")[0]}
          </p>
        )}
        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-primary pulse-glow" />
          Live Event: Championship Finals
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl z-10"
      >
        <Link href="/staff" className="group block relative overflow-hidden rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors p-8 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Staff Command</h2>
            <p className="text-muted-foreground mb-8 flex-1">
              Mission-critical operations, zone occupancy, real-time alerts, and team coordination.
            </p>
            <div className="flex items-center text-primary font-medium">
              Enter Dashboard <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link href="/attendee" className="group block relative overflow-hidden rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors p-8 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Attendee View</h2>
            <p className="text-muted-foreground mb-8 flex-1">
              Mobile-first experience. View wait times, join virtual queues, and get event updates.
            </p>
            <div className="flex items-center text-primary font-medium">
              Join Event <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
