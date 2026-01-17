import { Bell, Mail, MailOpen } from "lucide-react";
import { Button } from "./button";
import { useNotifications } from "@/contexts/NotificationContext";

interface NotificationBadgeProps {
  onClick?: () => void;
}

export const NotificationBadge = ({ onClick }: NotificationBadgeProps) => {
  const { unreadCount } = useNotifications();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative"
    >
      {unreadCount > 0 ? (
        <Bell className="h-5 w-5 text-primary" />
      ) : (
        <Mail className="h-5 w-5 text-muted-foreground" />
      )}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );
};