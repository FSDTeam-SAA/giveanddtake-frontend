"use client";

import { useEffect, useRef } from "react";
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
  // 1. Add a ref for the toolbar container
  const toolbarRef = useRef<HTMLDivElement>(null); 

  // Initialize Quill only once
  useEffect(() => {
    // 2. Check if both the editor and the toolbar refs are ready
    if (editorRef.current && toolbarRef.current && !quillRef.current) {
      const loadQuill = async () => {
        const Quill = (await import("quill")).default;

        quillRef.current = new Quill(editorRef.current!, {
          theme: "snow",
          placeholder: placeholder || "Start typing...",
          modules: {
            // 3. Point Quill to the custom toolbar container
            toolbar: toolbarRef.current, 
            // 4. Move your custom toolbar configuration into the container's structure
          },
        });

        // Set initial value
        if (value) {
          quillRef.current.root.innerHTML = value;
        }

        // Handle changes
        quillRef.current.on("text-change", () => {
          const content = quillRef.current.root.innerHTML;
          onChange(content === "<p><br></p>" ? "" : content);
        });
      };

      loadQuill();
    }
  }, []); // run once only

  // Update editor content when value changes externally
  useEffect(() => {
    // A check is added to prevent an infinite loop if Quill content is identical to `value`
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      // Use setContent if you want a clean history, but innerHTML is fine for a simple update
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  return (
    <div className={`border rounded-lg bg-white ${className || ""}`}>
      {/* 5. Create the toolbar container with the ref */}
      <div ref={toolbarRef} className="quill-toolbar"> 
        {/* You now need to define the toolbar's structure here, 
            which corresponds to your previous `modules.toolbar` array. 
            Quill will render the icons for these controls. */}
        <div className="ql-formats">
          <select className="ql-header" defaultValue=""></select>
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
        </div>
        <div className="ql-formats">
          <button className="ql-clean"></button>
        </div>
      </div>
      
      {/* The editor content area remains the same */}
      <div ref={editorRef} style={{ minHeight: "200px" }} />
    </div>
  );
};

export default TextEditor;