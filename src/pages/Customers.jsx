import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import PullToRefresh from "@/components/PullToRefresh";
import useUrlModal from "@/hooks/useUrlModal";
import { formatCurrency, formatDate, initials } from "@/lib/salonUtils";
import { UserPlus, Search, Pencil, Trash2, Star, X } from "lucide-react";
import { motion } from "framer-motion";
import MobileSelect from "@/components/MobileSelect";

export default function Customers() {
  const [search, setSearch] = useState("");
  const modal = useUrlModal("customer");
  const qc = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => base44.entities.Customer.list("-created_date", 1000),
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => { const l = await base44.entities.Setting.list(); return l[0] || { currency: "$" }; },
  });

  const currency = settings?.currency || "$";

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? base44.entities.Customer.update(id, data) : base44.entities.Customer.create(data)),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["customers"] });
      const previous = qc.getQueryData(["customers"]);
      qc.setQueryData(["customers"], (old = []) =>
        id ? old.map((c) => (c.id === id ? { ...c, ...data } : c)) : [{ ...data, id: `temp-${Date.now()}` }, ...old]
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) qc.setQueryData(["customers"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["customers"] });
      const previous = qc.getQueryData(["customers"]);
      qc.setQueryData(["customers"], (old = []) => old.filter((c) => c.id !== id));
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) qc.setQueryData(["customers"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q));
  }, [customers, search]);

  const totalLoyalty = customers.reduce((s, c) => s + (c.loyalty_points || 0), 0);
  const totalSpent = customers.reduce((s, c) => s + (c.total_spent || 0), 0);

  const del = (id) => {
    if (!confirm("Delete this customer?")) return;
    deleteMutation.mutate(id);
  };

  const editItem = useMemo(() => customers.find((c) => c.id === modal.editId) || null, [customers, modal.editId]);
  const handleRefresh = () => qc.invalidateQueries({ queryKey: ["customers"] });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">Customer CRM</h1>
          <p className="text-sm text-stone-500 mt-1">{customers.length} customers · {formatCurrency(totalSpent, currency)} lifetime value</p>
        </div>
        <button onClick={modal.openNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800">
          <UserPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatBox label="Total Customers" value={customers.length} />
        <StatBox label="Loyalty Points" value={totalLoyalty.toLocaleString()} />
        <StatBox label="Avg. Spend" value={formatCurrency(customers.length ? totalSpent / customers.length : 0, currency)} />
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or phone..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-stone-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{initials(c.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-stone-900 truncate">{c.name}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-stone-500 truncate">{c.email || "No email"}</p>
                  <p className="text-xs text-stone-500">{c.phone || "No phone"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-stone-50">
                <Metric label="Visits" value={c.total_visits || 0} />
                <Metric label="Spent" value={formatCurrency(c.total_spent || 0, currency)} />
                <Metric label="Points" value={c.loyalty_points || 0} icon={<Star className="w-3 h-3 text-amber-400" />} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-stone-400">Last visit: {c.last_visit_date ? formatDate(c.last_visit_date) : "—"}</span>
                <div className="flex gap-1">
                  <button onClick={() => modal.openEdit(c.id)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && <div className="col-span-full text-center py-16 text-stone-400">No customers found.</div>}
        </div>
      </PullToRefresh>

      {modal.isOpen && (
        <CustomerForm
          item={editItem}
          onClose={modal.close}
          onSaved={(data) => { modal.close(); saveMutation.mutate({ id: editItem?.id, data }); }}
        />
      )}
    </Layout>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
      <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-display font-bold text-stone-900 mt-1">{value}</p>
    </div>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div>
      <p className="text-[10px] text-stone-400 uppercase">{label}</p>
      <p className="text-sm font-semibold text-stone-800 flex items-center gap-1">{icon}{value}</p>
    </div>
  );
}

function CustomerForm({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item || { name: "", email: "", phone: "", address: "", loyalty_points: 0, notes: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const field = "w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

  const submit = (e) => {
    e.preventDefault();
    setSaving(true);
    onSaved(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-stone-900">{item ? "Edit Customer" : "Add Customer"}</h2>
          <button type="button" onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
        </div>
        <div className="space-y-3">
          <input className={field} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={field} type="email" placeholder="Email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={field} placeholder="Phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className={field} placeholder="Address" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className={field} type="number" placeholder="Loyalty points" value={form.loyalty_points || 0} onChange={(e) => setForm({ ...form, loyalty_points: Number(e.target.value) })} />
            <MobileSelect className={field} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </MobileSelect>
          </div>
          <textarea className={field} rows={2} placeholder="Notes" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
        </div>
      </motion.form>
    </div>
  );
}