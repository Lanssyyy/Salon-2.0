import { useState } from "react";
import { local } from "@/api/localStorageClient";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";

export default function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const requestDeletion = async () => {
    setSubmitting(true);
    await local.auth.logout();
    setSubmitting(false);
    setDone(true);
    setConfirming(false);
    setTimeout(() => { window.location.href = "/login"; }, 1000);
  };

  return (
    <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-sm">
      <h2 className="font-display font-semibold text-rose-700 flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4" /> Danger Zone
      </h2>
      <p className="text-sm text-stone-500 mb-4">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>
      {done ? (
        <p className="text-sm text-emerald-600 font-medium">
          This local session has been signed out. Use backup restore or administrator tools for data removal.
        </p>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50"
        >
          <Trash2 className="w-4 h-4" /> Delete My Account
        </button>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold text-stone-900">Delete account?</h3>
              <button onClick={() => setConfirming(false)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <p className="text-sm text-stone-500 mb-5">
              This will permanently delete your account and all associated data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={requestDeletion}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Yes, Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}