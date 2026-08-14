import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { local } from "@/api/localStorageClient";
import Layout from "@/components/Layout";
import { formatCurrency, lowStockProducts } from "@/lib/salonUtils";
import { PackagePlus, Search, Pencil, Trash2, AlertTriangle, Package, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const qc = useQueryClient();

  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => local.entities.Product.list() });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: async () => { const l = await local.entities.Setting.list(); return l[0] || { currency: "$" }; } });

  const currency = settings?.currency || "$";
  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
  }, [products, search]);

  const lowStock = useMemo(() => lowStockProducts(products), [products]);
  const stockValue = products.reduce((s, p) => s + (p.unit_cost || 0) * (p.stock_quantity || 0), 0);
  const retailValue = products.reduce((s, p) => s + (p.unit_price || 0) * (p.stock_quantity || 0), 0);

  const del = async (id) => {
    if (!confirm("Delete this product?")) return;
    await local.entities.Product.delete(id);
    qc.invalidateQueries(["products"]);
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">Inventory</h1>
          <p className="text-sm text-stone-500 mt-1">{products.length} products · Stock value {formatCurrency(stockValue, currency)}</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800">
          <PackagePlus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatBox label="Total Products" value={products.length} />
        <StatBox label="Stock Value" value={formatCurrency(stockValue, currency)} />
        <StatBox label="Retail Value" value={formatCurrency(retailValue, currency)} />
        <StatBox label="Low Stock" value={lowStock.length} alert={lowStock.length > 0} />
      </div>

      {lowStock.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Reorder Alert</p>
            <p className="text-xs text-rose-600">{lowStock.map((p) => p.name).join(", ")} {lowStock.length === 1 ? "is" : "are"} below reorder level.</p>
          </div>
        </div>
      )}

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-left px-5 py-3 font-semibold">SKU</th>
                <th className="text-left px-5 py-3 font-semibold">Category</th>
                <th className="text-right px-5 py-3 font-semibold">Stock</th>
                <th className="text-right px-5 py-3 font-semibold">Cost</th>
                <th className="text-right px-5 py-3 font-semibold">Price</th>
                <th className="text-center px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map((p) => {
                const low = p.stock_quantity <= p.reorder_level;
                return (
                  <tr key={p.id} className="hover:bg-stone-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center"><Package className="w-4 h-4 text-stone-400" /></div>
                        <span className="font-medium text-stone-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-stone-500 font-mono text-xs">{p.sku || "—"}</td>
                    <td className="px-5 py-3 text-stone-600">{p.category || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-semibold ${low ? "text-rose-600" : "text-stone-800"}`}>{p.stock_quantity}</span>
                      {low && <span className="block text-[10px] text-rose-500">Reorder at {p.reorder_level}</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-stone-600">{formatCurrency(p.unit_cost, currency)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-stone-800">{formatCurrency(p.unit_price, currency)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => { setEditItem(p); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(p.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-stone-400">No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <ProductForm item={editItem} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); qc.invalidateQueries(["products"]); }} />}
    </Layout>
  );
}

function StatBox({ label, value, alert }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${alert ? "bg-rose-50 border-rose-200" : "bg-white border-stone-100"}`}>
      <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-display font-bold mt-1 ${alert ? "text-rose-700" : "text-stone-900"}`}>{value}</p>
    </div>
  );
}

function ProductForm({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item || { name: "", sku: "", category: "General", stock_quantity: 0, reorder_level: 5, unit_cost: 0, unit_price: 0, supplier: "", active: true });
  const [saving, setSaving] = useState(false);
  const field = "w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (item?.id) await local.entities.Product.update(item.id, form);
    else await local.entities.Product.create(form);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-stone-900">{item ? "Edit Product" : "Add Product"}</h2>
          <button type="button" onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
        </div>
        <div className="space-y-3">
          <input className={field} placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <input className={field} placeholder="SKU" value={form.sku || ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input className={field} placeholder="Category" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-stone-500">Stock qty</label><input className={field} type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} /></div>
            <div><label className="text-xs text-stone-500">Reorder level</label><input className={field} type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-stone-500">Unit cost</label><input className={field} type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })} /></div>
            <div><label className="text-xs text-stone-500">Unit price</label><input className={field} type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })} /></div>
          </div>
          <input className={field} placeholder="Supplier" value={form.supplier || ""} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </div>
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
        </div>
      </motion.form>
    </div>
  );
}