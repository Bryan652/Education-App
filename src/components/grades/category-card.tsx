import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { categoryPercent, type GradeCategory } from "@/lib/grades/compute";
import { formatDate } from "@/lib/utils";

export function CategoryCard({ category }: { category: GradeCategory }) {
  const percent = categoryPercent(category);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <CardTitle className="text-lg">{category.name}</CardTitle>
        <p className="text-sm text-muted-foreground tabular-nums">
          {category.weight}% of grade · {percent === null ? "Not graded yet" : `${percent.toFixed(1)}% average`}
        </p>
      </CardHeader>
      <CardContent>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="hidden sm:table-cell">Graded on</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Percent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {category.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {item.gradedOn ? formatDate(item.gradedOn, { month: "short", day: "numeric" }) : "–"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.score === null ? `– / ${item.maxScore}` : `${item.score} / ${item.maxScore}`}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.score === null ? "–" : `${((item.score / item.maxScore) * 100).toFixed(0)}%`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
