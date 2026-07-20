import React from "react";
import { Search, Filter, RefreshCw, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// ponytail: layout toolbar for list filtering, local query searching, and counts/refresh
export default function HistoryToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onRefresh,
  isRefreshing,
  totalEventsCount,
}) {
  const categories = [
    { id: "all", label: "All Activities" },
    { id: "nodes", label: "Nodes Only" },
    { id: "tasks", label: "Tasks Only" },
    { id: "permissions", label: "Permissions" },
    { id: "locks", label: "Locks & Unlocks" },
    { id: "deletes", label: "Deletes Only" },
  ];

  const getActiveCategoryLabel = () => {
    const cat = categories.find((c) => c.id === selectedCategory);
    return cat ? cat.label : "Filter";
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-xl shadow-xs">
      {/* Left Side: Local Search input (username, title, event type) */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2 h-4 w-4 text-[color:var(--text-secondary)]" />
        <Input
          type="text"
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-8 h-8 bg-[color:var(--bg-primary)] border-[color:var(--border)] text-sm rounded-lg w-full focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Right Side: Filters, Refresh, Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Event Count Badge */}
        <div className="flex items-center gap-1.5 bg-[color:var(--bg-primary)] border border-[color:var(--border)] px-2.5 py-1 rounded-lg text-xs font-medium">
          <span className="text-[color:var(--text-secondary)]">Events:</span>
          <span className="text-[color:var(--accent)] bg-[color:var(--accent)]/10 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {totalEventsCount}
          </span>
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 cursor-pointer border-[color:var(--border)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-primary)] text-xs h-8"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{getActiveCategoryLabel()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {categories.map((cat) => (
              <DropdownMenuItem
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`cursor-pointer text-xs ${
                  selectedCategory === cat.id ? "text-[color:var(--accent)] font-semibold" : ""
                }`}
              >
                {cat.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-1.5 cursor-pointer border-[color:var(--border)] hover:bg-[color:var(--bg-primary)] disabled:opacity-50 text-xs h-8"
          title="Refresh logs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
}
