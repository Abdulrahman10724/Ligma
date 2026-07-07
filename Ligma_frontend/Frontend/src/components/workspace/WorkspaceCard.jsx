import React from "react";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../ui/card";

export default function WorkspaceCard({ workspace, onClick }) {
  return (
    <button type="button" onClick={onClick} className="text-left w-full">
      <Card className="h-full border border-[color:var(--border)] bg-[color:var(--bg-surface)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:shadow-md">
        <CardHeader className="pb-0">
          <CardTitle>{workspace.title}</CardTitle>
          <CardDescription>{workspace.description || "No description yet"}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4 text-sm text-[color:var(--text-secondary)]">
          <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> Owner</span>
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {new Date(workspace.createdAt).toLocaleDateString()}</span>
        </CardContent>
        <CardFooter className="justify-between text-xs text-[color:var(--text-secondary)]">
          <span>Open workspace</span>
          <ArrowRight className="h-4 w-4 text-[color:var(--accent)]" />
        </CardFooter>
      </Card>
    </button>
  );
}