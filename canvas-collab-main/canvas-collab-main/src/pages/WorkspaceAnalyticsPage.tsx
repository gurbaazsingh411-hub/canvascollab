import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { workspacesApi } from "@/lib/api";
import { Users, FileText, CheckSquare, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface WorkspaceMemberWithDetails {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: {
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
  
  // Check if current user is the workspace owner
  const isOwner = workspace?.owner_id === user?.id;

  useEffect(() => {
    if (!isOwner || !id) {
      setIsLoading(false);
      return;
    }
    
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      
      try {
        const data = await workspacesApi.getAnalytics(id);
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        // Even if there's an error, we still want to set whatever data we could retrieve
        // The error handling is already built into the API functions
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [isOwner, id]);

  if (!isOwner) {
    return (
      <AppLayout title="Analytics">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Only workspace owners can view analytics.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`${workspace?.name || "Workspace"} Analytics`}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.members?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Active members in workspace</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.totalFiles || 0}</div>
              <p className="text-xs text-muted-foreground">Documents & spreadsheets</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.pendingTodos || 0}</div>
              <p className="text-xs text-muted-foreground">Uncompleted to-dos</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
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
                {analyticsData?.members?.map((member: any) => (
                  <div key={member.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={member.profile.avatar_url} />
                          <AvatarFallback>{member.profile.display_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{member.profile.display_name || "Unknown User"}</h3>
                          <p className="text-sm text-muted-foreground">{member.profile.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="capitalize">
                              {member.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{member.files.length}</span>
                            <span className="text-muted-foreground">files</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm mt-1">
                            <CheckSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {member.todos.filter((t: any) => !t.completed).length}
                            </span>
                            <span className="text-muted-foreground">tasks</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Member's recent files */}
                    {member.files.length > 0 && (
                      <div className="mt-4 ml-12">
                        <h4 className="text-sm font-medium mb-2">Recent Files</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {member.files.slice(0, 3).map((file: any) => (
                            <div key={file.id} className="flex items-center gap-2 p-2 bg-background rounded border text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{file.title}</span>
                            </div>
                          ))}
                          {member.files.length > 3 && (
                            <div className="p-2 text-sm text-muted-foreground">
                              +{member.files.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Member's pending tasks */}
                    {member.todos.length > 0 && (
                      <div className="mt-4 ml-12">
                        <h4 className="text-sm font-medium mb-2">Pending Tasks</h4>
                        <div className="space-y-1">
                          {member.todos.filter((t: any) => !t.completed).slice(0, 3).map((todo: any) => (
                            <div key={todo.id} className="flex items-center gap-2 p-2 bg-background rounded border text-sm">
                              <CheckSquare className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{todo.content}</span>
                            </div>
                          ))}
                          {member.todos.filter((t: any) => !t.completed).length > 3 && (
                            <div className="p-2 text-sm text-muted-foreground">
                              +{member.todos.filter((t: any) => !t.completed).length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}