import { useMemo, useState } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AppointmentCalendar({ appointments, accent = "#b45309" }) {
  const [cursor, setCursor] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const out = [];
    let d = start;
    while (d <= end) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (!a.date) return;
      const key = format(new Date(a.date), "yyyy-MM-dd");
      (map[key] = map[key] || []).push(a);
    });
    return map;
  }, [appointments]);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-stone-900">{format(cursor, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor(addDays(startOfMonth(cursor), -1))} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCursor(new Date())} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-500 hover:bg-stone-100">Today</button>
          <button onClick={() => setCursor(addDays(endOfMonth(cursor), 1))} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-stone-400 uppercase mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const items = byDay[key] || [];
          const inMonth = isSameMonth(d, cursor);
          const today = isSameDay(d, new Date());
          return (
            <div
              key={key}
              className={`min-h-[84px] rounded-xl p-1.5 border ${today ? "border-stone-300" : "border-stone-100"} ${inMonth ? "bg-white" : "bg-stone-50"}`}
            >
              <span className={`text-xs font-semibold ${inMonth ? "text-stone-700" : "text-stone-300"} ${today ? "px-1.5 py-0.5 rounded-full text-white" : ""}`} style={today ? { background: accent } : {}}>
                {format(d, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {items.slice(0, 2).map((a) => (
                  <div key={a.id} className="text-[10px] truncate px-1 py-0.5 rounded bg-stone-100 text-stone-600" title={`${a.customer_name} — ${a.service_name || ""}`}>
                    {format(new Date(a.date), "h:mma")} {a.customer_name}
                  </div>
                ))}
                {items.length > 2 && <div className="text-[10px] text-stone-400 px-1">+{items.length - 2} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}