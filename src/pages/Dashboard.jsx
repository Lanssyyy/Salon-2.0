import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { local } from "@/api/localStorageClient";
import Layout from "@/components/Layout";
import KpiCard from "@/components/KpiCard";
import StatusBadge from "@/components/StatusBadge";
import {
  formatCurrency, formatNumber, filterByView, buildChartData,
  categoryBreakdown, staffLeaderboard, lowStockProducts, VIEW_OPTIONS
} from "@/lib/salonUtils";
import { DollarSign, CalendarCheck, Users, TrendingUp, Package, Trophy, AlertTriangle, Wallet } from "lucide-react";

const PIE_COLORS = ["#b45309", "#d97706", "#f59e0b", "#fbbf24", "#fde68a", "#fef3c7"];

export default function Dashboard() {
  const [view, setView] = useState("weekly");

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => local.entities.Invoice.list("-date", 500),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => local.entities.Customer.list("-created_date", 500),
  });
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => local.entities.Staff.list(),
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => local.entities.Product.list(),
  });
  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => local.entities.Appointment.list("-date", 200),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => local.entities.Expense.list("-date", 500),
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const list = await local.entities.Setting.list();
      return list[0] || { currency: "$", theme_color: "#b45309" };
    },
  });

  const currency = settings?.currency || "$";
  const accent = settings?.theme_color || "#b45309";

  const scopedInvoices = useMemo(() => filterByView(invoices, view), [invoices, view]);
  const scopedAppts = useMemo(() => filterByView(appointments, view, "date"), [appointments, view]);
  const scopedExpenses = useMemo(() => filterByView(expenses, view), [expenses, view]);

  const totalRevenue = scopedInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalExpenses = scopedExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalAppts = scopedAppts.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const avgTicket = scopedInvoices.length ? totalRevenue / scopedInvoices.length : 0;

  const prevRevenue = useMemo(() => {
    const prev = filterByView(invoices, view === "daily" ? "weekly" : view === "weekly" ? "monthly" : "yearly");
    return prev.reduce((s, i) => s + (i.total || 0), 0);
  }, [invoices, view]);
  const trend = prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const chartData = useMemo(() => buildChartData(invoices, 14), [invoices]);
  const catData = useMemo(() => categoryBreakdown(scopedInvoices), [scopedInvoices]);
  const leaderboard = useMemo(() => staffLeaderboard(scopedInvoices, staff), [scopedInvoices, staff]);
  const lowStock = useMemo(() => lowStockProducts(products), [products]);
  const upcoming = useMemo(
    () => appointments.filter((a) => a.status === "scheduled").slice(0, 5),
    [appointments]
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">Executive Dashboard</h1>
          <p className="text-sm text-stone-500 mt-1">Real-time salon performance overview</p>
        </div>
        <div className="flex gap-1.5 bg-stone-100 p-1 rounded-xl">
          {VIEW_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setView(o.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === o.value ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Revenue" value={formatCurrency(totalRevenue, currency)} icon={DollarSign} accent={accent} trend={trend} sub="vs prev period" />
        <KpiCard label="Expenses" value={formatCurrency(totalExpenses, currency)} icon={Wallet} accent="#be123c" sub={`${view} view`} />
        <KpiCard label="Net Profit" value={formatCurrency(netProfit, currency)} icon={TrendingUp} accent={netProfit >= 0 ? "#15803d" : "#be123c"} sub="revenue − expenses" />
        <KpiCard label="Appointments" value={formatNumber(totalAppts)} icon={CalendarCheck} accent="#0369a1" sub={`${view} view`} />
        <KpiCard label="Active Customers" value={formatNumber(activeCustomers)} icon={Users} accent="#15803d" />
        <KpiCard label="Avg. Ticket" value={formatCurrency(avgTicket, currency)} icon={TrendingUp} accent="#7c3aed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-stone-900">Revenue Trend</h2>
              <p className="text-xs text-stone-500">Last 14 days</p>
            </div>
            <TrendingUp className="w-5 h-5 text-stone-300" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(v) => formatCurrency(v, currency)}
              />
              <Area type="monotone" dataKey="revenue" stroke={accent} strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm"
        >
          <h2 className="font-display font-semibold text-stone-900 mb-1">Service Mix</h2>
          <p className="text-xs text-stone-500 mb-4">Revenue by service</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {catData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {catData.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-stone-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {c.name}
                </span>
                <span className="font-semibold text-stone-800">{formatCurrency(c.value, currency)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="font-display font-semibold text-stone-900">Staff Leaderboard</h2>
          </div>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{s.name}</p>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full" style={{ width: `${leaderboard[0]?.revenue ? (s.revenue / leaderboard[0].revenue) * 100 : 0}%`, background: accent }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-stone-700">{formatCurrency(s.revenue, currency)}</span>
              </div>
            ))}
            {leaderboard.length === 0 && <p className="text-sm text-stone-400 text-center py-6">No sales recorded yet.</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h2 className="font-display font-semibold text-stone-900">Low Stock Alerts</h2>
          </div>
          <div className="space-y-2.5">
            {lowStock.length === 0 && <p className="text-sm text-stone-400 text-center py-6">All stock levels healthy.</p>}
            {lowStock.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-stone-400" />
                  <span className="text-sm font-medium text-stone-700">{p.name}</span>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                  {p.stock_quantity} left
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
          <h2 className="font-display font-semibold text-stone-900 mb-4">Upcoming Appointments</h2>
          <div className="space-y-3">
            {upcoming.length === 0 && <p className="text-sm text-stone-400 text-center py-6">Nothing scheduled.</p>}
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                <div className="w-9 h-9 rounded-lg bg-stone-100 flex flex-col items-center justify-center">
                  <span className="text-[9px] text-stone-500 uppercase leading-none">{new Date(a.date).toLocaleString("en", { month: "short" })}</span>
                  <span className="text-sm font-bold text-stone-800 leading-none mt-0.5">{new Date(a.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{a.customer_name}</p>
                  <p className="text-xs text-stone-500">{a.service_name} · {a.staff_name}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}