import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SuggestionCardSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-20" />
      </CardFooter>
    </Card>
  );
}
