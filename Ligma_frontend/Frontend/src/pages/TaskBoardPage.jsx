import React from "react";

export default function TaskBoardPage() {
  return (
    <div className="w-full h-full p-8 bg-[color:var(--bg-primary)] overflow-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Task Board</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">Action items automatically detected by AI</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg p-4 h-[calc(100vh-280px)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm">To Do</h3>
            <span className="text-xs bg-[color:var(--bg-primary)] border border-[color:var(--border)] px-2 py-0.5 rounded-full font-semibold">0</span>
          </div>
          <div className="flex-1 border-2 border-dashed border-[color:var(--border)] rounded-md flex items-center justify-center text-xs text-[color:var(--text-secondary)]">
            No action items detected yet.
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg p-4 h-[calc(100vh-280px)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm">In Progress</h3>
            <span className="text-xs bg-[color:var(--bg-primary)] border border-[color:var(--border)] px-2 py-0.5 rounded-full font-semibold">0</span>
          </div>
          <div className="flex-1 border-2 border-dashed border-[color:var(--border)] rounded-md flex items-center justify-center text-xs text-[color:var(--text-secondary)]">
            No tasks in progress.
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg p-4 h-[calc(100vh-280px)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm">Done</h3>
            <span className="text-xs bg-[color:var(--bg-primary)] border border-[color:var(--border)] px-2 py-0.5 rounded-full font-semibold">0</span>
          </div>
          <div className="flex-1 border-2 border-dashed border-[color:var(--border)] rounded-md flex items-center justify-center text-xs text-[color:var(--text-secondary)]">
            No completed tasks.
          </div>
        </div>
      </div>
    </div>
  );
}
