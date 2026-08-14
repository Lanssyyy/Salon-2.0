export const STATUS_STYLES = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unpaid: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-rose-50 text-rose-700 border-rose-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  no_show: "bg-stone-100 text-stone-600 border-stone-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-stone-100 text-stone-500 border-stone-200",
};

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || "bg-stone-100 text-stone-600 border-stone-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}>
      {status?.replace("_", " ") || "—"}
    </span>
  );
}