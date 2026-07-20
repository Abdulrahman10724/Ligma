import React from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "../ui/button";

// ponytail: centered card for handling API failures with retry action
export default function HistoryErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[color:var(--bg-surface)] border border-[color:var(--danger)]/30 rounded-2xl shadow-sm">
      <div className="flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full mb-4">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-bold text-[color:var(--text-primary)] mb-1">Failed to load history</h3>
      <p className="text-sm text-[color:var(--text-secondary)] mb-6 max-w-sm">
        {message || "An error occurred while fetching the workspace activities. Please try again."}
      </p>
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="gap-2 cursor-pointer border-[color:var(--border)] hover:bg-[color:var(--bg-primary)]"
      >
        <RotateCw className="w-3.5 h-3.5" />
        Retry Loading
      </Button>
    </div>
  );
}
