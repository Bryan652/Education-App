"use client";

import type { ComponentProps } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Stands in for actions that need the backend, so no button in the preview is a dead end.
export function PreviewButton({
  message = "This is a preview, so nothing is saved yet.",
  ...props
}: ComponentProps<typeof Button> & { message?: string }) {
  return <Button {...props} onClick={() => toast(message)} />;
}
