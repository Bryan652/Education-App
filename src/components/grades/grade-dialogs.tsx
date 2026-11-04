"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  createCategory,
  createGradeItem,
  deleteCategory,
  deleteGradeItem,
  updateCategory,
  updateGradeItem,
} from "@/actions/grades";
import { ConfirmDeleteButton } from "@/components/layout/confirm-delete-button";
import { FormDialog } from "@/components/layout/form-dialog";
import { fieldA11y, FormField, NativeSelect } from "@/components/layout/form-field";
import type { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GradeCategory, GradeItem } from "@/lib/grades/compute";

export function CategoryFormDialog({
  subjectId,
  category,
  triggerProps,
  trigger,
}: {
  subjectId: string;
  category?: GradeCategory;
  triggerProps?: ComponentProps<typeof Button>;
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title={category ? "Edit category" : "Add a category"}
      description="A weighted group of scores, such as Quizzes. Your syllabus usually lists these."
      submitLabel={category ? "Save changes" : "Add category"}
      action={(formData) => (category ? updateCategory(category.id, formData) : createCategory(subjectId, formData))}
      triggerProps={triggerProps}
      trigger={trigger}
    >
      {(errors) => (
        <>
          <FormField id="category-name" label="Name" errors={errors.name}>
            <Input
              id="category-name"
              name="name"
              defaultValue={category?.name}
              maxLength={100}
              required
              autoFocus
              placeholder="Quizzes"
              className="h-10"
              {...fieldA11y("category-name", errors.name)}
            />
          </FormField>
          <FormField id="category-weight" label="Weight (%)" errors={errors.weight}>
            <Input
              id="category-weight"
              name="weight"
              type="number"
              min="0.01"
              max="100"
              step="any"
              inputMode="decimal"
              defaultValue={category?.weight}
              required
              placeholder="30"
              className="h-10"
              {...fieldA11y("category-weight", errors.weight)}
            />
          </FormField>
        </>
      )}
    </FormDialog>
  );
}

export function GradeItemFormDialog({
  categories,
  categoryId,
  item,
  triggerProps,
  trigger,
}: {
  categories: Pick<GradeCategory, "id" | "name">[];
  categoryId?: string;
  item?: GradeItem;
  triggerProps?: ComponentProps<typeof Button>;
  trigger: ReactNode;
}) {
  return (
    <FormDialog
      title={item ? "Edit score" : "Add a score"}
      description="Leave the score blank until it's graded. It won't count toward your grade until then."
      submitLabel={item ? "Save changes" : "Add score"}
      action={(formData) => (item ? updateGradeItem(item.id, formData) : createGradeItem(formData))}
      triggerProps={triggerProps}
      trigger={trigger}
    >
      {(errors) => (
        <>
          <FormField id="item-name" label="Name" errors={errors.name}>
            <Input
              id="item-name"
              name="name"
              defaultValue={item?.name}
              maxLength={100}
              required
              autoFocus
              placeholder="Quiz 1"
              className="h-10"
              {...fieldA11y("item-name", errors.name)}
            />
          </FormField>
          <FormField id="item-category" label="Category" errors={errors.category_id}>
            <NativeSelect
              id="item-category"
              name="category_id"
              defaultValue={categoryId ?? categories[0]?.id}
              {...fieldA11y("item-category", errors.category_id)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField id="item-score" label="Score" optional errors={errors.score}>
              <Input
                id="item-score"
                name="score"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                defaultValue={item?.score ?? undefined}
                placeholder="18"
                className="h-10"
                {...fieldA11y("item-score", errors.score)}
              />
            </FormField>
            <FormField id="item-max" label="Out of" errors={errors.max_score}>
              <Input
                id="item-max"
                name="max_score"
                type="number"
                min="0.01"
                step="any"
                inputMode="decimal"
                defaultValue={item?.maxScore}
                required
                placeholder="20"
                className="h-10"
                {...fieldA11y("item-max", errors.max_score)}
              />
            </FormField>
          </div>
          <FormField id="item-date" label="Graded on" optional errors={errors.graded_on}>
            <Input
              id="item-date"
              name="graded_on"
              type="date"
              defaultValue={item?.gradedOn}
              className="h-10"
              {...fieldA11y("item-date", errors.graded_on)}
            />
          </FormField>
        </>
      )}
    </FormDialog>
  );
}

export function DeleteCategoryButton({ category }: { category: GradeCategory }) {
  return (
    <ConfirmDeleteButton
      label={`Delete ${category.name}`}
      title={`Delete ${category.name}?`}
      description={
        category.items.length > 0
          ? `This also deletes its ${category.items.length === 1 ? "score" : `${category.items.length} scores`}, and can't be undone.`
          : "This can't be undone."
      }
      action={() => deleteCategory(category.id)}
    />
  );
}

export function DeleteGradeItemButton({ item }: { item: GradeItem }) {
  return (
    <ConfirmDeleteButton
      label={`Delete ${item.name}`}
      title={`Delete ${item.name}?`}
      description="This can't be undone."
      action={() => deleteGradeItem(item.id)}
    />
  );
}
