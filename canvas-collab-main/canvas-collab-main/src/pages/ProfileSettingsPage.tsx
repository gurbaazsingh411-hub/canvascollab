import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { profilesApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfileSettingsPage() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || "");
            setAvatarUrl(profile.avatar_url || "");
        }
    }, [profile]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await profilesApi.update(user.id, {
                display_name: displayName,
                avatar_url: avatarUrl
            });
            toast({ title: "Profile updated", description: "Your changes have been saved." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout title="Profile Settings">
            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Public Profile</CardTitle>
                        <CardDescription>This is how others will see you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-2xl">{displayName?.[0] || <User />}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 flex-1 w-full">
                                <Label>Avatar URL</Label>
                                <Input
                                    placeholder="https://example.com/avatar.jpg"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Link to a public image.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Display Name</Label>
                            <Input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ""} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
