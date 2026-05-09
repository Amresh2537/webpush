import Link from "next/link";
import { BarChart3, Globe, Megaphone, PanelLeftDashed } from "lucide-react";

type NavKey = "dashboard" | "campaigns" | "websites";

const navItems: Array<{
  key: NavKey;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    key: "campaigns",
    label: "Create Campaign",
    href: "/campaigns/new",
    icon: Megaphone,
  },
  {
    key: "websites",
    label: "Websites",
    href: "/onboarding",
    icon: Globe,
  },
];

export function AppShell({
  title,
  description,
  active,
  actions,
  children,
}: {
  title: string;
  description?: string;
  active: NavKey;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-[1440px] gap-4">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[248px] shrink-0 flex-col rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur md:flex">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <PanelLeftDashed className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">NotifyFlow</p>
              <p className="mono text-[10px] uppercase tracking-[0.24em] text-slate-500">Control</p>
            </div>
          </div>

          <p className="mt-6 px-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Main</p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Workspace</p>
            <p className="mt-1 text-sm font-medium text-slate-700">NotifyFlow</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur md:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
              {description ? <p className="mt-2 text-sm text-slate-600 md:text-base">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </header>

          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}