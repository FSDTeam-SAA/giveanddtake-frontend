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
}

const TextEditor = ({ value, onChange }: TextEditorProps) => {
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
        class:
          "prose dark:prose-invert min-h-[300px] max-w-none p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
      },
    },
    immediatelyRender: false,
  })

  // Synchronize editor content with value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false }) // prevents emitting an update event
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
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        {/* Bold */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className="p-2 h-auto"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
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
          className="p-2 h-auto"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="sm"
        >
          <Italic className="h-4 w-4" />
        </Button>

        {/* Headings */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="p-2 h-auto"
          variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
          size="sm"
        >
          H1
        </Button>
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="p-2 h-auto"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="sm"
        >
          H2
        </Button>
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="p-2 h-auto"
          variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
          size="sm"
        >
          H3
        </Button>

        {/* Bullet List */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="p-2 h-auto"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="sm"
        >
          <List className="h-4 w-4" />
        </Button>

        {/* Ordered List */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="p-2 h-auto"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="sm"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {/* Blockquote */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="p-2 h-auto"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="sm"
        >
          <Quote className="h-4 w-4" />
        </Button>

        {/* Code Block */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="p-2 h-auto"
          variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
          size="sm"
        >
          <Code className="h-4 w-4" />
        </Button>

        {/* Horizontal Rule */}
        <Button
          type="button"
          onMouseDown={handleButtonClick}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 h-auto"
          variant="ghost"
          size="sm"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}

export default TextEditor
