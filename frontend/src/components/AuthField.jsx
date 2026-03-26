export default function AuthField({ label, id, ...props }) {
  return (
    <label className="grid gap-2.5" htmlFor={id}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        id={id}
        className="h-14 rounded-2xl border border-slate-200/90 bg-white px-4 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        {...props}
      />
    </label>
  );
}
