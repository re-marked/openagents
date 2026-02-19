// Workspace layout — authenticated, client-heavy, real-time
// Protected by middleware (redirect to /login if unauthenticated)
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
