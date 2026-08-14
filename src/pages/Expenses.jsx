import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import PullToRefresh from "@/components/PullToRefresh";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { formatCurrency, formatDate, filterByView, VIEW_OPTIONS } from "@/lib/salonUtils";
import { Plus, Search, Trash2, Pencil, Receipt } from "lucide-react";

export default function Expenses() {
  const [view, setView] = useState("monthly");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-date", 1000),
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const list = await base44.entities.Setting.list();
      return list[0] || { currency: "$" };
    },
  });
  const currency = settings?.currency || "$";

  const saveMutation = useMutation({
    mutationFn: (data) => (data.id ? base44.entities.Expense.update(data.id, data) : base44.entities.Expense.create(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const filtered = useMemo(() => {
    let list = filterByView(expenses, view);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.description?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q));
    }
    return list;
  }, [expenses, view, search]);

  const totalExpenses = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  const handleRefresh = () => qc.invalidateQueries({ queryKey: ["expenses"] });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">Expenses</h1>
          <p className="text-sm text-stone-500 mt-1">{filtered.length} entries · {formatCurrency(totalExpenses, currency)} total</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Expense
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description or category..."
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
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-semibold">Description</th>
                  <th className="text-left px-5 py-3 font-semibold">Category</th>
                  <th className="text-left px-5 py-3 font-semibold">Date</th>
                  <th className="text-right px-5 py-3 font-semibold">Amount</th>
                  <th className="text-center px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-stone-800">{e.description}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-stone-600">{formatDate(e.date, "MMM d, yyyy")}</td>
                    <td className="px-5 py-3 text-right font-semibold text-stone-800">{formatCurrency(e.amount, currency)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setEditing(e); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(e.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-stone-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      No expenses recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PullToRefresh>

      {showForm && (
        <ExpenseForm
          expense={editing}
          onClose={() => setShowForm(false)}
          onSaved={(data) => { setShowForm(false); saveMutation.mutate(data); }}
        />
      )}
    </Layout>
  );
}