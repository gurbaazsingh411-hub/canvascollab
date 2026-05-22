import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Share2, Copy, Check, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { supabase } from "@/integrations/supabase/client";
import { workspacesApi, profilesApi, enhancedPermissionsApi } from "@/lib/api";
import { useCollaborators } from "@/hooks/use-permissions";
import { useQueryClient } from "@tanstack/react-query";

interface ShareDialogProps {
    documentId: string;
    documentTitle: string;
    fileType?: "document" | "spreadsheet";
}

export function ShareDialog({ documentId, documentTitle, fileType = "document" }: ShareDialogProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"viewer" | "editor" | "owner">("viewer");
    const [copied, setCopied] = useState(false);
    const { addNotification } = useNotifications();
    const queryClient = useQueryClient();

    const { data: collaboratorsList, isLoading: isLoadingCollaborators } = useCollaborators(documentId, fileType);

    const shareLink = `${window.location.origin}/${fileType}/${documentId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        toast.success("Link copied to clipboard");

        // Add notification for link copied
        addNotification({
            title: "Link Copied",
            message: `Share link for "${documentTitle}" copied to clipboard`,
            type: "info",
        });

        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = async () => {
        if (!email) {
            toast.error("Please enter an email address");
            return;
        }

        try {
            // 1. Find user by email
            const foundUser = await profilesApi.findByEmail(email);

            if (!foundUser) {
                toast.error("User not found. They must have an account to be added.");
                return;
            }

            // Check if user is already a collaborator
            const alreadyExists = collaboratorsList?.some(
                (c: any) => c.user_id === foundUser.id
            );
            if (alreadyExists) {
                toast.error("User already has access to this file");
                return;
            }

            // 2. Get document details for workspace_id
            const table = fileType === "spreadsheet" ? "spreadsheets" : "documents";
            const { data: doc } = await supabase
                .from(table)
                .select("workspace_id")
                .eq("id", documentId)
                .single();

            if (doc?.workspace_id) {
                // 3. Add to workspace automatically
                await workspacesApi.addMember(doc.workspace_id, foundUser.id, 'member');
                console.log(`User ${email} auto-added to workspace ${doc.workspace_id}`);
            }

            // 4. Create document/spreadsheet-specific permission
            await enhancedPermissionsApi.inviteUser({
                [fileType === "spreadsheet" ? "spreadsheet_id" : "document_id"]: documentId,
                user_id: foundUser.id,
                role: role === "owner" ? "editor" : role, // Owner isn't supported as an invite role directly in schema defaults
            });

            // Invalidate query
            queryClient.invalidateQueries({ queryKey: ["collaborators", fileType, documentId] });

            toast.success(`Invitation shared with ${email}`);

            // Add notification for successful invitation
            addNotification({
                title: `${fileType === "spreadsheet" ? "Spreadsheet" : "Document"} Shared`,
                message: `You've shared "${documentTitle}" with ${email} as ${role}.`,
                type: "success",
            });

            setEmail("");
        } catch (error) {
            console.error("Invite error:", error);
            toast.error("Failed to share file");
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share "{documentTitle}"</DialogTitle>
                    <DialogDescription>
                        Invite people to collaborate on this {fileType}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Invite by Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Invite by email</Label>
                        <div className="flex gap-2">
                            <Input
                                id="email"
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Select value={role} onValueChange={(v: any) => setRole(v)}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleInvite} className="w-full gap-2 mt-2">
                            <Mail className="h-4 w-4" />
                            Send Invitation
                        </Button>
                    </div>

                    {/* Share Link */}
                    <div className="space-y-2">
                        <Label>Share link</Label>
                        <div className="flex gap-2">
                            <Input value={shareLink} readOnly className="flex-1 text-xs" />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopyLink}
                                className="shrink-0"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-success" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Anyone with the link and appropriate permissions can view this {fileType}
                        </p>
                    </div>

                    {/* Current Collaborators */}
                    <div className="space-y-2">
                        <Label>People with access</Label>
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                            {/* You / Owner */}
                            <div className="flex items-center justify-between rounded-lg border border-border p-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-sm font-medium">You</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">You</p>
                                        <p className="text-xs text-muted-foreground">Owner</p>
                                    </div>
                                </div>
                            </div>

                            {/* Loading Collaborators */}
                            {isLoadingCollaborators && (
                                <div className="flex items-center justify-center py-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}

                            {/* Invited Collaborators */}
                            {collaboratorsList && collaboratorsList.map((collab: any) => (
                                <div key={collab.id} className="flex items-center justify-between rounded-lg border border-border p-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-secondary/30 flex items-center justify-center text-xs font-semibold shrink-0">
                                            {collab.profiles?.display_name?.substring(0, 2).toUpperCase() || collab.profiles?.email?.substring(0, 2).toUpperCase() || "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium truncate">{collab.profiles?.display_name || "Unknown User"}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{collab.profiles?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Select
                                            value={collab.role}
                                            onValueChange={async (newRole: any) => {
                                                try {
                                                    await enhancedPermissionsApi.updateRole(collab.id, newRole);
                                                    toast.success("Role updated successfully");
                                                    queryClient.invalidateQueries({ queryKey: ["collaborators", fileType, documentId] });
                                                } catch (err) {
                                                    toast.error("Failed to update role");
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-[85px] h-7 text-[10px] px-2">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="viewer">Viewer</SelectItem>
                                                <SelectItem value="editor">Editor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive h-7 px-1.5 text-[10px] hover:bg-destructive/10"
                                            onClick={async () => {
                                                try {
                                                    await enhancedPermissionsApi.removeCollaborator(collab.id);
                                                    toast.success("Collaborator removed");
                                                    queryClient.invalidateQueries({ queryKey: ["collaborators", fileType, documentId] });
                                                } catch (err) {
                                                    toast.error("Failed to remove collaborator");
                                                }
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
