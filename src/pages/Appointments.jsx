import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import PullToRefresh from "@/components/PullToRefresh";
import useUrlModal from "@/hooks/useUrlModal";
import { formatDate, formatDateInput, generateInvoiceNumber, VIEW_OPTIONS, filterByView } from "@/lib/salonUtils";
import { CalendarPlus, Search, ChevronLeft, ChevronRight, QrCode, List, CalendarDays, Clock4, CheckCircle2, BellRing } from "lucide-react";
import { motion } from "framer-motion";
import MobileSelect from "@/components/MobileSelect";
import BookingQrModal from "@/components/BookingQrModal";
import AppointmentCalendar from "@/components/AppointmentCalendar";
import DayScheduleCalendar from "@/components/DayScheduleCalendar";
import CompletePaymentModal from "@/components/CompletePaymentModal";

export default function Appointments() {
  const [view, setView] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [showQr, setShowQr] = useState(false);
  const [layout, setLayout] = useState("list");
  const modal = useUrlModal("appointment");
  const [completingAppt, setCompletingAppt] = useState(null);
  const qc = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date", 1000),
  });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => base44.entities.Customer.list() });
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => base44.entities.Staff.list() });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: () => base44.entities.Service.list() });

  // Auto-flag overdue scheduled appointments (date passed, no payment recorded) as No Show
  useEffect(() => {
    const overdue = appointments.filter((a) => a.status === "scheduled" && a.date && new Date(a.date) < new Date());
    if (overdue.length > 0) {
      Promise.all(overdue.map((a) => base44.entities.Appointment.update(a.id, { status: "no_show" }))).then(() => {
        qc.invalidateQueries({ queryKey: ["appointments"] });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments.length]);

  // Automated reminders: on load, send a reminder for scheduled appointments happening within the next 24h that haven't been reminded yet
  useEffect(() => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const due = appointments.filter((a) => a.status === "scheduled" && !a.reminder_sent && a.date && new Date(a.date) > now && new Date(a.date) <= in24h);
    due.forEach((a) => sendReminder(a, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments.length, customers.length]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onMutate: async (newAppt) => {
      await qc.cancelQueries({ queryKey: ["appointments"] });
      const previous = qc.getQueryData(["appointments"]);
      qc.setQueryData(["appointments"], (old = []) => [{ ...newAppt, id: `temp-${Date.now()}` }, ...old]);
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) qc.setQueryData(["appointments"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const completeMutation = useMutation({
    mutationFn: async ({ appointment, paymentMethod }) => {
      const customer = customers.find((c) => c.id === appointment.customer_id);
      const total = appointment.price || 0;
      await base44.entities.Invoice.create({
        invoice_number: generateInvoiceNumber(),
        appointment_id: appointment.id,
        customer_id: appointment.customer_id || null,
        customer_name: appointment.customer_name || "Walk-in",
        date: new Date().toISOString(),
        items: [{ name: appointment.service_name, type: "service", quantity: 1, price: total, staff_id: appointment.staff_id, staff_name: appointment.staff_name }],
        subtotal: total,
        tax_amount: 0,
        discount: 0,
        total,
        payment_method: paymentMethod,
        status: "paid",
      });
      await base44.entities.Appointment.update(appointment.id, { status: "completed", payment_status: "paid", payment_method: paymentMethod });
      if (customer) {
        await base44.entities.Customer.update(customer.id, {
          total_spent: (customer.total_spent || 0) + total,
          total_visits: (customer.total_visits || 0) + 1,
          last_visit_date: new Date().toISOString(),
          loyalty_points: (customer.loyalty_points || 0) + Math.floor(total),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const sendReminder = async (appointment, silent = false) => {
    const customer = customers.find((c) => c.id === appointment.customer_id);
    if (!customer?.email) return;
    await base44.integrations.Core.SendEmail({
      to: customer.email,
      subject: "Appointment Reminder",
      body: `Hi ${customer.name},\n\nThis is a reminder for your upcoming appointment:\n\nService: ${appointment.service_name || "—"}\nDate & Time: ${formatDate(appointment.date, "MMM d, yyyy · h:mm a")}\n\nSee you soon!`,
    });
    await base44.entities.Appointment.update(appointment.id, { reminder_sent: true });
    if (!silent) qc.invalidateQueries({ queryKey: ["appointments"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => {
      const update = { status };
      if (status === "no_show") update.payment_status = "no_show";
      if (status === "cancelled") update.payment_status = "cancelled";
      return base44.entities.Appointment.update(id, update);
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["appointments"] });
      const previous = qc.getQueryData(["appointments"]);
      qc.setQueryData(["appointments"], (old = []) =>
        old.map((a) => {
          if (a.id !== id) return a;
          const updated = { ...a, status };
          if (status === "no_show") updated.payment_status = "no_show";
          if (status === "cancelled") updated.payment_status = "cancelled";
          return updated;
        })
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) qc.setQueryData(["appointments"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, date }) => base44.entities.Appointment.update(id, { date }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const filtered = useMemo(() => {
    let list = appointments;
    if (view !== "all") list = filterByView(list, view, "date");
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.customer_name?.toLowerCase().includes(q) || a.service_name?.toLowerCase().includes(q));
    }
    return list;
  }, [appointments, view, statusFilter, search]);

  const navigateDate = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(formatDateInput(d));
  };

  const handleRefresh = () => qc.invalidateQueries({ queryKey: ["appointments"] });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">Appointments</h1>
          <p className="text-sm text-stone-500 mt-1">{filtered.length} scheduled · {view} view</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQr(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-50 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Booking QR
          </button>
          <button
            onClick={modal.openNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or service..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
        </div>
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          {VIEW_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setView(o.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === o.value ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <MobileSelect
          className="px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </MobileSelect>
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          <button onClick={() => setLayout("list")} title="List view" className={`p-2 rounded-lg transition-all ${layout === "list" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setLayout("day")} title="Day schedule" className={`p-2 rounded-lg transition-all ${layout === "day" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>
            <Clock4 className="w-4 h-4" />
          </button>
          <button onClick={() => setLayout("calendar")} title="Month calendar" className={`p-2 rounded-lg transition-all ${layout === "calendar" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>
            <CalendarDays className="w-4 h-4" />
          </button>
        </div>
      </div>

      {layout === "calendar" ? (
        <AppointmentCalendar appointments={filtered} />
      ) : layout === "day" ? (
        <DayScheduleCalendar
          appointments={filtered}
          selectedDate={new Date(selectedDate + "T00:00:00")}
          onDateChange={(d) => setSelectedDate(formatDateInput(d))}
          onMoveAppointment={(appt, newDate) => moveMutation.mutate({ id: appt.id, date: newDate })}
        />
      ) : (
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-semibold">Customer</th>
                    <th className="text-left px-5 py-3 font-semibold">Service</th>
                    <th className="text-left px-5 py-3 font-semibold">Staff</th>
                    <th className="text-left px-5 py-3 font-semibold">Date & Time</th>
                    <th className="text-left px-5 py-3 font-semibold">Status</th>
                    <th className="text-left px-5 py-3 font-semibold">Payment</th>
                    <th className="text-right px-5 py-3 font-semibold">Price</th>
                    <th className="text-center px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-stone-800">{a.customer_name}</td>
                      <td className="px-5 py-3 text-stone-600">{a.service_name || "—"}</td>
                      <td className="px-5 py-3 text-stone-600">{a.staff_name || "—"}</td>
                      <td className="px-5 py-3 text-stone-600">{formatDate(a.date, "MMM d, yyyy · h:mm a")}</td>
                      <td className="px-5 py-3">
                        <MobileSelect
                          className="px-2 py-1 rounded-lg border border-stone-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-stone-300"
                          value={a.status}
                          onChange={(e) => {
                            if (e.target.value === "completed") {
                              setCompletingAppt(a);
                            } else {
                              statusMutation.mutate({ id: a.id, status: e.target.value });
                            }
                          }}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no_show">No Show</option>
                        </MobileSelect>
                      </td>
                      <td className="px-5 py-3">
                        {a.payment_status === "paid" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize bg-emerald-50 text-emerald-700 border-emerald-200">
                            Paid · {a.payment_method}
                          </span>
                        ) : a.payment_status === "cancelled" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize bg-rose-50 text-rose-700 border-rose-200">
                            Cancelled
                          </span>
                        ) : a.payment_status === "no_show" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize bg-stone-100 text-stone-600 border-stone-200">
                            No Show
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-stone-800">${(a.price || 0).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {(a.status === "scheduled" || a.status === "no_show") && (
                            <button
                              onClick={() => setCompletingAppt(a)}
                              title="Mark Completed"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {a.status === "scheduled" && new Date(a.date) > new Date() && (
                            <button
                              onClick={() => sendReminder(a)}
                              title="Send Reminder"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                            >
                              <BellRing className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-12 text-stone-400">No appointments found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </PullToRefresh>
      )}

      {modal.isOpen && (
        <AppointmentForm
          customers={customers}
          staff={staff}
          services={services}
          defaultDate={selectedDate}
          onClose={modal.close}
          onSaved={(data) => { modal.close(); createMutation.mutate(data); }}
          onCustomerCreated={() => qc.invalidateQueries({ queryKey: ["customers"] })}
        />
      )}
      {showQr && <BookingQrModal onClose={() => setShowQr(false)} />}
      {completingAppt && (
        <CompletePaymentModal
          appointment={completingAppt}
          onClose={() => setCompletingAppt(null)}
          onConfirm={async (paymentMethod) => {
            await completeMutation.mutateAsync({ appointment: completingAppt, paymentMethod });
            setCompletingAppt(null);
          }}
        />
      )}
    </Layout>
  );
}

function AppointmentForm({ customers, staff, services, defaultDate, onClose, onSaved, onCustomerCreated }) {
  const [form, setForm] = useState({
    customer_id: "", staff_id: "", service_id: "", date: defaultDate, time: "10:00", notes: "", status: "scheduled", payment_method: "",
    new_customer_name: "", new_customer_email: "", new_customer_phone: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let customer = customers.find((c) => c.id === form.customer_id);
    if (form.customer_id === "__new__") {
      customer = await base44.entities.Customer.create({
        name: form.new_customer_name,
        email: form.new_customer_email || undefined,
        phone: form.new_customer_phone || undefined,
      });
      onCustomerCreated?.();
    }
    const staffMember = staff.find((s) => s.id === form.staff_id);
    const service = services.find((s) => s.id === form.service_id);
    const dt = new Date(`${form.date}T${form.time}`);
    onSaved({
      customer_id: customer?.id || "",
      customer_name: customer?.name || form.customer_name,
      staff_id: form.staff_id,
      staff_name: staffMember?.name,
      service_id: form.service_id,
      service_name: service?.name,
      date: dt.toISOString(),
      duration: service?.duration || 30,
      price: service?.price || 0,
      status: form.status,
      payment_method: form.payment_method || undefined,
      notes: form.notes,
    });
    setSaving(false);
  };

  const field = "w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={submit}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">New Appointment</h2>
        <div className="space-y-3">
          <MobileSelect className={field} value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required>
            <option value="">Select customer...</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new__">+ Add new customer</option>
          </MobileSelect>
          {form.customer_id === "__new__" && (
            <div className="space-y-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
              <input className={field} placeholder="Customer name" value={form.new_customer_name} onChange={(e) => setForm({ ...form, new_customer_name: e.target.value })} required />
              <input type="email" className={field} placeholder="Email (optional)" value={form.new_customer_email} onChange={(e) => setForm({ ...form, new_customer_email: e.target.value })} />
              <input className={field} placeholder="Phone (optional)" value={form.new_customer_phone} onChange={(e) => setForm({ ...form, new_customer_phone: e.target.value })} />
            </div>
          )}
          <MobileSelect className={field} value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} required>
            <option value="">Select service...</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>)}
          </MobileSelect>
          <MobileSelect className={field} value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} required>
            <option value="">Select staff...</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
          </MobileSelect>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <input type="time" className={field} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
          </div>
          <MobileSelect className={field} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </MobileSelect>
          <MobileSelect className={field} value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} placeholder="Payment method (optional)">
            <option value="">Payment method (optional)</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Transfer</option>
            <option value="wallet">Wallet</option>
          </MobileSelect>
          <textarea className={field} rows={2} placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50">
            {saving ? "Saving..." : "Book"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}