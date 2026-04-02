export default function AuthCard({ className = "", children }) {
  return (
    <section
      className={`w-full max-w-md space-y-5 rounded-2xl border border-white/80 bg-white/90 p-8 shadow-xl ring-1 ring-slate-100/80 backdrop-blur-sm ${className}`.trim()}
    >
      {children}
    </section>
  );
}
