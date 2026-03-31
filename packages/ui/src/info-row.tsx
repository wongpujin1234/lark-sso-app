export function InfoRow({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  className?: string;
}) {
  const empty = !value || value.trim() === "";
  return (
    <div
      className={`flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${className ?? ""}`}
    >
      <dt className="shrink-0 text-sm font-semibold text-slate-600">{label}</dt>
      <dd
        className={`text-right text-sm text-slate-900 sm:max-w-[65%] sm:truncate ${
          mono ? "font-mono text-xs sm:text-sm" : ""
        } ${empty ? "text-slate-400 italic" : ""}`}
        title={value ?? undefined}
      >
        {empty ? "Not available" : value}
      </dd>
    </div>
  );
}
