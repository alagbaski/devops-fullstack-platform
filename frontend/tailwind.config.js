/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        auth: "0 24px 80px rgba(15, 23, 42, 0.10)",
        support: "0 18px 50px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        ink: "#0f172a",
        mist: "#64748b",
        panel: "rgba(255,255,255,0.82)",
        line: "rgba(148,163,184,0.22)",
      },
      backgroundImage: {
        "auth-gradient":
          "radial-gradient(circle at top left, rgba(191, 219, 254, 0.55), transparent 30%), radial-gradient(circle at top right, rgba(226, 232, 240, 0.95), transparent 34%), linear-gradient(160deg, #f8fbff 0%, #eef4fb 52%, #e8eff7 100%)",
      },
    },
  },
  plugins: [],
};
