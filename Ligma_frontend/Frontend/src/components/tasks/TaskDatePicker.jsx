import { CalendarIcon, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export function TaskDatePicker({ value, onChange, disabled }) {
  const parsed = value ? new Date(value) : null;
  const valid  = parsed && isValid(parsed);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="flex items-center flex-shrink-0">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 h-7 px-2 rounded text-xs transition-colors outline-none",
              "hover:bg-[color:var(--bg-primary)] cursor-pointer",
              disabled && "cursor-default opacity-60",
              valid
                ? "text-[color:var(--text-primary)]"
                : "text-[color:var(--text-secondary)]"
            )}
            title="Set due date"
          >
            {valid ? (
              <span>{format(parsed, "M/d/yy")}</span>
            ) : (
              <CalendarIcon className="w-3.5 h-3.5 text-[color:var(--text-secondary)]" />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={6}
          className={cn(
            "!w-auto !p-3 task-date-picker",
            "bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-xl shadow-2xl"
          )}
        >
          <DayPicker
            mode="single"
            selected={valid ? parsed : undefined}
            onSelect={(date) => {
              onChange(date ? date.toISOString() : null);
            }}
            disabled={{ before: today }}
            showOutsideDays
          />
        </PopoverContent>
      </Popover>

      {/* Clear button — outside the popover trigger */}
      {valid && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(null);
          }}
          className="ml-0.5 p-0.5 rounded hover:bg-[color:var(--bg-primary)] text-[color:var(--text-secondary)] hover:text-[color:var(--danger)] transition-colors"
          title="Clear date"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default TaskDatePicker;
