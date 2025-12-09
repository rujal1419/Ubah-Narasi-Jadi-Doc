import React, { useRef, useState } from 'react';
import { FileData } from '../types';

interface FileUploadProps {
  onFileSelect: (fileData: FileData) => void;
  selectedFile: FileData | null;
  onClear: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    // Basic validation to ensure it's an image
    if (!file.type.startsWith('image/')) {
        alert("Mohon upload file gambar (JPG, PNG, JPEG)");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Get raw base64 without prefix for API
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      
      onFileSelect({
        file,
        previewUrl: result, // Full data URL for img src
        base64: base64,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Model Referensi Susunan
      </label>
      
      {!selectedFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${
            isDragging 
              ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
              : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div className={`flex flex-col items-center justify-center ${isDragging ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="font-medium">
              {isDragging ? 'Lepaskan gambar di sini' : 'Klik atau Drag & Drop gambar referensi'}
            </p>
            <p className={`text-xs mt-1 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`}>JPG, PNG, JPEG</p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
          <img 
            src={selectedFile.previewUrl} 
            alt="Reference" 
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                }}
                className="bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
             >
               Hapus Gambar
             </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {selectedFile.file.name}
          </div>
        </div>
      )}
    </div>
  );
};