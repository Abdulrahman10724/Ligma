import "react";

export default function ChatPage() {
  return (
    <div className="w-full h-full flex bg-[color:var(--bg-primary)] overflow-hidden">
      {/* Channel list */}
      <div className="w-60 bg-[color:var(--bg-surface)] border-r border-[color:var(--border)] flex flex-col">
        <div className="p-4 border-b border-[color:var(--border)] font-bold text-sm">Channels</div>
        <div className="p-2 space-y-1 flex-1 overflow-y-auto">
          <button className="w-full text-left px-3 py-2 rounded text-sm font-semibold bg-[color:var(--bg-primary)] text-[color:var(--accent)]"># general</button>
          <button className="w-full text-left px-3 py-2 rounded text-sm font-medium text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-primary)]"># frontend-zone</button>
          <button className="w-full text-left px-3 py-2 rounded text-sm font-medium text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-primary)]"># backend-zone</button>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 flex flex-col justify-between bg-[color:var(--bg-primary)]">
        <div className="p-4 border-b border-[color:var(--border)] bg-[color:var(--bg-surface)] font-bold text-sm flex items-center gap-2">
          <span># general</span>
          <span className="text-xs text-[color:var(--text-secondary)] font-normal">Workspace discussion</span>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center text-sm text-[color:var(--text-secondary)]">
          Welcome to the chat! Messages will sync in real-time.
        </div>
        <div className="p-4 bg-[color:var(--bg-surface)] border-t border-[color:var(--border)]">
          <input 
            type="text" 
            placeholder="Message #general..." 
            className="w-full p-3 border border-[color:var(--border)] bg-[color:var(--bg-primary)] rounded-md focus:outline-none focus:border-[color:var(--accent)] text-sm"
            disabled
          />
        </div>
      </div>
    </div>
  );
}
