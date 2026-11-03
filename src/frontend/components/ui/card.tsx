import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return (
    <section
      className={`flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted">{description}</p>}
    </header>
  );
}
