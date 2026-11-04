"use client";

import type { ReactNode } from "react";
import { EditorContent, useEditor, type Content, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Code, Heading2, Italic, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      // Keeps focus in the editor, otherwise the first letters typed after clicking get lost.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors hover:bg-background disabled:opacity-40 [&_svg]:size-4",
        active && "bg-primary text-primary-foreground hover:bg-primary",
      )}
    >
      {children}
    </button>
  );
}

export function NoteEditor({
  content,
  status,
  onChange,
}: {
  content: Content;
  status: ReactNode;
  onChange?: (content: JSONContent) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { "aria-label": "Note content" },
    },
    onUpdate: ({ editor: updated }) => onChange?.(updated.getJSON()),
  });

  return (
    <>
      <div
        role="toolbar"
        aria-label="Formatting"
        className="sticky top-14 z-10 mb-5 flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-1 lg:top-2"
      >
        <ToolbarButton label="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Heading"
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Bulleted list" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
          <Quote aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Code block" active={editor?.isActive("codeBlock")} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
          <Code aria-hidden />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton label="Undo" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 aria-hidden />
        </ToolbarButton>
        <span className="ml-auto px-2 text-xs text-muted-foreground">{status}</span>
      </div>
      <EditorContent editor={editor} className="note-content" />
    </>
  );
}
