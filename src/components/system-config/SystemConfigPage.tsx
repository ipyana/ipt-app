import { AppLayout } from "@/components/layout/AppLayout";

interface SystemConfigPageProps {
  role: "admin" | "super_admin";
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SystemConfigPage({ role, title, description, children }: SystemConfigPageProps) {
  return (
    <AppLayout role={role}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        {children}
      </div>
    </AppLayout>
  );
}
