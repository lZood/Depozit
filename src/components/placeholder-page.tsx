import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function PlaceholderPage({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="mt-4">Esta página está en construcción.</p>
      </div>
    </div>
  );
}
