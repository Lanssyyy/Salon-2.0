import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { local } from "@/api/localStorageClient";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import PullToRefresh from "@/components/PullToRefresh";
import useUrlModal from "@/hooks/useUrlModal";
import {
  formatCurrency, formatDate, generateInvoiceNumber,
  computeInvoiceTotals, computeCommission, VIEW_OPTIONS, filterByView
} from "@/lib/salonUtils";
import { Plus, Search, Printer, X, ReceiptText } from "lucide-react";
import { motion } from "framer-motion";
import MobileSelect from "@/components/MobileSelect";

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all");
  const modal = useUrlModal("invoice");
  const [printItem, setPrintItem] = useState(null);
  const qc = useQueryClient();

  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: () => local.entities.Invoice.list("-date", 1000) });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: async () => { const l = await local.entities.Setting.list(); return l[0] || { currency: "$", salon_name: "Luxe Salon" }; } });

  const currency = settings?.currency || "$";

  const createMutation = useMutation({
    mutationFn: async ({ invoiceData, customer, total }) => {
      await local.entities.Invoice.create(invoiceData);
      if (customer) {
        await local.entities.Customer.update(customer.id, {
          total_spent: (customer.total_spent || 0) + total,
          total_visits: (customer.total_visits || 0) + 1,
          last_visit_date: new Date().toISOString(),
          loyalty_points: (customer.loyalty_points || 0) + Math.floor(total),
        });
      }
    },
    onMutate: async ({ invoiceData }) => {
      await qc.cancelQueries({ queryKey: ["invoices"] });
      const previous = qc.getQueryData(["invoices"]);
      qc.setQueryData(["invoices"], (old = []) => [{ ...invoiceData, id: `temp-${Date.now()}` }, ...old]);
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) qc.setQueryData(["invoices"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const filtered = useMemo(() => {
    let list = view === "all" ? invoices : filterByView(invoices, view);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.invoice_number?.toLowerCase().includes(q) || i.customer_name?.toLowerCase().includes(q));
    }
    return list;
  }, [invoices, view, search]);

  const totalRevenue = filtered.reduce((s, i) => s + (i.total || 0), 0);
  const totalCommission = filtered.reduce((s, i) => s + (i.commission_total || 0), 0);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">Invoices & Receipts</h1>
          <p className="text-sm text-stone-500 mt-1">{filtered.length} invoices · {formatCurrency(totalRevenue, currency)} revenue</p>
        </div>
        <button onClick={modal.openNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatBox label="Total Revenue" value={formatCurrency(totalRevenue, currency)} />
        <StatBox label="Commissions" value={formatCurrency(totalCommission, currency)} />
        <StatBox label="Avg Invoice" value={formatCurrency(filtered.length ? totalRevenue / filtered.length : 0, currency)} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice # or customer..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
        </div>
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
          <button onClick={() => setView("all")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${view === "all" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>All</button>
          {VIEW_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => setView(o.value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${view === o.value ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>{o.label}</button>
          ))}
        </div>
      </div>

      <PullToRefresh onRefresh={() => qc.invalidateQueries({ queryKey: ["invoices"] })}>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Invoice #</th>
                <th className="text-left px-5 py-3 font-semibold">Customer</th>
                <th className="text-left px-5 py-3 font-semibold">Date</th>
                <th className="text-left px-5 py-3 font-semibold">Payment</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Total</th>
                <th className="text-center px-5 py-3 font-semibold">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-stone-50/50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-stone-700">{inv.invoice_number}</td>
                  <td className="px-5 py-3 font-medium text-stone-800">{inv.customer_name || "Walk-in"}</td>
                  <td className="px-5 py-3 text-stone-600">{formatDate(inv.date)}</td>
                  <td className="px-5 py-3 text-stone-600 capitalize">{inv.payment_method}</td>
                  <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3 text-right font-semibold text-stone-800">{formatCurrency(inv.total, currency)}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => setPrintItem(inv)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Printer className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-stone-400">No invoices found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      </PullToRefresh>

      {modal.isOpen && <InvoiceForm onClose={modal.close} onSaved={(data) => { modal.close(); createMutation.mutate(data); }} />}
      {printItem && <PrintReceipt invoice={printItem} settings={settings} onClose={() => setPrintItem(null)} />}
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

function InvoiceForm({ onClose, onSaved }) {
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => local.entities.Customer.list() });
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => local.entities.Staff.list() });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: () => local.entities.Service.list() });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => local.entities.Product.list() });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: async () => { const l = await local.entities.Setting.list(); return l[0] || { currency: "$", default_tax_rate: 0 }; } });

  const [items, setItems] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [saving, setSaving] = useState(false);

  const currency = settings?.currency || "$";
  const taxRate = settings?.default_tax_rate || 0;
  const totals = useMemo(() => computeInvoiceTotals(items, taxRate, discount), [items, taxRate, discount]);
  const commission = useMemo(() => computeCommission(items, staff), [items, staff]);

  const addService = (id) => {
    const s = services.find((x) => x.id === id);
    if (!s) return;
    setItems([...items, { name: s.name, type: "service", quantity: 1, price: s.price, staff_id: "", staff_name: "" }]);
  };
  const addProduct = (id) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setItems([...items, { name: p.name, type: "product", quantity: 1, price: p.unit_price, staff_id: "", staff_name: "" }]);
  };
  const updateItem = (idx, key, val) => setItems(items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const submit = (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSaving(true);
    const customer = customers.find((c) => c.id === customerId);
    const invoiceData = {
      invoice_number: generateInvoiceNumber(),
      customer_id: customerId || null,
      customer_name: customer?.name || "Walk-in",
      date: new Date().toISOString(),
      items,
      subtotal: totals.subtotal,
      tax_rate: taxRate,
      tax_amount: totals.taxAmount,
      discount: Number(discount) || 0,
      total: totals.total,
      payment_method: paymentMethod,
      status: "paid",
      commission_total: commission,
    };
    onSaved({ invoiceData, customer, total: totals.total });
    setSaving(false);
  };

  const field = "px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-stone-900">Create Invoice</h2>
          <button type="button" onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <MobileSelect className={field} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Walk-in customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </MobileSelect>
          <MobileSelect className={field} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {["cash", "card", "transfer", "wallet"].map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
          </MobileSelect>
        </div>

        <div className="flex gap-2 mb-3">
          <MobileSelect className={field} value="" placeholder="+ Add service..." onChange={(e) => { if (e.target.value) addService(e.target.value); }}>
            <option value="">+ Add service...</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price, currency)}</option>)}
          </MobileSelect>
          <MobileSelect className={field} value="" placeholder="+ Add product..." onChange={(e) => { if (e.target.value) addProduct(e.target.value); }}>
            <option value="">+ Add product...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.unit_price, currency)}</option>)}
          </MobileSelect>
        </div>

        <div className="border border-stone-100 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="text-left px-3 py-2">Item</th>
                <th className="text-center px-2 py-2 w-16">Qty</th>
                <th className="text-right px-2 py-2 w-24">Price</th>
                <th className="text-left px-2 py-2 w-32">Staff</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 font-medium text-stone-800">{it.name}</td>
                  <td className="px-2 py-2"><input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} className="w-14 px-1.5 py-1 rounded border border-stone-200 text-center text-sm" /></td>
                  <td className="px-2 py-2"><input type="number" step="0.01" value={it.price} onChange={(e) => updateItem(idx, "price", Number(e.target.value))} className="w-20 px-1.5 py-1 rounded border border-stone-200 text-right text-sm" /></td>
                  <td className="px-2 py-2">
                    <MobileSelect value={it.staff_id} onChange={(e) => { const st = staff.find((s) => s.id === e.target.value); updateItem(idx, "staff_id", e.target.value); updateItem(idx, "staff_name", st?.name || ""); }} className="w-full px-1.5 py-1 rounded border border-stone-200 text-xs">
                      <option value="">—</option>
                      {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </MobileSelect>
                  </td>
                  <td className="px-2 py-2"><button type="button" onClick={() => removeItem(idx)} className="text-rose-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-stone-400 text-xs">No items added yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-56 space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatCurrency(totals.subtotal, currency)} />
            <Row label={`Tax (${taxRate}%)`} value={formatCurrency(totals.taxAmount, currency)} />
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Discount</span>
              <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-20 px-2 py-1 rounded border border-stone-200 text-right text-sm" />
            </div>
            <Row label="Commission" value={formatCurrency(commission, currency)} muted />
            <div className="flex justify-between pt-2 border-t border-stone-100">
              <span className="font-bold text-stone-900">Total</span>
              <span className="font-display font-bold text-lg text-stone-900">{formatCurrency(totals.total, currency)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
          <button type="submit" disabled={saving || items.length === 0} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50">{saving ? "Saving..." : "Create & Charge"}</button>
        </div>
      </motion.form>
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-500">{label}</span>
      <span className={muted ? "text-stone-400" : "text-stone-700 font-medium"}>{value}</span>
    </div>
  );
}

function PrintReceipt({ invoice, settings, onClose }) {
  const currency = settings?.currency || "$";
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center mx-auto mb-2"><ReceiptText className="w-6 h-6" /></div>
          <h2 className="font-display text-xl font-bold text-stone-900">{settings?.salon_name || "Luxe Salon"}</h2>
          <p className="text-xs text-stone-500">{settings?.address || ""}</p>
          <p className="text-xs text-stone-500">{settings?.phone || ""}</p>
        </div>
        <div className="border-t border-b border-dashed border-stone-200 py-3 mb-3 text-xs text-stone-500 flex justify-between">
          <span>{invoice.invoice_number}</span>
          <span>{formatDate(invoice.date, "MMM d, yyyy h:mm a")}</span>
        </div>
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs text-stone-400"><span>Customer</span><span className="text-stone-700 font-medium">{invoice.customer_name}</span></div>
          <div className="flex justify-between text-xs text-stone-400"><span>Payment</span><span className="text-stone-700 font-medium capitalize">{invoice.payment_method}</span></div>
        </div>
        <div className="space-y-1.5 border-t border-stone-100 pt-3 mb-3">
          {(invoice.items || []).map((it, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-stone-700">{it.quantity}× {it.name}</span>
              <span className="text-stone-700">{formatCurrency((it.price || 0) * (it.quantity || 1), currency)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-stone-200 pt-3 space-y-1 text-sm">
          <Row label="Subtotal" value={formatCurrency(invoice.subtotal, currency)} />
          <Row label={`Tax (${invoice.tax_rate || 0}%)`} value={formatCurrency(invoice.tax_amount, currency)} />
          {invoice.discount > 0 && <Row label="Discount" value={`-${formatCurrency(invoice.discount, currency)}`} />}
          <div className="flex justify-between pt-2 border-t border-stone-100">
            <span className="font-bold text-stone-900">Total</span>
            <span className="font-display font-bold text-lg text-stone-900">{formatCurrency(invoice.total, currency)}</span>
          </div>
        </div>
        <p className="text-center text-xs text-stone-400 mt-4">Thank you for your visit!</p>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50">Close</button>
          <button type="button" onClick={handlePrint} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 inline-flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print</button>
        </div>
      </motion.div>
    </div>
  );
}