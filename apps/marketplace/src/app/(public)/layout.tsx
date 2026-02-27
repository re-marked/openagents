export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh flex-col">
      {children}
    </div>
  )
}
