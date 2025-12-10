import React, { useLayoutEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, className }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // We use useLayoutEffect to update the DOM synchronously after render but before paint.
  // This prevents cursor jumping because we only update innerHTML if strictly necessary
  // (i.e., when the new value doesn't match the current DOM content).
  useLayoutEffect(() => {
    if (editorRef.current) {
      // Only update if content is actually different to avoid resetting cursor/selection
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const execCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    // We don't filter here; we pass the raw HTML up.
    // The parent updates the 'value' prop.
    // The useLayoutEffect above sees that 'value' === 'editorRef.current.innerHTML' and skips update.
    onChange(html);
  };

  const ToolbarButton = ({ command, icon, label }: { command: string, icon: React.ReactNode, label: string }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // Critical: Prevents focus loss from editor when clicking button
      onClick={() => execCommand(command)}
      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className={`flex flex-col border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
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
        className="flex-1 p-4 min-h-[12rem] outline-none text-slate-900 bg-white leading-relaxed text-sm overflow-y-auto"
      />
    </div>
  );
};