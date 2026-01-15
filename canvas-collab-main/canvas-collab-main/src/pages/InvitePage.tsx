import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { workspacesApi } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "joining" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Invalid invite link");
      return;
    }

    const checkInvite = async () => {
      try {
        // We'll check if user is authenticated via the useAuth hook
        if (!user) {
          // User needs to sign in first
          navigate(`/auth?redirect=/invite/${token}`);
          return;
        }

        // We'll fetch workspace info when accepting the invite
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Invalid or expired invite link");
      }
    };

    checkInvite();
  }, [token, navigate]);

  const handleJoinWorkspace = async () => {
    if (!token) return;

    setStatus("joining");
    setError(null);

    try {
      const inviteData = await workspacesApi.useInviteLink(token);
      const inviteDataAny = inviteData as any;
      setWorkspaceName(inviteDataAny.workspace.name);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to join workspace");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // User needs to sign in first - redirect to auth with redirect param
    navigate(`/auth?redirect=/invite/${token}`);
    return null;
  }

  return (
    <AppLayout title="Join Workspace">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {status === "success" ? (
              <>
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <CardTitle className="text-2xl">Welcome to {workspaceName}!</CardTitle>
                <CardDescription>You've successfully joined the workspace.</CardDescription>
              </>
            ) : status === "error" ? (
              <>
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <CardTitle className="text-2xl">Unable to Join</CardTitle>
                <CardDescription className="text-destructive">{error}</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">Join Workspace</CardTitle>
                <CardDescription>Do you want to accept the invitation?</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center">
            {status === "idle" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">You've been invited to join a workspace. Would you like to accept this invitation?</p>
                <Button onClick={handleJoinWorkspace} className="w-full">
                  Join Workspace
                </Button>
                <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                  Cancel
                </Button>
              </div>
            )}
            
            {status === "joining" && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p>Joining workspace...</p>
              </div>
            )}
            
            {status === "success" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">You're now a member of the workspace. You can access it from your dashboard.</p>
                <Button onClick={() => navigate(`/workspace/${workspaceName}`)} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            )}
            
            {status === "error" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">The invitation could not be processed. The link may be invalid or expired.</p>
                <Button onClick={() => navigate(-1)} className="w-full">
                  Back to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}