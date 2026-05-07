"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Briefcase,
  Users,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";

const navigation = [
  {
    label: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Box,
  },
  {
    label: "Crew",
    href: "/crew",
    icon: Users,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: FileText,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed top-0 left-0 h-full w-56 bg-neutral-900 border-r border-neutral-800 flex flex-col z-50">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-neutral-800">
        <span className="text-amber-500 font-bold tracking-widest text-sm uppercase">
          Production
        </span>
        <span className="text-neutral-500 font-bold tracking-widest text-sm uppercase ml-1">
          OS
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                active
                  ? "bg-amber-500/10 text-amber-500"
                  : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
              }`}
            >
              <Icon size={16} />
              {item.label}
              {active && (
                <ChevronRight size={14} className="ml-auto opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-neutral-800">
        <p className="text-xs text-neutral-600 tracking-wider uppercase">
          After Now
        </p>
      </div>
    </div>
  );
}