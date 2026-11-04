import { Pencil, Plus } from "lucide-react";
import {
  CategoryFormDialog,
  DeleteCategoryButton,
  DeleteGradeItemButton,
  GradeItemFormDialog,
} from "@/components/grades/grade-dialogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { categoryPercent, withBase, type GradeCategory } from "@/lib/grades/compute";
import { formatDate } from "@/lib/utils";

export function CategoryCard({
  category,
  allCategories,
  basePercent,
  editable,
}: {
  category: GradeCategory;
  allCategories: Pick<GradeCategory, "id" | "name">[];
  basePercent: number;
  editable: boolean;
}) {
  const percent = categoryPercent(category);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <CardTitle className="text-lg">{category.name}</CardTitle>
          <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
            {category.weight}% of grade ·{" "}
            {percent === null ? "Not graded yet" : `${withBase(percent, basePercent).toFixed(1)}% average`}
          </p>
        </div>
        {editable && (
          <div className="flex items-center gap-1">
            <GradeItemFormDialog
              categories={allCategories}
              categoryId={category.id}
              triggerProps={{ variant: "outline" }}
              trigger={
                <>
                  <Plus aria-hidden />
                  Add score
                </>
              }
            />
            <CategoryFormDialog
              subjectId={category.subjectId}
              category={category}
              triggerProps={{ variant: "ghost", size: "icon-lg", className: "", "aria-label": `Edit ${category.name}` }}
              trigger={<Pencil aria-hidden />}
            />
            <DeleteCategoryButton category={category} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {category.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scores in this category yet.</p>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="hidden sm:table-cell">Graded on</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Percent</TableHead>
                {editable && (
                  <TableHead className="w-20 sm:w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="truncate font-medium">{item.name}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {item.gradedOn ? formatDate(item.gradedOn, { month: "short", day: "numeric" }) : "–"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.score === null ? `– / ${item.maxScore}` : `${item.score} / ${item.maxScore}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.score === null
                      ? "–"
                      : `${withBase((item.score / item.maxScore) * 100, basePercent).toFixed(0)}%`}
                  </TableCell>
                  {editable && (
                    <TableCell className="p-0">
                      <div className="flex justify-end">
                        <GradeItemFormDialog
                          categories={allCategories}
                          categoryId={category.id}
                          item={item}
                          triggerProps={{ variant: "ghost", size: "icon-lg", className: "", "aria-label": `Edit ${item.name}` }}
                          trigger={<Pencil aria-hidden />}
                        />
                        <DeleteGradeItemButton item={item} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
