import { useState } from "react";
import { motion } from "framer-motion";
import MobileSelect from "@/components/MobileSelect";
import { formatDateInput } from "@/lib/salonUtils";

const CATEGORIES = ["Rent", "Utilities", "Supplies", "Salaries", "Marketing", "Maintenance", "Other"];

export default function ExpenseForm({ expense, onClose, onSaved }) {
  const [form, setForm] = useState({
    description: expense?.description || "",
    category: expense?.category || "Other",
    amount: expense?.amount || "",
    date: formatDateInput(expense?.date || new Date()),
    notes: expense?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSaving(true);
    onSaved({
      id: expense?.id,
      description: form.description,
      category: form.category,
      amount: Number(form.amount) || 0,
      date: new Date(form.date).toISOString(),
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
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">{expense ? "Edit Expense" : "New Expense"}</h2>
        <div className="space-y-3">
          <input className={field} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <MobileSelect className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </MobileSelect>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" min="0" className={field} placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <input type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <textarea className={field} rows={2} placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}