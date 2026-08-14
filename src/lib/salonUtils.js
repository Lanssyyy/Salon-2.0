import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval, subDays, parseISO } from "date-fns";

export const formatCurrency = (value, symbol = "$") => {
  const v = Number(value || 0);
  return `${symbol}${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");

export const formatDate = (date, fmt = "MMM d, yyyy") => {
  if (!date) return "—";
  try { return format(new Date(date), fmt); } catch { return "—"; }
};

export const formatDateInput = (date) => {
  if (!date) return "";
  try { return format(new Date(date), "yyyy-MM-dd"); } catch { return ""; }
};

export const initials = (name = "") =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

export const getRangeStart = (view, ref = new Date()) => {
  switch (view) {
    case "daily": return startOfDay(ref);
    case "weekly": return startOfWeek(ref, { weekStartsOn: 1 });
    case "monthly": return startOfMonth(ref);
    case "yearly": return startOfYear(ref);
    default: return startOfDay(ref);
  }
};

export const filterByView = (items, view, dateField = "date") => {
  if (!view || view === "all") return items;
  const start = getRangeStart(view);
  return items.filter((it) => {
    if (!it[dateField]) return false;
    const d = new Date(it[dateField]);
    return d >= start && d <= new Date();
  });
};

export const buildChartData = (invoices, days = 7) => {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, "yyyy-MM-dd");
    const dayItems = invoices.filter((inv) => {
      if (!inv.date) return false;
      return format(new Date(inv.date), "yyyy-MM-dd") === key;
    });
    out.push({
      date: format(d, days > 14 ? "MMM d" : "EEE"),
      revenue: dayItems.reduce((s, x) => s + (x.total || 0), 0),
      invoices: dayItems.length,
    });
  }
  return out;
};

export const categoryBreakdown = (invoices) => {
  const map = {};
  invoices.forEach((inv) => {
    (inv.items || []).forEach((it) => {
      const k = it.name || "Other";
      map[k] = (map[k] || 0) + (it.price || 0) * (it.quantity || 1);
    });
  });
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
};

export const staffLeaderboard = (invoices, staff) => {
  const map = {};
  invoices.forEach((inv) => {
    (inv.items || []).forEach((it) => {
      if (!it.staff_id) return;
      if (!map[it.staff_id]) map[it.staff_id] = { id: it.staff_id, name: it.staff_name || "—", revenue: 0, count: 0 };
      map[it.staff_id].revenue += (it.price || 0) * (it.quantity || 1);
      map[it.staff_id].count += 1;
    });
  });
  staff.forEach((s) => {
    if (!map[s.id]) map[s.id] = { id: s.id, name: s.name, revenue: 0, count: 0 };
  });
  return Object.values(map).sort((a, b) => b.revenue - a.revenue);
};

export const lowStockProducts = (products) =>
  products.filter((p) => p.stock_quantity <= p.reorder_level);

export const generateInvoiceNumber = () =>
  `INV-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;

export const computeCommission = (items, staffList) => {
  const rateMap = {};
  staffList.forEach((s) => { rateMap[s.id] = (s.commission_rate || 0) / 100; });
  return (items || []).reduce((sum, it) => {
    const rate = rateMap[it.staff_id] || 0;
    const line = (it.price || 0) * (it.quantity || 1) * rate;
    return sum + line;
  }, 0);
};

export const computeInvoiceTotals = (items, taxRate = 0, discount = 0) => {
  const subtotal = (items || []).reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
  const taxAmount = subtotal * ((taxRate || 0) / 100);
  const total = subtotal + taxAmount - (discount || 0);
  return { subtotal, taxAmount, total: Math.max(0, total) };
};

export const VIEW_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];