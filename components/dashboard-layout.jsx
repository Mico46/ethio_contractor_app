"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/router";
import {
  HiOutlineViewGrid,
  HiOutlineMap,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout,
  HiOutlineCog,
  HiOutlineCollection,
  HiOutlineCash,
} from "react-icons/hi";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: HiOutlineViewGrid },
  { href: "/sites", label: "Sites", icon: HiOutlineMap },
  { href: "/tasks", label: "Tasks", icon: HiOutlineClipboardList },
  { href: "/materials", label: "Materials", icon: HiOutlineCollection },
  { href: "/expenses", label: "Expenses", icon: HiOutlineCash },
  { href: "/users", label: "HR & Staff", icon: HiOutlineUsers },
  { href: "/photos", label: "Photos", icon: HiOutlinePhotograph },
  { href: "/logs", label: "Logs", icon: HiOutlineDocumentText },
  { href: "/reports", label: "Reports", icon: HiOutlineChartBar },
  { href: "/settings", label: "Settings", icon: HiOutlineCog },
];

export default function DashboardLayout({ children }) {
  const { user, signOutUser } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentPath = mounted ? router.pathname : "";

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">EC</span>
              </div>
              <span className="text-white font-semibold text-sm leading-tight">
                Ethiopian<br />Contractor
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-400 hover:text-white hover:bg-sidebar-hover"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.role || "Member"}</p>
              </div>
              <button
                onClick={signOutUser}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <HiOutlineLogout className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-border h-16 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 lg:hidden mr-3"
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
            {NAV_ITEMS.find((n) => n.href === currentPath)?.label || "Dashboard"}
          </h2>
          <div className="ml-auto flex items-center gap-3">
            {mounted && (
              <span className="text-sm text-gray-500 hidden md:inline">
                {new Date().toLocaleDateString("en-ET", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
