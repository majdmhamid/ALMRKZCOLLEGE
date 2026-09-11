import { site } from "@content/site";
import { WhatsAppIcon } from "./Icons";

/** زر واتساب عائم يظهر في كل الصفحات */
export default function WhatsAppButton({ label }: { label: string }) {
  return (
    <a
      href={site.whatsappUrl}
      target="_blank"
      rel="noopener"
      aria-label={label}
      className="fixed bottom-5 end-5 z-50 inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-3 text-white shadow-lg transition hover:scale-105 hover:bg-[#1fb857] focus-visible:outline-white md:px-5"
    >
      <WhatsAppIcon width={26} height={26} />
      <span className="hidden font-bold md:inline">{label}</span>
    </a>
  );
}
