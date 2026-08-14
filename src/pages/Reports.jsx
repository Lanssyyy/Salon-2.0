import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import { formatCurrency, formatDate } from "@/lib/salonUtils";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { format, eachMonthOfInterval, startOfYear, endOfYear } from "date-fns";

export default function Reports() {
  const [period, setPeriod] = useState("monthly");
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: () => base44.entities.Invoice.list("-date", 2000) });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: async () => { const l = await base44.entities.Setting.list(); return l[0] || { currency: "$" }; } });

  const currency = settings?.currency || "$";
  const accent = settings?.theme_color || "#b45309";

  const monthlyData = useMemo(() => {
    const year = new Date().getFullYear();
    const months = eachMonthOfInterval({ start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 11, 31)) });
    return months.map((m) => {
      const key = format(m, "yyyy-MM");
      const items = invoices.filter((inv) => inv.date && format(new Date(inv.date), "yyyy-MM") === key);
      const revenue = items.reduce((s, i) => s + (i.total || 0), 0);
      const commission = items.reduce((s, i) => s + (i.commission_total || 0), 0);
      const profit = items.reduce((sum, inv) => sum + (inv.subtotal || 0) - (inv.commission_total || 0) - (inv.discount || 0), 0);
      return { month: format(m, "MMM"), revenue, commission, profit, count: items.length };
    });
  }, [invoices]);

  const yearTotal = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const yearProfit = monthlyData.reduce((s, m) => s + m.profit, 0);
  const yearCommission = monthlyData.reduce((s, m) => s + m.commission, 0);

  const exportCsv = () => {
    const rows = [["Month", "Revenue", "Commission", "Profit", "Invoices"]];
    monthlyData.forEach((m) => rows.push([m.month, m.revenue.toFixed(2), m.commission.toFixed(2), m.profit.toFixed(2), m.count]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `salon-report-${new Date().getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">Reports & Analytics</h1>
          <p className="text-sm text-stone-500 mt-1">Yearly performance · {new Date().getFullYear()}</p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Annual Revenue" value={formatCurrency(yearTotal, currency)} accent={accent} />
        <SummaryCard label="Gross Profit" value={formatCurrency(yearProfit, currency)} accent="#15803d" />
        <SummaryCard label="Commissions Paid" value={formatCurrency(yearCommission, currency)} accent="#7c3aed" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm mb-6">
        <h2 className="font-display font-semibold text-stone-900 mb-4">Monthly Revenue vs Profit</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v) => formatCurrency(v, currency)} />
            <Bar dataKey="revenue" fill={accent} radius={[6, 6, 0, 0]} />
            <Bar dataKey="profit" fill="#15803d" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
        <h2 className="font-display font-semibold text-stone-900 mb-4">Commission Trend</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v) => formatCurrency(v, currency)} />
            <Line type="monotone" dataKey="commission" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-display font-semibold text-stone-900">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Month</th>
                <th className="text-right px-5 py-3 font-semibold">Revenue</th>
                <th className="text-right px-5 py-3 font-semibold">Profit</th>
                <th className="text-right px-5 py-3 font-semibold">Commission</th>
                <th className="text-right px-5 py-3 font-semibold">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {monthlyData.map((m) => (
                <tr key={m.month} className="hover:bg-stone-50/50">
                  <td className="px-5 py-3 font-medium text-stone-800">{m.month}</td>
                  <td className="px-5 py-3 text-right font-semibold text-stone-800">{formatCurrency(m.revenue, currency)}</td>
                  <td className="px-5 py-3 text-right text-emerald-700">{formatCurrency(m.profit, currency)}</td>
                  <td className="px-5 py-3 text-right text-stone-600">{formatCurrency(m.commission, currency)}</td>
                  <td className="px-5 py-3 text-right text-stone-600">{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
        <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-display font-bold text-stone-900">{value}</p>
    </div>
  );
}