
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  PackagePlus,
  PackageMinus,
  Boxes,
  ClipboardList,
  Settings,
} from "lucide-react";

const tabs = [
  { name: "Summary", href: "/dashboard", icon: LayoutDashboard },
  { name: "Received", href: "/received", icon: PackagePlus },
  { name: "Issue", href: "/issue", icon: PackageMinus },
  { name: "Stock", href: "/stock", icon: Boxes },
  { name: "Records", href: "/records", icon: ClipboardList },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function FloatingTabbar() {
  const pathname = usePathname();

  return (

<nav className="
  fixed bottom-6 left-1/2 -translate-x-1/2 z-50
  grid grid-cols-3
  w-[min(94vw,650px)]
  gap-1
  p-2
  rounded-2xl
  bg-white/10
  backdrop-blur-2xl
  border border-white/20
  shadow-2xl
">

  {tabs.map((tab) => {
    const Icon = tab.icon;
    const active = pathname === tab.href;

    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={`
          flex flex-col items-center justify-center
          gap-1
          py-3 px-1
          rounded-xl
          transition-all duration-300
          ${
            active
              ? "bg-white/20 text-white"
              : "text-white/50 hover:text-white hover:bg-white/10"
          }
        `}
      >
        <Icon size={21} />

        <span className="text-[11px] font-medium whitespace-nowrap">
          {tab.name}
        </span>

      </Link>
    );
  })}

</nav>

  );
}
