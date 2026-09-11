import { site } from "@content/site";
import { WhatsAppIcon } from "./Icons";

/** زر واتساب عائم — يظهر على الشاشات الكبيرة فقط (على الموبايل يوجد شريط ثابت أسفل الشاشة فيه واتساب) */
export default function WhatsAppButton({ label }: { label: string }) {
  return (
    <a
      href={site.whatsappUrl}
      target="_blank"
      rel="noopener"
      aria-label={label}
      className="pulse-ring fixed bottom-5 end-5 z-50 isolate hidden items-center gap-2 rounded-full bg-whatsapp px-5 py-3 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#1fb857] focus-visible:outline-white lg:inline-flex"
    >
      <WhatsAppIcon width={26} height={26} />
      <span className="font-bold">{label}</span>
    </a>
  );
}
