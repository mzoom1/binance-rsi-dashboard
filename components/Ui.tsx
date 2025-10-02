export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors duration-150 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${props.className ?? ''}`}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none transition-shadow duration-150 focus:ring-2 focus:ring-blue-500/30 ${props.className ?? ''}`}
    />
  );
}
