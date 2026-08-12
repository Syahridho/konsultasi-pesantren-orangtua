// This layout intentionally has no wrapper — it inherits from app/dashboard/layout.tsx
export default function PetugasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
