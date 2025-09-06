"use client"

import type React from "react"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Bold, Italic, List, ListOrdered, Quote, Code, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const TextEditor = ({ value, onChange, placeholder, className }: TextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3], // Enable h1, h2, h3
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert min-h-[200px] max-w-none p-4 border-0 focus:outline-none ${className || ""}`,
        "data-placeholder": placeholder || "Start typing...",
      },
    },
    immediatelyRender: false,
  })

  // Synchronize editor content with value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) {
    return null
  }

  // Prevent form submission on toolbar button clicks
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-3 border-b bg-gray-50/50">
        {/* Bold */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
        >
          <Bold className="h-4 w-4" />
        </Button>

        {/* Italic */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="h-8 px-2 text-xs font-semibold"
          variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
          size="sm"
        >
          H1
        </Button>
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="h-8 px-2 text-xs font-semibold"
          variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
          size="sm"
        >
          H2
        </Button>
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="h-8 px-2 text-xs font-semibold"
          variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
          size="sm"
        >
          H3
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Blockquote */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="h-8 w-8 p-0"
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          size="sm"
        >
          <Quote className="h-4 w-4" />
        </Button>

        {/* Code Block */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="h-8 w-8 p-0"
          variant={editor.isActive("codeBlock") ? "default" : "ghost"}
          size="sm"
        >
          <Code className="h-4 w-4" />
        </Button>

        {/* Horizontal Rule */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0"
          variant="ghost"
          size="sm"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="min-h-[200px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default TextEditor
