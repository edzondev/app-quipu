import { Card, CardContent, CardHeader } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";

const stagger = (i: number) => ({ animationDelay: `${i * 55}ms` });

export default function ProfileLoading() {
  return (
    <output
      className="block max-w-2xl space-y-6"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Cargando perfil</span>

      <div className="flex items-center gap-4">
        <Skeleton
          className="h-16 w-16 shrink-0 rounded-full"
          style={stagger(0)}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton
            className="h-8 w-44 max-w-full rounded-md"
            style={stagger(1)}
          />
          <Skeleton
            className="h-4 w-56 max-w-full rounded-md"
            style={stagger(2)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-0 pb-4">
          <Skeleton className="h-6 w-52 max-w-full rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          {["name", "country", "currency"].map((key, i) => (
            <div key={key} className="space-y-2">
              <Skeleton
                className="h-4 w-28 rounded-md"
                style={stagger(3 + i)}
              />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-4">
          <Skeleton className="h-6 w-36 max-w-full rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-44 rounded-md" />
            <Skeleton className="h-10 w-full rounded-md pl-10" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </CardContent>
      </Card>

      <Skeleton className="h-11 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </output>
  );
}
