"use client";

import { useEffect, useRef, useState } from "react";
import "quill/dist/quill.snow.css";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const TextEditor = ({
  value,
  onChange,
  placeholder,
  className,
}: TextEditorProps) => {
  const quillRef = useRef<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && toolbarRef.current && !quillRef.current) {
      const loadQuill = async () => {
        const Quill = (await import("quill")).default;

        quillRef.current = new Quill(editorRef.current!, {
          theme: "snow",
          placeholder: placeholder || "Start typing...",
          modules: {
            toolbar: toolbarRef.current,
          },
        });

        // Set initial value if available
        if (value) {
          quillRef.current.root.innerHTML = value;
        }

        // Listen for user input
        quillRef.current.on("text-change", () => {
          const html = quillRef.current.root.innerHTML;
          onChange(html === "<p><br></p>" ? "" : html);
        });

        setInitialized(true);
      };

      loadQuill();
    }
  }, []);

  // Sync external value updates (like from form reset or API load)
  useEffect(() => {
    if (initialized && quillRef.current) {
      const editorHTML = quillRef.current.root.innerHTML.trim();
      const newValue = (value || "").trim();

      if (editorHTML !== newValue) {
        quillRef.current.root.innerHTML = newValue;
      }
    }
  }, [value, initialized]);

  return (
    <div className={`border rounded-lg bg-white ${className || ""}`}>
      {/* Toolbar */}
      <div ref={toolbarRef} className="quill-toolbar">
        <div className="ql-formats">
          <select className="ql-header" defaultValue="">
            <option value="1"></option>
            <option value="2"></option>
            <option value=""></option>
          </select>
        </div>
        <div className="ql-formats">
          <button className="ql-bold"></button>
          <button className="ql-italic"></button>
          <button className="ql-underline"></button>
        </div>
        <div className="ql-formats">
          <button className="ql-list" value="ordered"></button>
          <button className="ql-list" value="bullet"></button>
        </div>
        <div className="ql-formats">
          <button className="ql-blockquote"></button>
          <button className="ql-code-block"></button>
        </div>
        <div className="ql-formats">
          <button className="ql-link"></button>
          <button className="ql-clean"></button>
        </div>
      </div>

      {/* Editor */}
      <div ref={editorRef} style={{ minHeight: "200px" }} />
    </div>
  );
};

export default TextEditor;
