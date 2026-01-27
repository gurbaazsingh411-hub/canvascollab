import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { workspacesApi } from "@/lib/api";
import { Users, FileText, CheckSquare, Calendar, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkspaceMemberWithDetails {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    display_name: string;
    email: string;
    avatar_url: string;
  };
  files: any[];
  todos: any[];
}

export default function WorkspaceAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { workspaces } = useWorkspaces();

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const workspace = workspaces?.find((w) => w.id === id);

  // Derived values for access checking
  const isOwner = workspace?.owner_id === user?.id;
  const isUserAdmin = analyticsData?.members?.find((m: any) => m.user_id === user?.id)?.role === 'admin';

  // Initially allow fetch if id is present and it's the owner 
  // OR if we don't have analytics data yet (we'll check admin status after first fetch)
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const isOwner = workspace?.owner_id === user?.id;
    const isUserAdmin = analyticsData?.members?.find((m: any) => m.user_id === user?.id)?.role === 'admin';
    setHasAccess(isOwner || isUserAdmin);
  }, [workspace, user, analyticsData]);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchAnalyticsData = async () => {
      // If we already know we don't have access and it's not the first load, return
      const isOwner = workspace?.owner_id === user?.id;
      if (workspace && !isOwner && analyticsData && !hasAccess) {
        return;
      }
      setIsLoading(true);
      try {
        const data = await workspacesApi.getAnalytics(id);
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
    // Refresh every minute for current activity
    const interval = setInterval(fetchAnalyticsData, 60000);
    return () => clearInterval(interval);
  }, [id, hasAccess]);

  const handlePromote = async (userId: string) => {
    if (!id) return;
    try {
      await workspacesApi.updateMemberRole(id, userId, 'admin');
      const data = await workspacesApi.getAnalytics(id);
      setAnalyticsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const isOnline = (lastPing: string) => {
    if (!lastPing) return false;
    const last = new Date(lastPing).getTime();
    const now = Date.now();
    return (now - last) < 2 * 60 * 1000; // 2 minutes window
  };

  const getActiveFile = (userId: string) => {
    const active = analyticsData?.activity?.find((a: any) =>
      a.user_id === userId && isOnline(a.last_ping)
    );
    if (!active) return null;

    const doc = analyticsData?.documents?.find((d: any) => d.id === active.file_id);
    const sheet = analyticsData?.spreadsheets?.find((s: any) => s.id === active.file_id);
    return doc?.title || sheet?.title || "Unknown File";
  };

  const formatTimeSpent = (seconds: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (!hasAccess && !isLoading) {
    return (
      <AppLayout title="Analytics">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Only workspace owners and admins can view analytics.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`${workspace?.name || "Workspace"} Admin Dashboard`}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Workspace Status</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.members?.length || 0} Members</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.activity?.filter((a: any) => isOnline(a.last_ping)).length || 0} currently online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(analyticsData?.documents?.length || 0) + (analyticsData?.spreadsheets?.length || 0)} Files</div>
              <p className="text-xs text-muted-foreground">Documents & spreadsheets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Activity Level</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTimeSpent(analyticsData?.activity?.reduce((acc: number, curr: any) => acc + (curr.total_seconds_spent || 0), 0) || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total time spent across all files</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Member Activity & Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : analyticsData?.members?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No members in this workspace.</p>
            ) : (
              <div className="space-y-4">
                {analyticsData?.members?.map((member: any) => {
                  const userActivity = analyticsData?.activity?.filter((a: any) => a.user_id === member.user_id) || [];
                  const timeSpent = userActivity.reduce((acc: number, curr: any) => acc + (curr.total_seconds_spent || 0), 0);
                  const activeFile = getActiveFile(member.user_id);
                  const online = userActivity.some((a: any) => isOnline(a.last_ping));

                  return (
                    <div key={member.id} className="border rounded-lg p-5 hover:bg-muted/30 transition-all border-l-4" style={{ borderLeftColor: online ? 'var(--primary)' : 'transparent' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                              <AvatarImage src={member.profiles.avatar_url} />
                              <AvatarFallback>{member.profiles.display_name?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            {online && (
                              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{member.profiles.display_name || "Unknown User"}</h3>
                              {online && <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20 text-[10px] h-4">ONLINE</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={member.role === 'owner' ? "default" : member.role === 'admin' ? "secondary" : "outline"} className="capitalize h-5 text-[10px]">
                                {member.role}
                              </Badge>
                              {isOwner && member.role === 'member' && (
                                <Button variant="link" size="sm" className="h-auto p-0 text-[11px]" onClick={() => handlePromote(member.user_id)}>
                                  Promote to Admin
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Time Spent</p>
                            <p className="text-xl font-bold text-foreground">{formatTimeSpent(timeSpent)}</p>
                          </div>
                          {activeFile && (
                            <div className="text-right animate-pulse">
                              <p className="text-[10px] font-medium text-primary uppercase">Currently Working On</p>
                              <p className="text-sm font-semibold truncate max-w-[200px]">{activeFile}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Column 1: Todos */}
                        <div>
                          <h4 className="text-[10px] font-bold text-muted-foreground mb-3 flex items-center gap-1 uppercase tracking-widest">
                            <CheckSquare className="h-3 w-3" /> Workspace Tasks
                          </h4>
                          <div className="space-y-1.5">
                            {analyticsData?.todos?.filter((t: any) => t.user_id === member.user_id).length === 0 ? (
                              <p className="text-[10px] text-muted-foreground italic">No tasks assigned.</p>
                            ) : (
                              analyticsData?.todos?.filter((t: any) => t.user_id === member.user_id).slice(0, 5).map((todo: any) => (
                                <div key={todo.id} className="flex items-center gap-2 group">
                                  <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", todo.completed ? "bg-muted-foreground/30" : "bg-primary")} />
                                  <span className={cn("text-[11px] truncate", todo.completed ? "text-muted-foreground/50 line-through" : "text-foreground")}>
                                    {todo.content}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Column 2: File Breakdown */}
                        <div>
                          <h4 className="text-[10px] font-bold text-muted-foreground mb-3 flex items-center gap-1 uppercase tracking-widest">
                            <Clock className="h-3 w-3" /> Time Distribution
                          </h4>
                          <div className="space-y-2">
                            {userActivity.length === 0 ? (
                              <p className="text-[10px] text-muted-foreground italic">No time records found.</p>
                            ) : (
                              userActivity.sort((a, b) => b.total_seconds_spent - a.total_seconds_spent).slice(0, 3).map((a: any) => {
                                const fileName = analyticsData?.documents?.find((d: any) => d.id === a.file_id)?.title ||
                                  analyticsData?.spreadsheets?.find((s: any) => s.id === a.file_id)?.title ||
                                  "Deleted File";
                                return (
                                  <div key={a.id} className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                      <span className="truncate font-medium">{fileName}</span>
                                      <span className="text-muted-foreground">{formatTimeSpent(a.total_seconds_spent)}</span>
                                    </div>
                                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary/60"
                                        style={{ width: `${Math.min(100, (a.total_seconds_spent / (timeSpent || 1)) * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Column 3: Recent Activity */}
                        <div className="hidden lg:block">
                          <h4 className="text-[10px] font-bold text-muted-foreground mb-3 flex items-center gap-1 uppercase tracking-widest">
                            <Calendar className="h-3 w-3" /> Recent Activity
                          </h4>
                          <div className="space-y-2">
                            {analyticsData?.documents?.filter((d: any) => d.owner_id === member.user_id).slice(0, 2).map((d: any) => (
                              <div key={d.id} className="text-[10px] p-2 bg-muted/20 border border-border/40 rounded flex flex-col">
                                <span className="font-medium truncate">{d.title}</span>
                                <span className="text-[9px] text-muted-foreground">Created {new Date(d.created_at).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
