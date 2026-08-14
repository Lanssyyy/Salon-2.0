import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function KpiCard({ label, value, icon: Icon, accent = "#b45309", trend, sub }) {
  const positive = trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white border border-stone-100 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-display font-bold text-stone-900">{value}</p>
        </div>
        {Icon && (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {(trend !== undefined || sub) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md ${
                positive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
              }`}
            >
              {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {sub && <span className="text-stone-400">{sub}</span>}
        </div>
      )}
    </motion.div>
  );
}