# Canvas Collab - Real-Time Collaborative Workspace

A modern, high-performance collaborative office suite featuring real-time document editing, spreadsheets, and workspace management. Built with **React**, **Tiptap**, **Supabase**, and **Tailwind CSS**.

## 🚀 Key Features

### 📝 Advanced Document Editor
*   **MS Word-Style Print Layout**: Experience a realistic "Print Layout" view with distinct A4 pages, 3D paper shadows, and a visual "desk" background.
*   **Robust Auto-Pagination**: Automatically inserts page breaks when content overflows the A4 page height (approx. 930px of usable space). Works seamlessly with typing, pasting, and deleting.
*   **Real-Time Collaboration**: multiple users can edit the same document simultaneously with sub-millisecond latency.
    *   **Collaborative Cursors**: See where interactions are happening with named, color-coded cursors.
    *   **State Handshake Protocol**: Advanced sync logic prevents data loss by ensuring new users request and receive the latest document state immediately upon joining.
    *   **Offline Support**: Changes are locally cached and synced when connection is restored.
*   **Rich Text Formatting**: Full support for headings, bold/italic, lists, tables, images, and more.
*   **Dark Mode Support**: Optimized reading and writing experience in low-light environments.

### 📊 Powerful Spreadsheets
*   **Grid Interface**: Familiar spreadsheet interface with formula support and cell formatting.
*   **Version History**: Track changes over time, save named versions, and restore previous states.
*   **Comment System**: Add sidebar comments to discuss data without altering cell content.
*   **Import/Export**: Support for importing data and exporting reports (placeholder implementations ready for expansion).

### 🏢 Workspace Management
*   **Multi-Workspace Support**: Users can create and switch between multiple isolated workspaces.
*   **Role-Based Access Control (RBAC)**:
    *   **Owners**: Full control over workspace settings, billing, and member management.
    *   **Admins**: Can manage members and view analytics.
    *   **Members**: Can view and edit files they have access to.
*   **Strict Row Level Security (RLS)**:
    *   **File Privacy**: Regular members can ONLY see files they created or files explicitly shared with them.
    *   **Admin Oversight**: Owners and Admins have visibility into ALL files within their workspace, grouped by creator.

### 📈 Workspace Analytics (Admin Only)
*   **Activity Tracking**: Monitor member engagement, time spent online, and active working hours.
*   **Resource Usage**: Track total documents, spreadsheets, and storage usage.
*   **File Breakdown**: View detailed lists of files created by each member.
*   **Member To-Do Visibility**: Admins can view the "To-Do" lists of workspace members to track task progress.

### 📨 Smart Dashboard
*   **Grouped File View**:
    *   **For Admins**: Files are organized by creator (e.g., "MY FILES", "FILES BY [User X]").
    *   **For Members**: Simplified view showing only personal and shared files.
*   **Quick Stats**: Instant visibility into "Starred" files, "Recent" activity, and total resource counts.
*   **Search**: Fast, debounced search across all documents and spreadsheets.

## 🛠️ Tech Stack
*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS, Shadcn UI, Lucid React Icons
*   **State Management**: Tanstack Query (React Query)
*   **Editor**: Tiptap (ProseMirror based)
*   **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)

## 🏃‍♂️ Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npm run dev
    ```
4.  **Open in Browser**: Navigate to `http://localhost:8080`.

## 🔐 Security & Permission Model
The application uses Supabase's Row Level Security (RLS) to enforce data privacy at the database level.
*   **`documents` / `spreadsheets` tables**: Policies allow `SELECT` for owners, explicit shares via `document_permissions`, and full access for Workspace Admins/Owners.
*   **`user_activity` table**: Only visible to the user themselves and Workspace Admins.
