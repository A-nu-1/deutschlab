
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BookText,
  Brain,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FolderOpen,
  GraduationCap,
  House,
  Languages,
  LogIn,
  LogOut,
  Menu,
  Mic,
  ShieldCheck,
  X,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  available?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    title: "LEARN",
    items: [
      { label: "Dashboard", href: "/", icon: House },
      {
        label: "Grammar Library",
        href: "/library",
        icon: BookOpen,
      },
      {
        label: "Vocabulary",
        href: "/library?tab=vocabulary",
        icon: Languages,
      },
      {
        label: "Smart Reader",
        href: "/reader",
        icon: BookText,
      },
    ],
  },
  {
    title: "PRACTISE",
    items: [
      {
        label: "Speaking Coach",
        href: "/coach",
        icon: Mic,
        available: false,
      },
      {
        label: "My Practice",
        href: "/practice",
        icon: Brain,
        available: false,
      },
      {
        label: "My Progress",
        href: "/progress",
        icon: ChartNoAxesColumnIncreasing,
        available: false,
      },
    ],
  },
  {
    title: "MY CONTENT",
    items: [
      {
        label: "My Materials",
        href: "/materials",
        icon: FolderOpen,
        available: false,
      },
    ],
  },
];

const adminGroup: NavGroup = {
  title: "ADMIN",
  items: [
    {
      label: "Vocabulary Review",
      href: "/admin/review",
      icon: ShieldCheck,
    },
    {
      label: "Grammar Review",
      href: "/admin/grammar-review",
      icon: ClipboardCheck,
    },
  ],
};

function AppSidebarContent({
  children,
  showAdmin = false,
}: {
  children: React.ReactNode;
  showAdmin?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkOwnerSession() {
      try {
        const response = await fetch("/api/admin/auth/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) setIsOwner(false);
          return;
        }

        const result = await response.json();

        if (!cancelled) {
          setIsOwner(result.authenticated === true);
        }
      } catch {
        if (!cancelled) setIsOwner(false);
      }
    }

    void checkOwnerSession();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const allGroups = showAdmin
    ? [...groups, adminGroup]
    : groups;

  function isActive(item: NavItem) {
    if (item.href === "/") {
      return pathname === "/";
    }

    if (item.href === "/library?tab=vocabulary") {
      return (
        pathname === "/library" &&
        searchParams.get("tab") === "vocabulary"
      );
    }

    if (item.href === "/library") {
      return (
        pathname.startsWith("/library") &&
        !(
          pathname === "/library" &&
          searchParams.get("tab") === "vocabulary"
        )
      );
    }

    const path = item.href.split("?")[0];

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  }

  const baseClass =
    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <GraduationCap size={23} />
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-lg font-bold text-white">
                DeutschLab
              </p>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-violet-300">
                MISSION C1
              </p>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-6"
      >
        {allGroups.map((group) => (
          <section key={group.title} className="space-y-2">
            {!collapsed ? (
              <p className="px-3 text-[11px] font-semibold tracking-widest text-slate-500">
                {group.title}
              </p>
            ) : (
              <div className="mx-3 border-t border-white/10" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                const available = item.available !== false;

                const stateClass = !available
                  ? "cursor-not-allowed text-slate-600"
                  : active
                    ? "bg-violet-500/20 font-semibold text-violet-200 ring-1 ring-violet-500/20"
                    : "text-slate-300 hover:bg-white/5 hover:text-white";

                const content = (
                  <>
                    <Icon
                      size={19}
                      className="shrink-0"
                      aria-hidden="true"
                    />

                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">
                          {item.label}
                        </span>

                        {!available && (
                          <span className="text-[10px] text-slate-600">
                            Soon
                          </span>
                        )}
                      </>
                    )}
                  </>
                );

                if (!available) {
                  return (
                    <div
                      key={item.href}
                      className={`${baseClass} ${stateClass}`}
                      title={`${item.label} — coming soon`}
                      aria-disabled="true"
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`${baseClass} ${stateClass}`}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      {/* Owner access and sidebar controls */}
      <div className="space-y-2 border-t border-white/10 p-3">
        {isOwner === null ? (
          <div
            className={`${baseClass} text-slate-500`}
            aria-label="Checking owner session"
          >
            <ShieldCheck size={19} className="shrink-0" />
            {!collapsed && (
              <span className="truncate text-xs">
                Checking access...
              </span>
            )}
          </div>
        ) : isOwner ? (
          <form action="/api/admin/auth/logout" method="post">
            <button
              type="submit"
              title={collapsed ? "Owner sign out" : undefined}
              className={`${baseClass} w-full bg-violet-500/10 text-violet-200 hover:bg-violet-500/20`}
            >
              <LogOut size={19} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">
                    Owner · Sign out
                  </span>
                </>
              )}
            </button>
          </form>
        ) : (
          <Link
            href="/owner-login"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Owner login" : undefined}
            className={`${baseClass} text-slate-300 hover:bg-white/5 hover:text-white`}
          >
            <LogIn size={19} className="shrink-0" />
            {!collapsed && (
              <span className="flex-1">Owner Login</span>
            )}
          </Link>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden w-full items-center justify-center gap-2 rounded-lg p-2 text-sm text-slate-400 hover:bg-white/10 hover:text-white lg:flex"
        >
          {collapsed ? (
            <ChevronRight size={19} />
          ) : (
            <>
              <ChevronLeft size={19} />
              Collapse
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#11131f] text-white">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#171927] px-4 lg:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-200 hover:bg-white/10"
        >
          <Menu size={23} />
        </button>

        <Link href="/" className="font-bold text-violet-300">
          DeutschLab 🇩🇪
        </Link>

        <span className="text-xs text-slate-400">
          B1 → C1
        </span>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-black/65 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Shared sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 overflow-hidden border-r border-white/10 bg-[#191b2a] transition-all duration-200 lg:z-30 ${
          mobileOpen
            ? "w-72 translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {sidebarContent}
      </aside>

      {/* Page content */}
      <div
        className={`min-w-0 transition-[padding] duration-200 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function AppSidebar(props: {
  children: React.ReactNode;
  showAdmin?: boolean;
}) {
  return (
    <Suspense fallback={props.children}>
      <AppSidebarContent {...props} />
    </Suspense>
  );
}
