'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Quote, Code, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TextEditor = ({ value, onChange }: TextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
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
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert min-h-[300px] max-w-none p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
      },
    },
    immediatelyRender: false, // Added line
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className="p-2 h-auto"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className="p-2 h-auto"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="p-2 h-auto"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="p-2 h-auto"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="p-2 h-auto"
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="p-2 h-auto"
          variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 h-auto"
          variant="ghost"
          size="sm"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default TextEditor;
