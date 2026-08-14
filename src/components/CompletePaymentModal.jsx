import { useState } from "react";
import { motion } from "framer-motion";
import MobileSelect from "@/components/MobileSelect";

export default function CompletePaymentModal({ appointment, onClose, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onConfirm(paymentMethod);
    setSaving(false);
  };

  const field = "w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={submit}
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
      >
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-1">Mark as Completed</h2>
        <p className="text-sm text-stone-500 mb-4">
          {appointment.customer_name} — {appointment.service_name} (${(appointment.price || 0).toFixed(2)})
        </p>
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Payment Method</label>
        <MobileSelect className={field} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          {["cash", "card", "transfer", "wallet"].map((m) => <option key={m} value={m}>{m}</option>)}
        </MobileSelect>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50">
            {saving ? "Saving..." : "Confirm & Invoice"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}