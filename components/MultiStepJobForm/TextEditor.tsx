"use client";

import dynamic from "next/dynamic";
const ReactQuill = dynamic(async () => {
  const { default: Editor } = await import("react-quill-new");
  return function QuillWithRef({ forwardedRef, ...props }: Quill.ReactQuillProps & { forwardedRef: Ref<Quill> }) {
    return <Editor ref={forwardedRef} {...props} />;
  };
}, { ssr: false });

import { useMemo, useRef, type Ref } from "react";
import type Quill from "react-quill-new";
import { getJobDescriptionText } from "@/lib/job-description-policy";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  maxLength?: number;
}

// const ReactQuill = dynamic(() => import("react-quill"), {
//   ssr: false,
//   loading: () => (
//     <div className="min-h-[200px] bg-gray-100 animate-pulse rounded-md" />
//   ),
// });

import "react-quill/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

const TextEditor = ({ value, onChange, id, maxLength = 1400 }: QuillEditorProps) => {
  const editorRef = useRef<Quill>(null);
  const count = getJobDescriptionText(value || "").length;
  const formats = useMemo(
    () => [
      "header",
      "bold",
      "align",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "color",
      "background",
      "link",
      "image",
    ],
    []
  );

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        forwardedRef={editorRef}
        placeholder="Job Description"
        id={id}
        value={value}
        onChange={(content, _delta, source) => {
          const cleaned = content === "<p><br></p>" ? "" : content;
          const nextCount = getJobDescriptionText(cleaned).length;
          if (source === "user" && nextCount > maxLength && nextCount >= count) {
            const editor = editorRef.current?.getEditor();
            if (editor) {
              const selection = editor.getSelection();
              editor.setContents(editor.clipboard.convert({ html: value || "" }), "silent");
              if (selection) editor.setSelection(Math.min(selection.index, editor.getLength() - 1), 0, "silent");
            }
            return;
          }
          onChange(cleaned);
        }}
        modules={modules}
        formats={formats}
        theme="snow"
      />
      <p className={`mt-2 text-sm ${count > maxLength ? "text-red-600" : "text-gray-500"}`} aria-live="polite">
        {count}/{maxLength} characters
      </p>

      <style jsx global>{`
        .quill-editor-wrapper .ql-toolbar {
          border-color: #e2e8f0;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          background: #f8fafc;
        }

        /* Cap overall editor area and allow inner content to scroll */
        .quill-editor-wrapper .ql-container {
          border-color: #e2e8f0;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          min-height: 200px;
          max-height: 50vh; /* ⬅️ cap the height */
          font-size: 1rem;

          display: flex; /* make editor area flex so child can scroll */
          flex-direction: column;
        }

        .quill-editor-wrapper .ql-editor {
          min-height: 200px;
          flex: 1 1 auto; /* fill remaining space */
          overflow-y: auto; /* scroll when content is long */
          padding-bottom: 2.5rem; /* cushion so caret isn’t hidden at bottom */
        }
      `}</style>
    </div>
  );
};

export default TextEditor;
