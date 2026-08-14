import { useMemo, useState } from "react";
import { format, parseISO, addDays, subDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

const START_HOUR = 8;
const END_HOUR = 21;
const SLOT_MINUTES = 30;

const STATUS_COLORS = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelled: "bg-rose-100 text-rose-800 border-rose-300",
  no_show: "bg-stone-200 text-stone-700 border-stone-300",
};

export default function DayScheduleCalendar({ appointments, selectedDate, onDateChange, onMoveAppointment, accent = "#b45309" }) {
  const [dragId, setDragId] = useState(null);

  const slots = useMemo(() => {
    const out = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      out.push({ hour: h, minute: 0 });
      out.push({ hour: h, minute: SLOT_MINUTES });
    }
    return out;
  }, []);

  const dayAppts = useMemo(
    () => appointments.filter((a) => a.date && isSameDay(parseISO(a.date), selectedDate)),
    [appointments, selectedDate]
  );

  const apptsBySlot = useMemo(() => {
    const map = {};
    dayAppts.forEach((a) => {
      const d = parseISO(a.date);
      const key = `${d.getHours()}:${d.getMinutes()}`;
      (map[key] = map[key] || []).push(a);
    });
    return map;
  }, [dayAppts]);

  const handleDrop = (e, hour, minute) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    setDragId(null);
    if (!id) return;
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;
    const oldDate = parseISO(appt.date);
    const newDate = new Date(selectedDate);
    newDate.setHours(hour, minute, 0, 0);
    if (isSameDay(oldDate, selectedDate) && oldDate.getHours() === hour && oldDate.getMinutes() === minute) return;
    onMoveAppointment(appt, newDate.toISOString());
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-stone-900">{format(selectedDate, "EEEE, MMM d")}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onDateChange(subDays(selectedDate, 1))} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => onDateChange(new Date())} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-500 hover:bg-stone-100">Today</button>
          <button onClick={() => onDateChange(addDays(selectedDate, 1))} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-y-auto">
        {slots.map((slot) => {
          const key = `${slot.hour}:${slot.minute}`;
          const items = apptsBySlot[key] || [];
          return (
            <div key={key} className="flex border-b border-stone-50 min-h-[52px]">
              <div className="w-16 flex-shrink-0 px-2 py-1.5 text-xs text-stone-400 font-medium border-r border-stone-100">
                {format(new Date().setHours(slot.hour, slot.minute, 0, 0), "h:mma")}
              </div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, slot.hour, slot.minute)}
                className="flex-1 px-2 py-1 space-y-1"
              >
                {items.map((a) => (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", a.id); setDragId(a.id); }}
                    onDragEnd={() => setDragId(null)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow ${STATUS_COLORS[a.status] || "bg-stone-100 border-stone-200"}`}
                  >
                    <div className="font-semibold truncate">{a.customer_name}</div>
                    <div className="flex items-center gap-1.5 text-[11px] opacity-80">
                      <Clock className="w-3 h-3" />
                      <span>{format(parseISO(a.date), "h:mma")}</span>
                      {a.service_name && <span>· {a.service_name}</span>}
                      {a.staff_name && <span>· {a.staff_name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 text-[11px] text-stone-400 border-t border-stone-100 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: accent }} />
        Drag an appointment block to a different time slot to reschedule it.
      </div>
    </div>
  );
}