import React, { useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, className }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);

  // Sync logic: Only update innerHTML from prop if it differs significantly and we aren't actively typing
  // This prevents the cursor from jumping to the start on every keystroke/render
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        // If the element is focused, we need to be careful not to kill the selection
        // However, if the value changed externally (e.g. Analysis result), we MUST update it.
        // We use a simple heuristic: if the difference is purely DOM structure normalization, ignore.
        // But for this use case, if value changes, we usually update.
        // The key to avoiding jumps is that onChange updates state, which updates prop 'value'.
        // If editorRef.current.innerHTML === value (which it should be after typing), we do nothing.
        
        // Only force update if the mismatch is real (external update)
         if (document.activeElement !== editorRef.current) {
             editorRef.current.innerHTML = value;
         } else {
             // If we are focused, only update if the lengths are drastically different 
             // (meaning the content was changed by something other than the user's keystroke, e.g., AI replacement)
             // or if we really need to sync.
             // For simple typing, contentEditable handles the view. React just needs the state.
             const currentHTML = editorRef.current.innerHTML;
             if (currentHTML !== value) {
                 // Check if the difference is just a trailing br or normal browser formatting
                 // If it's a true external change, we apply it and try to save cursor (hard to do perfectly in vanilla React)
                 // For now, we prioritize NOT updating DOM if focused to keep cursor safe.
                 // If user clicks "Analysis", focus is lost, so the block above runs.
             }
         }
      }
    }
  }, [value]);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus(); // Ensure focus remains
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isTypingRef.current = true;
    onChange(e.currentTarget.innerHTML);
    isTypingRef.current = false;
  };

  const ToolbarButton = ({ command, icon, label }: { command: string, icon: React.ReactNode, label: string }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault(); // Prevent losing focus on editor
        execCommand(command);
      }}
      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className={`flex flex-col border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50" onMouseDown={(e) => e.preventDefault()}>
        <ToolbarButton 
          command="bold" 
          label="Bold"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h4.75a5.5 5.5 0 010 11H6.75A5.5 5.5 0 0112.25 9.25H6.75v-5.5zM6.75 14.75h6.25a5.5 5.5 0 000-11H6.75v11z" /></svg>} 
        />
        <ToolbarButton 
          command="italic" 
          label="Italic"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25l7.5 7.5-7.5 7.5m9-15l-7.5 7.5 7.5 7.5" transform="rotate(15 12 12) scale(0.8)" /></svg>} 
        />
        <ToolbarButton 
          command="underline" 
          label="Underline"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3M6 21h12" /></svg>} 
        />
        <div className="w-px h-5 bg-slate-300 mx-1"></div>
        <ToolbarButton 
          command="insertUnorderedList" 
          label="Bullet List"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>} 
        />
        <ToolbarButton 
          command="insertOrderedList" 
          label="Numbered List"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>} 
        />
      </div>

      {/* Editor Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning={true}
        // Initialize with value, but do not update via attribute to avoid cursor reset
        dangerouslySetInnerHTML={{ __html: value }} 
        className="flex-1 p-4 min-h-[12rem] outline-none text-slate-900 bg-white leading-relaxed text-sm overflow-y-auto"
      />
    </div>
  );
};