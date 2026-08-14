import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Users, CalendarDays, Scissors, Package,
  ReceiptText, Wallet, BarChart3, Settings as SettingsIcon, LogOut, Sparkles
} from "lucide-react";
import { local } from "@/api/localStorageClient";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/staff", label: "Staff", icon: Scissors },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/invoices", label: "Invoices", icon: ReceiptText },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { logout } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const list = await local.entities.Setting.list();
      return list[0] || { salon_name: "Luxe Salon", theme_color: "#b45309", currency: "$" };
    },
  });

  const accent = settings?.theme_color || "#b45309";
  const salonName = settings?.salon_name || "Luxe Salon";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <aside
        className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-20 text-white"
        style={{ background: `linear-gradient(180deg, ${accent}, ${shade(accent, -30)})` }}
      >
        <div className="px-6 py-7 flex items-center gap-3 border-b border-white/15">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold leading-tight">{salonName}</h1>
            <p className="text-[11px] text-white/70 tracking-wide uppercase">Management</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white text-stone-900 shadow-lg shadow-black/10"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/15">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      <MobileTopBar accent={accent} salonName={salonName} />

      <div className="flex-1 lg:ml-64 min-w-0" style={{ overscrollBehaviorY: "none" }}>
        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1400px] mx-auto overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav accent={accent} />
    </div>
  );
}

function MobileTopBar({ accent, salonName }) {
  return (
    <div
      className="lg:hidden sticky top-0 z-30 flex items-center px-4 py-3 text-white"
      style={{ background: accent, paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5" />
        <span className="font-display font-semibold">{salonName}</span>
      </div>
    </div>
  );
}

function BottomNav({ accent }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-stone-100 flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems.slice(0, 5).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 select-none"
        >
          {({ isActive }) => (
            <>
              <item.icon className="w-5 h-5" style={{ color: isActive ? accent : "#a8a29e" }} />
              <span
                className="text-[10px] font-medium truncate max-w-full px-0.5"
                style={{ color: isActive ? accent : "#a8a29e" }}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function shade(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (0x1000000 + (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 + (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 + (B < 255 ? (B < 0 ? 0 : B) : 255))
      .toString(16)
      .slice(1)
  );
}

export { shade };