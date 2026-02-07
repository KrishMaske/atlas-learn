import { DashboardShell } from "@/components/layout/DashboardShell";

export default function SandboxLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardShell>
            {children}
        </DashboardShell>
    );
}
