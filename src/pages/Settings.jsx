import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import { Check, Save, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import DeleteAccountSection from "@/components/DeleteAccountSection";

const COLOR_PRESETS = ["#b45309", "#0369a1", "#15803d", "#7c3aed", "#be123c", "#0f766e", "#c2410c", "#1e293b"];

export default function Settings() {
  const qc = useQueryClient();
  const { data: existing } = useQuery({ queryKey: ["settings"], queryFn: async () => { const l = await base44.entities.Setting.list(); return l[0]; } });

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing && !form) {
      setForm(existing);
    } else if (!existing && !form) {
      setForm({
        salon_name: "Luxe Salon", address: "", phone: "", email: "", currency: "$",
        default_tax_rate: 0, loyalty_enabled: true, loyalty_rate: 1, theme_color: "#b45309",
      });
    }
  }, [existing]);

  const field = "w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (form.id) await base44.entities.Setting.update(form.id, form);
    else await base44.entities.Setting.create(form);
    setSaving(false);
    setSaved(true);
    qc.invalidateQueries(["settings"]);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!form) return <Layout><div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500 mt-1">Customize your salon branding and preferences</p>
      </div>

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="max-w-2xl space-y-6">
        <Section title="Salon Identity" icon={<span className="w-2 h-2 rounded-full bg-stone-900" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Salon Name"><input className={field} value={form.salon_name} onChange={(e) => setForm({ ...form, salon_name: e.target.value })} /></Field>
            <Field label="Currency Symbol"><input className={field} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Field>
          </div>
          <Field label="Address"><input className={field} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone"><input className={field} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Email"><input className={field} type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
        </Section>

        <Section title="Theme Color">
          <div className="flex flex-wrap gap-2.5">
            {COLOR_PRESETS.map((c) => (
              <button key={c} type="button" onClick={() => setForm({ ...form, theme_color: c })} className={`w-9 h-9 rounded-xl transition-transform ${form.theme_color === c ? "ring-2 ring-offset-2 ring-stone-900 scale-110" : ""}`} style={{ background: c }} />
            ))}
            <input type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="w-9 h-9 rounded-xl border border-stone-200 cursor-pointer" />
          </div>
        </Section>

        <Section title="Financials">
          <Field label="Default Tax Rate (%)"><input type="number" step="0.01" className={field} value={form.default_tax_rate} onChange={(e) => setForm({ ...form, default_tax_rate: Number(e.target.value) })} /></Field>
        </Section>

        <Section title="Loyalty Program">
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setForm({ ...form, loyalty_enabled: !form.loyalty_enabled })} className={`relative w-11 h-6 rounded-full transition-colors ${form.loyalty_enabled ? "bg-stone-900" : "bg-stone-200"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.loyalty_enabled ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-sm text-stone-700">Enable loyalty points (1 point per currency unit spent)</span>
          </label>
          <Field label="Points Multiplier"><input type="number" step="0.1" className={field} value={form.loyalty_rate} onChange={(e) => setForm({ ...form, loyalty_rate: Number(e.target.value) })} disabled={!form.loyalty_enabled} /></Field>
        </Section>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50">
            {saving ? <Save className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium"><Check className="w-4 h-4" /> Saved successfully</span>}
        </div>
      </motion.form>

      <div className="max-w-2xl mt-6">
        <DeleteAccountSection />
      </div>
    </Layout>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
      <h2 className="font-display font-semibold text-stone-900 mb-4 flex items-center gap-2">{icon}{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-stone-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}