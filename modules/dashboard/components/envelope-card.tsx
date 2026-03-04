import { Card, CardContent } from "@/core/components/ui/card";

const colorMap: Record<string, string> = {
  needs: "bg-envelope-needs",
  wants: "bg-envelope-wants",
  savings: "bg-envelope-savings",
  juntos: "bg-envelope-juntos",
};

export default function EnvelopeCard({
  envelope,
  index,
}: {
  envelope: any;
  index: number;
}) {
  console.log(envelope);
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl"></span>
              <div>
                <span className="font-semibold">hola</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
