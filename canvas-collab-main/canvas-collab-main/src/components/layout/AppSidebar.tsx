import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  Table2,
  Home,
  Star,
  Clock,
  Share2,
  Trash2,
  Settings,
  Plus,
  ChevronDown,
  Search,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Recent", href: "/recent", icon: Clock },
  { name: "Starred", href: "/starred", icon: Star },
  { name: "Shared with me", href: "/shared", icon: Share2 },
];

const bottomNav = [
  { name: "Trash", href: "/trash", icon: Trash2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <FileText className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sidebar-foreground">CollabDocs</span>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <button className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50">
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
      </div>

      {/* New Document Button */}
      <div className="px-3 pb-3">
        <Button className="w-full justify-start gap-2" size="sm">
          <Plus className="h-4 w-4" />
          New Document
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 scrollbar-thin">
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "sidebar-item",
                location.pathname === item.href && "active"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Workspace Section */}
        <Collapsible
          open={workspaceOpen}
          onOpenChange={setWorkspaceOpen}
          className="mt-6"
        >
          <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-sidebar-foreground">
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                !workspaceOpen && "-rotate-90"
              )}
            />
            Workspace
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            <Link to="/workspace/documents" className="sidebar-item">
              <FolderOpen className="h-4 w-4" />
              My Documents
            </Link>
            <Link to="/workspace/spreadsheets" className="sidebar-item">
              <Table2 className="h-4 w-4" />
              My Spreadsheets
            </Link>
          </CollapsibleContent>
        </Collapsible>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {bottomNav.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "sidebar-item",
              location.pathname === item.href && "active"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </div>
    </aside>
  );
}
