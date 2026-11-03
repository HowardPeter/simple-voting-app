import { Card, CardHeader } from "@/components/ui/card";
import type { Topic } from "@/lib/api";

export function TopicList({ topics, className = "" }: { topics: Topic[]; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title="Topics" />
      {topics.length === 0 ? (
        <p className="text-sm text-muted">No topics yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {topics.map((topic) => (
            <TopicItem key={topic.id} topic={topic} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function TopicItem({ topic }: { topic: Topic }) {
  const total = topic.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium break-words">{topic.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            topic.isOpen ? "bg-primary/10 text-primary" : "bg-border text-muted"
          }`}
        >
          {topic.isOpen ? "Open" : "Closed"}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {topic.options.map((option) => {
          const mine = option.id === topic.myOptionId;
          const percent = total === 0 ? 0 : Math.round((option.votes / total) * 100);
          return (
            <li key={option.id} className="flex flex-col gap-1 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className={`break-words ${mine ? "font-medium text-primary" : ""}`}>
                  {option.label}
                  {mine && <span className="text-muted font-normal"> · your vote</span>}
                </span>
                <span className="shrink-0 text-muted tabular-nums">
                  {option.votes} {option.votes === 1 ? "vote" : "votes"}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border/60" aria-hidden>
                <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </li>
  );
}
