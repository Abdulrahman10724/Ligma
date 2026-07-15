import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function InlineTitleEditor({ value, onChange, onSave, onCancel }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); onSave(inputRef.current.value.trim()); }
    if (e.key === "Escape") { e.preventDefault(); onCancel(); }
  };

  const handleBlur = () => {
    const val = inputRef.current?.value?.trim();
    if (val) onSave(val);
    else onCancel();
  };

  return (
    <input
      ref={inputRef}
      defaultValue={value}
      onKeyDown={handleKey}
      onBlur={handleBlur}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        "flex-1 min-w-0 bg-transparent outline-none border-b border-[color:var(--accent)]",
        "text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)]",
        "py-0.5 px-0"
      )}
      placeholder="Task name..."
    />
  );
}

export default InlineTitleEditor;
