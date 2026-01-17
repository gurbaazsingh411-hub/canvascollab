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
import { Share2, Copy, Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";

interface ShareDialogProps {
    documentId: string;
    documentTitle: string;
}

export function ShareDialog({ documentId, documentTitle }: ShareDialogProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"viewer" | "editor" | "owner">("viewer");
    const [copied, setCopied] = useState(false);
    const { addNotification } = useNotifications();

    const shareLink = `${window.location.origin}/document/${documentId}`;

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

    const handleInvite = () => {
        if (!email) {
            toast.error("Please enter an email address");
            return;
        }
        // TODO: Implement invite functionality
        console.log("Inviting", email, "as", role);
        toast.success(`Invitation sent to ${email}`);
        
        // Add notification for successful invitation
        addNotification({
            title: "Document Shared",
            message: `You've shared "${documentTitle}" with ${email} as ${role}.`,
            type: "success",
        });
        
        setEmail("");
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
                        Invite people to collaborate on this document
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
                                    <SelectItem value="owner">Owner</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleInvite} className="w-full gap-2">
                            <Mail className="h-4 w-4" />
                            Send Invitation
                        </Button>
                    </div>

                    {/* Share Link */}
                    <div className="space-y-2">
                        <Label>Share link</Label>
                        <div className="flex gap-2">
                            <Input value={shareLink} readOnly className="flex-1" />
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
                        <p className="text-xs text-muted-foreground">
                            Anyone with the link can view this document
                        </p>
                    </div>

                    {/* Current Collaborators */}
                    <div className="space-y-2">
                        <Label>People with access</Label>
                        <div className="space-y-2">
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
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
