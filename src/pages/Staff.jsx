import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { local } from "@/api/localStorageClient";
import Layout from "@/components/Layout";
import PullToRefresh from "@/components/PullToRefresh";
import useUrlModal from "@/hooks/useUrlModal";
import { formatCurrency, initials, staffLeaderboard } from "@/lib/salonUtils";
import { UserPlus, Pencil, Trash2, Star, Trophy, X } from "lucide-react";
import { motion } from "framer-motion";
import MobileSelect from "@/components/MobileSelect";

export default function Staff() {
  const modal = useUrlModal("staff");
  const qc = useQueryClient();

  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => local.entities.Staff.list() });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: () => local.entities.Invoice.list("-date", 500) });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: async () => { const l = await local.entities.Setting.list(); return l[0] || { currency: "$" }; } });

  const currency = settings?.currency || "$";
  const accent = settings?.theme_color || "#b45309";
  const leaderboard = useMemo(() => staffLeaderboard(invoices, staff), [invoices, staff]);
  const rankMap = useMemo(() => Object.fromEntries(leaderboard.map((s, i) => [s.id, i + 1])), [leaderboard]);

  const totalCommission = invoices.reduce((sum, inv) => sum + (inv.commission_total || 0), 0);

  const del = async (id) => {
    if (!confirm("Delete this staff member?")) return;
    await local.entities.Staff.delete(id);
    qc.invalidateQueries(["staff"]);
  };

  const editItem = useMemo(() => staff.find((s) => s.id === modal.editId) || null, [staff, modal.editId]);
  const handleRefresh = () => qc.invalidateQueries({ queryKey: ["staff"] });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">Staff & Performance</h1>
          <p className="text-sm text-stone-500 mt-1">{staff.length} team members · {formatCurrency(totalCommission, currency)} commissions paid</p>
        </div>
        <button onClick={modal.openNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800">
          <UserPlus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="font-display font-semibold text-stone-900">Performance Leaderboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((s, i) => (
            <div key={s.id} className={`rounded-xl p-4 ${i === 0 ? "bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200" : "bg-stone-50 border border-stone-100"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{["🥇", "🥈", "🥉"][i]}</span>
                <div>
                  <p className="font-semibold text-stone-900">{s.name}</p>
                  <p className="text-xs text-stone-500">{s.count} services completed</p>
                </div>
                <span className="ml-auto font-display font-bold text-stone-900">{formatCurrency(s.revenue, currency)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {staff.map((s) => {
          const rank = rankMap[s.id] || staff.length;
          const lb = leaderboard.find((x) => x.id === s.id);
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold flex-shrink-0" style={{ background: accent }}>{initials(s.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900 truncate">{s.name}</h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">#{rank}</span>
                  </div>
                  <p className="text-xs text-stone-500">{s.role}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-stone-600">{s.rating || 5}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-stone-50">
                <div><p className="text-[10px] text-stone-400 uppercase">Revenue</p><p className="text-sm font-semibold text-stone-800">{formatCurrency(lb?.revenue || 0, currency)}</p></div>
                <div><p className="text-[10px] text-stone-400 uppercase">Commission</p><p className="text-sm font-semibold text-stone-800">{s.commission_rate || 0}%</p></div>
                <div><p className="text-[10px] text-stone-400 uppercase">Jobs</p><p className="text-sm font-semibold text-stone-800">{lb?.count || 0}</p></div>
              </div>
              <div className="flex justify-end gap-1 mt-3">
                <button onClick={() => modal.openEdit(s.id)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => del(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </motion.div>
          );
        })}
      </div>
      </PullToRefresh>

      {modal.isOpen && <StaffForm item={editItem} onClose={modal.close} onSaved={() => { modal.close(); qc.invalidateQueries(["staff"]); }} />}
    </Layout>
  );
}

function StaffForm({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item || { name: "", role: "Stylist", email: "", phone: "", commission_rate: 10, rating: 5, active: true });
  const [saving, setSaving] = useState(false);
  const field = "w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (item?.id) await local.entities.Staff.update(item.id, form);
    else await local.entities.Staff.create(form);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-stone-900">{item ? "Edit Staff" : "Add Staff"}</h2>
          <button type="button" onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
        </div>
        <div className="space-y-3">
          <input className={field} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <MobileSelect className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {["Stylist", "Barber", "Colorist", "Beautician", "Manager", "Receptionist"].map((r) => <option key={r} value={r}>{r}</option>)}
          </MobileSelect>
          <input className={field} type="email" placeholder="Email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={field} placeholder="Phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500">Commission %</label>
              <input className={field} type="number" min="0" max="100" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-stone-500">Rating</label>
              <input className={field} type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
        </div>
      </motion.form>
    </div>
  );
}