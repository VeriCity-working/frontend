"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
}

const ACCENTS: Record<string, string> = {
  citizen: "bg-ink text-paper-raised",
  authority: "bg-steel text-paper-raised",
  officer: "bg-officer text-paper-raised"
};

export function RoleShell({
  role,
  roleLabel,
  identityLabel,
  items,
  onLogout,
  children
}: {
  role: "citizen" | "authority" | "officer";
  roleLabel: string;
  identityLabel: string;
  items: NavItem[];
  onLogout: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-paper-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className={`rounded px-2 py-1 text-xs font-semibold tracking-wide ${ACCENTS[role]}`}>
              VC
            </span>
            <div className="leading-tight">
              <p className="font-display text-base text-ink">VeriCity</p>
              <p className="text-xs text-ink-soft">{roleLabel}</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-ink/10 text-ink" : "text-ink-soft hover:text-ink hover:bg-ink/5"
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-soft sm:inline">{identityLabel}</span>
            <button
              onClick={() => {
                onLogout();
                router.push(`/${role}/login`);
              }}
              className="text-sm font-medium text-ink-soft hover:text-brick"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-paper-line px-5 py-2 sm:hidden">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium",
                  active ? "bg-ink/10 text-ink" : "text-ink-soft"
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
