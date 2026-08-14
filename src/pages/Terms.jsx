import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles } from "lucide-react";

export default function Terms() {
  const { data: settings } = useQuery({
    queryKey: ["public-settings-terms"],
    queryFn: async () => {
      const l = await base44.entities.Setting.list();
      return l[0] || { salon_name: "Luxe Salon", theme_color: "#b45309" };
    },
  });

  const accent = settings?.theme_color || "#b45309";
  const salonName = settings?.salon_name || "Luxe Salon";

  return (
    <div className="min-h-screen bg-stone-50 p-4 flex justify-center" style={{ colorScheme: "light" }}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8 shadow-sm border border-stone-100 text-stone-900">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5" style={{ color: accent }} />
          <h1 className="font-display text-xl font-bold text-stone-900">{salonName} — Terms & Conditions</h1>
        </div>
        <p className="text-sm text-stone-500 mb-5">Please read the following terms before booking an appointment.</p>

        <div className="space-y-4 text-sm text-stone-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-stone-900 mb-1">1. Appointments</h2>
            <p>All appointments booked through this site are subject to staff and time-slot availability. {salonName} will contact you to confirm any changes to your booking.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-900 mb-1">2. Cancellations & No-Shows</h2>
            <p>Please notify us as early as possible if you need to cancel or reschedule. Repeated no-shows may result in a request for prepayment on future bookings.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-900 mb-1">3. Late Arrivals</h2>
            <p>Arriving late may result in a shortened service or the need to reschedule, depending on staff availability.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-900 mb-1">4. Contact Information</h2>
            <p>By submitting your name, phone number, and email, you consent to being contacted by {salonName} regarding your appointment, including reminder messages.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-900 mb-1">5. Pricing</h2>
            <p>Service prices are as listed at time of booking and are subject to change without prior notice.</p>
          </section>
        </div>
      </div>
    </div>
  );
}