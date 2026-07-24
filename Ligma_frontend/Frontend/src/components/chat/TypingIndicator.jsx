export default function TypingIndicator({ users = [] }) {
  if (!users.length) return null;

  const names = users.map((user) => user.name).filter(Boolean);
  const label =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing...`
        : `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing...`;

  return (
    <div className="flex items-center gap-3 px-6 py-3 text-sm text-[color:var(--text-secondary)]">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-[color:var(--accent)] [animation-delay:-0.25s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[color:var(--accent)] [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[color:var(--accent)]" />
      </div>
      <span>{label}</span>
    </div>
  );
}
