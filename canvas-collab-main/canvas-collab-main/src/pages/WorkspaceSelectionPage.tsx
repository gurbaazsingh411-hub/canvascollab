import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { Building, Plus, ArrowRight, LogOut, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/contexts/NotificationContext";
import { workspacesApi } from "@/lib/api";

export default function WorkspaceSelectionPage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { workspaces, isLoading, createWorkspace } = useWorkspaces();
    const { addNotification } = useNotifications();

    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [createdWorkspace, setCreatedWorkspace] = useState<any>(null);
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    const filteredWorkspaces = workspaces?.filter(ws =>
        ws.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleSelectWorkspace = (id: string) => {
        localStorage.setItem("last_workspace_id", id);
        navigate("/");
    };

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim() || !user) return;
        try {
            const ws = await createWorkspace.mutateAsync({ name: newWorkspaceName, ownerId: user.id }) as any;
            setCreatedWorkspace(ws);

            // Auto-generate invite
            const invite = await workspacesApi.generateInviteLink(ws.id);
            const url = `${window.location.origin}/invite/${(invite as any).invite_token}`;
            setInviteLink(url);

            addNotification({
                title: "Workspace Created",
                message: `"${ws.name}" is ready to use.`,
                type: "success"
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDone = () => {
        setIsCreateOpen(false);
        if (createdWorkspace) {
            handleSelectWorkspace(createdWorkspace.id);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0A0B0E] flex flex-col items-center py-8 lg:py-16 px-4 lg:px-6">
            <div className="max-w-4xl w-full space-y-8 lg:space-y-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white dark:bg-[#15161A] p-4 lg:p-6 rounded-2xl shadow-sm border border-border/40 gap-4">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <Avatar className="h-10 w-10 lg:h-12 lg:w-12 border-2 border-primary/20">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {user?.email?.[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h1 className="text-lg lg:text-xl font-bold tracking-tight truncate">Select a workspace</h1>
                            <p className="text-xs lg:text-sm text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground hover:text-destructive w-full sm:w-auto justify-start sm:justify-center">
                        <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                </div>

                {/* Search & Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search your workspaces..."
                            className="pl-10 h-11 lg:h-12 bg-white dark:bg-[#15161A] border-border/40"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="h-11 lg:h-12 px-6 shadow-lg shadow-primary/20 w-full sm:w-auto">
                                <Plus className="h-5 w-5 mr-2" /> Create Workspace
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Workspace</DialogTitle>
                                <DialogDescription>
                                    Enter a name for your new workspace to start collaborating.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                {!createdWorkspace ? (
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Workspace Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g. Acme Team, Marketing"
                                                value={newWorkspaceName}
                                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-center">
                                            <p className="font-semibold text-primary text-lg">Success!</p>
                                            <p className="text-sm text-muted-foreground">Your workspace is ready. You can invite team members now or later.</p>
                                        </div>
                                        {inviteLink && (
                                            <div className="space-y-2">
                                                <Label>Invite Link</Label>
                                                <div className="flex gap-2">
                                                    <Input value={inviteLink} readOnly className="bg-muted" />
                                                    <Button variant="secondary" onClick={() => navigator.clipboard.writeText(inviteLink)}>
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                {!createdWorkspace ? (
                                    <Button onClick={handleCreateWorkspace} disabled={!newWorkspaceName.trim() || createWorkspace.isPending}>
                                        {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
                                    </Button>
                                ) : (
                                    <Button onClick={handleDone} className="w-full">
                                        Enter Workspace
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Workspace Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkspaces.map((ws) => (
                        <Card
                            key={ws.id}
                            className="group cursor-pointer border-border/40 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden bg-white dark:bg-[#15161A]"
                            onClick={() => handleSelectWorkspace(ws.id)}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
                            <CardHeader>
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                                    <Building className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="leading-tight">{ws.name}</CardTitle>
                                <CardDescription>
                                    {ws.owner_id === user?.id ? "Owner" : "Member"}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-0 flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">
                                    Created {new Date(ws.created_at).toLocaleDateString()}
                                </span>
                                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </CardFooter>
                        </Card>
                    ))}

                    {filteredWorkspaces.length === 0 && !isLoading && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl border-border/60">
                            <div className="bg-muted/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No workspaces found</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                                Create a new workspace to start collaborating on documents.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Branding */}
            <div className="mt-auto pt-16 text-center">
                <p className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Powered by CollabDocs Engine
                </p>
            </div>
        </div>
    );
}
