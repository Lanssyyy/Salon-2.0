import Layout from "@/components/Layout";
import { BookOpen } from "lucide-react";

const sections = [
  {
    title: "Dashboard",
    body: "Get an overview of revenue, expenses, net profit, upcoming appointments, low stock items, and top-performing staff for the selected time period.",
  },
  {
    title: "Appointments",
    body: "Create, view, and manage bookings. Use the Booking QR button to share a public link/QR code so customers can self-book. New customers entered here or via the QR page automatically get a profile in Customers so they can receive reminders.",
  },
  {
    title: "Customers",
    body: "View and manage customer profiles, loyalty points, visit history, and total spend. Add or edit customers manually at any time.",
  },
  {
    title: "Staff",
    body: "Manage your team, their roles, commission rates, and track individual performance and revenue generated.",
  },
  {
    title: "Inventory",
    body: "Track product stock levels, reorder thresholds, and pricing. Low-stock items are flagged automatically.",
  },
  {
    title: "Invoices",
    body: "Create and print invoices for completed services and products, and track payment status.",
  },
  {
    title: "Expenses",
    body: "Log business expenses by category to keep net profit calculations accurate on the Dashboard.",
  },
  {
    title: "Reports",
    body: "Review monthly revenue, profit, and commission trends for the current year, and export data to CSV.",
  },
  {
    title: "Settings",
    body: "Configure your salon name, branding color, tax rate, and loyalty program settings.",
  },
];

export default function Documentation() {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900">Documentation</h1>
        <p className="text-sm text-stone-500 mt-1">A quick guide to using each part of the app.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-stone-400" />
              <h2 className="font-display font-semibold text-stone-900">{s.title}</h2>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}