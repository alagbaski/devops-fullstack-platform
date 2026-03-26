export default function AuthCard({ className = "", children }) {
  return (
    <section
      className={`rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-auth backdrop-blur xl:p-10 ${className}`.trim()}
    >
      {children}
    </section>
  );
}
