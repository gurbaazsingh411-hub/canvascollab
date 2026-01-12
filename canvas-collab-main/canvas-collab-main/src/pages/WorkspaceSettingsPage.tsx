import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useWorkspaces, useWorkspaceMembers } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { profilesApi } from "@/lib/api";
import { Loader2, Trash2, UserPlus, X, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function WorkspaceSettingsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const { workspaces, updateWorkspace, deleteWorkspace } = useWorkspaces();
    const { members, isLoading: membersLoading, addMember, removeMember } = useWorkspaceMembers(id || null);

    const workspace = workspaces?.find((w) => w.id === id);
    const [newName, setNewName] = useState(workspace?.name || "");
    const [inviteEmail, setInviteEmail] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // If workspace not found or still loading
    if (!workspace && workspaces) {
        return (
            <AppLayout title="Not Found">
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <h2 className="text-2xl font-bold">Workspace not found</h2>
                    <Button onClick={() => navigate("/")} className="mt-4">Go Home</Button>
                </div>
            </AppLayout>
        );
    }

    // Update Workspace Name
    const handleUpdateName = async () => {
        if (!id || !newName.trim()) return;
        try {
            await updateWorkspace.mutateAsync({ id, name: newName });
            toast({ title: "Success", description: "Workspace renamed successfully." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to rename workspace.", variant: "destructive" });
        }
    };

    // Delete Workspace
    const handleDeleteWorkspace = async () => {
        if (!id || !confirm("Are you sure you want to delete this workspace? This cannot be undone.")) return;
        try {
            await deleteWorkspace.mutateAsync(id);
            navigate("/");
            toast({ title: "Deleted", description: "Workspace deleted successfully." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete workspace.", variant: "destructive" });
        }
    };

    // Invite Member with proper error handling
    const handleInviteMember = async () => {
        if (!id || !inviteEmail.trim()) return;
        setIsSearching(true);

        try {
            // 1. Find user by email
            const users = await profilesApi.searchByEmail(inviteEmail);
            const foundUser = users?.[0];

            if (!foundUser) {
                toast({ title: "User not found", description: "No user found with that email address.", variant: "destructive" });
                return;
            }

            // 2. Check if already a member
            if (members?.some(m => m.user_id === foundUser.id)) {
                toast({ title: "Already a member", description: "This user is already in the workspace.", variant: "destructive" });
                return;
            }

            // 3. Add member
            await addMember.mutateAsync({ userId: foundUser.id, role: 'member' });
            setInviteEmail("");
            toast({ title: "Member added", description: `${foundUser.display_name || foundUser.email} has been added.` });

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to add member.", variant: "destructive" });
        } finally {
            setIsSearching(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!id || !confirm("Remove this member?")) return;
        try {
            await removeMember.mutateAsync(userId);
            toast({ title: "Removed", description: "Member removed from workspace." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove member.", variant: "destructive" });
        }
    };

    const isOwner = workspace?.owner_id === user?.id;

    return (
        <AppLayout title={`${workspace?.name || "..."} Settings`}>
            <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">

                {/* General Settings */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">General Settings</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Workspace Name</CardTitle>
                            <CardDescription>Update the name of your workspace.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    disabled={!isOwner}
                                />
                                {isOwner && (
                                    <Button onClick={handleUpdateName} disabled={!newName.trim() || newName === workspace?.name}>
                                        <Save className="mr-2 h-4 w-4" /> Save
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Member Management */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Members</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Team</CardTitle>
                            <CardDescription>Invite users by email to collaborate.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Invite Form */}
                            {isOwner && (
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1 space-y-2">
                                        <Label>Invite User by Email</Label>
                                        <Input
                                            placeholder="colleague@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleInviteMember()}
                                        />
                                    </div>
                                    <Button onClick={handleInviteMember} disabled={isSearching || !inviteEmail.trim()}>
                                        {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <UserPlus className="h-4 w-4 mr-2" />}
                                        Invite
                                    </Button>
                                </div>
                            )}

                            <Separator />

                            {/* Members List */}
                            <div className="space-y-4">
                                {membersLoading ? (
                                    <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                                ) : members?.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No members yet.</p>
                                ) : (
                                    members?.map((member: any) => (
                                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={member.profile?.avatar_url} />
                                                    <AvatarFallback>{member.profile?.display_name?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.profile?.display_name || "Unknown User"}</p>
                                                    <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm px-2 py-1 bg-secondary rounded text-secondary-foreground capitalize">
                                                    {member.role}
                                                </span>
                                                {isOwner && member.user_id !== user?.id && (
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleRemoveMember(member.user_id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Danger Zone */}
                {isOwner && (
                    <div className="space-y-4 pt-8">
                        <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
                        <Card className="border-destructive/50 bg-destructive/5">
                            <CardHeader>
                                <CardTitle className="text-destructive">Delete Workspace</CardTitle>
                                <CardDescription>Permanently delete this workspace and all its files. This cannot be undone.</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button variant="destructive" onClick={handleDeleteWorkspace}>
                                    Delete Workspace
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
