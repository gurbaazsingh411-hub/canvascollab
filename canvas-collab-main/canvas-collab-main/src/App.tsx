import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DocumentPage from "./pages/DocumentPage";
import SpreadsheetPage from "./pages/SpreadsheetPage";
import WorkspaceSettingsPage from "./pages/WorkspaceSettingsPage";
import WorkspaceAnalyticsPage from "./pages/WorkspaceAnalyticsPage";
import InvitePage from "./pages/InvitePage";
import RecentPage from "./pages/RecentPage";
import StarredPage from "./pages/StarredPage";
import SharedPage from "./pages/SharedPage";
import TrashPage from "./pages/TrashPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import WorkspaceDocumentsPage from "./pages/WorkspaceDocumentsPage";
import WorkspaceSpreadsheetsPage from "./pages/WorkspaceSpreadsheetsPage";
import WorkspaceSelectionPage from "./pages/WorkspaceSelectionPage";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="collabdocs-theme">
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/document/:id" element={<DocumentPage />} />
                <Route path="/spreadsheet/:id" element={<SpreadsheetPage />} />
                <Route path="/workspace/:id/settings" element={<WorkspaceSettingsPage />} />
                <Route path="/workspace/:id/analytics" element={<WorkspaceAnalyticsPage />} />
                <Route path="/invite/:token" element={<InvitePage />} />
                <Route path="/workspaces" element={<WorkspaceSelectionPage />} />

                {/* New Pages */}
                <Route path="/recent" element={<RecentPage />} />
                <Route path="/starred" element={<StarredPage />} />
                <Route path="/shared" element={<SharedPage />} />
                <Route path="/trash" element={<TrashPage />} />
                <Route path="/settings" element={<ProfileSettingsPage />} />
                <Route path="/workspace/documents" element={<WorkspaceDocumentsPage />} />
                <Route path="/workspace/spreadsheets" element={<WorkspaceSpreadsheetsPage />} />
                <Route path="/search" element={<SearchPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
