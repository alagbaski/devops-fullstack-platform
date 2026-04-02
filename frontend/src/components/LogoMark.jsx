export default function LogoMark() {
  return (
    <div className="flex flex-col items-center space-y-5 text-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-2 rounded-full bg-blue-500/20 blur-2xl" />
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white via-blue-50 to-indigo-100 shadow-[0_22px_50px_rgba(37,99,235,0.18)] ring-1 ring-white/80" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_34px_rgba(15,23,42,0.28)]">
          <svg
            aria-hidden="true"
            viewBox="0 0 96 96"
            className="h-16 w-16 drop-shadow-[0_8px_18px_rgba(56,189,248,0.2)]"
          >
            <defs>
              <linearGradient id="opsdev-loop" x1="10%" y1="20%" x2="90%" y2="80%">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="45%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <path
              d="M24 31c8.5 0 13.6 6.8 18.8 14.3C48.2 53 53.1 60 61.7 60c6.1 0 10.8-4.1 10.8-10.3 0-6.5-5-10.7-11.2-10.7-5.1 0-8.9 2.6-12.7 7.2l-4.5-5.7C49 34 54.9 31 62.1 31 74 31 82 39 82 49.7 82 60.5 73.8 68 62.3 68c-12.3 0-18.7-8.3-23.8-15.7C34.1 46.3 30.7 39 24 39c-4.8 0-8 3-8 7.7 0 5 4 8.3 8.7 8.3 4.4 0 7.7-2.2 11.4-6.4l4.5 5.6C35.6 60.1 30 63 23 63 13.3 63 6 56.5 6 47c0-9.7 7.5-16 18-16Z"
              fill="url(#opsdev-loop)"
            />
            <circle cx="73" cy="28" r="4.5" fill="#f8fafc" fillOpacity="0.95" />
          </svg>
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-lg font-bold uppercase tracking-[0.45em] text-transparent sm:text-xl">
        OPSDEV
      </div>
    </div>
  );
}
