export default function AuthButton({ children, variant = "primary", className = "", ...props }) {
  const classes = [
    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-md transition duration-200 disabled:cursor-wait disabled:opacity-70",
    variant === "secondary"
      ? "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:-translate-y-0.5 hover:opacity-95 hover:shadow-lg",
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
