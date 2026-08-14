import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { local } from "@/api/localStorageClient";
import MobileSelect from "@/components/MobileSelect";
import { formatDateInput } from "@/lib/salonUtils";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function BookAppointment() {
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    customer_name: "", phone: "", email: "", service_id: "", staff_id: "",
    date: formatDateInput(new Date()), time: "10:00", notes: "",
  });

  const { data: services = [] } = useQuery({ queryKey: ["public-services"], queryFn: () => local.entities.Service.filter({ active: true }) });
  const { data: staff = [] } = useQuery({ queryKey: ["public-staff"], queryFn: () => local.entities.Staff.filter({ active: true }) });
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: async () => { const l = await local.entities.Setting.list(); return l[0] || { salon_name: "Luxe Salon", theme_color: "#b45309" }; } });

  const accent = settings?.theme_color || "#b45309";
  const field = "w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const service = services.find((s) => s.id === form.service_id);
    const staffMember = staff.find((s) => s.id === form.staff_id);
    const dt = new Date(`${form.date}T${form.time}`);

    // Find or create a customer profile so reminders can be sent
    let customerId = null;
    const existing = form.phone ? await local.entities.Customer.filter({ phone: form.phone }) : [];
    if (existing.length > 0) {
      customerId = existing[0].id;
    } else {
      const created = await local.entities.Customer.create({
        name: form.customer_name,
        phone: form.phone,
        email: form.email || undefined,
      });
      customerId = created.id;
    }

    await local.entities.Appointment.create({
      customer_id: customerId,
      customer_name: form.customer_name,
      notes: form.phone ? `Phone: ${form.phone}${form.notes ? " | " + form.notes : ""}` : form.notes,
      service_id: form.service_id,
      service_name: service?.name,
      staff_id: form.staff_id,
      staff_name: staffMember?.name,
      date: dt.toISOString(),
      duration: service?.duration || 30,
      price: service?.price || 0,
      status: "scheduled",
    });
    setSaving(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4" style={{ colorScheme: "light" }}>
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-stone-100 text-stone-900">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: accent }} />
          <h1 className="font-display text-xl font-bold text-stone-900">Appointment Booked!</h1>
          <p className="text-sm text-stone-500 mt-2">We look forward to seeing you. The salon has been notified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 flex items-center justify-center" style={{ colorScheme: "light" }}>
      <form onSubmit={submit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-sm border border-stone-100 text-stone-900">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5" style={{ color: accent }} />
          <h1 className="font-display text-xl font-bold text-stone-900">{settings?.salon_name || "Book an Appointment"}</h1>
        </div>
        <p className="text-sm text-stone-500 mb-5">Fill in your details to schedule a visit.</p>
        <div className="space-y-3">
          <input className={field} placeholder="Your name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
          <input className={field} placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input type="email" className={field} placeholder="Email (for reminders)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <MobileSelect className={field} value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} required>
            <option value="">Select a service...</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>)}
          </MobileSelect>
          <MobileSelect className={field} value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} required>
            <option value="">Select a staff member...</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
          </MobileSelect>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <input type="time" className={field} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
          </div>
          <textarea className={field} rows={2} placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <label className="flex items-start gap-2 mt-4 text-xs text-stone-600">
          <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
          <span>
            I have read and agree to the{" "}
            <Link to="/terms" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: accent }}>
              Terms & Conditions
            </Link>.
          </span>
        </label>
        <button type="submit" disabled={saving || !agreed} className="w-full mt-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style={{ background: accent }}>
          {saving ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
}