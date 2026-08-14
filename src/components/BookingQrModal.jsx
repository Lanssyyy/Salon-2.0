import { X, Copy } from "lucide-react";
import { motion } from "framer-motion";

export default function BookingQrModal({ onClose }) {
  const bookingUrl = `${window.location.origin}/book`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(bookingUrl)}`;

  const copyLink = () => navigator.clipboard.writeText(bookingUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-stone-900">Self-Booking QR Code</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
        </div>
        <p className="text-sm text-stone-500 mb-4">Customers scan this to book their own appointment. New bookings appear here automatically.</p>
        <img src={qrSrc} alt="Booking QR code" className="mx-auto rounded-xl border border-stone-100" />
        <button onClick={copyLink} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-sm font-semibold hover:bg-stone-200">
          <Copy className="w-4 h-4" /> Copy Link
        </button>
      </motion.div>
    </div>
  );
}