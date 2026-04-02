export default function AuthField({ label, id, ...props }) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <input
        id={id}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      />
    </label>
  );
}
