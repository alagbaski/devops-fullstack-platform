export default function AuthButton({ children, variant = "primary", className = "", ...props }) {
  const classes = [
    "inline-flex min-h-14 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold transition duration-200 disabled:cursor-wait disabled:opacity-70",
    variant === "secondary"
      ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      : "bg-gradient-to-r from-sky-500 via-sky-400 to-slate-500 text-white shadow-lg shadow-sky-200/50 hover:brightness-[1.02]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
