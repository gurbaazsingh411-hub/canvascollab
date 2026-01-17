import { useState } from "react";
import { X, CheckCircle, AlertTriangle, Info, Check, RotateCcw, Mail } from "lucide-react";
import { Button } from "./button";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./sheet";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const { 
    notifications, 
    markAsRead, 
    removeNotification, 
    markAllAsRead, 
    clearAllNotifications 
  } = useNotifications();
  
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedNotification(expandedNotification === id ? null : id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return `${mins}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }

    return date.toLocaleDateString();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-[400px] sm:w-[540px] flex flex-col"
      >
        <SheetHeader className="flex flex-row justify-between items-center">
          <SheetTitle>Notifications</SheetTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              disabled={notifications.every(n => n.read)}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear all
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all ${
                    notification.read 
                      ? "bg-muted/30 border-border" 
                      : "bg-accent border-primary/30 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-foreground truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="flex h-2 w-2">
                            <span className="relative flex h-full w-full">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(notification.timestamp)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        disabled={notification.read}
                        className="h-7 w-7 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNotification(notification.id)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};