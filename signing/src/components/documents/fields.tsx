export const inputClass =
  "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition-shadow focus:border-admin focus:ring-2 focus:ring-admin/20";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
