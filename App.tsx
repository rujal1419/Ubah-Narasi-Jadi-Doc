import React, { useState, useEffect } from 'react';
import { Button } from './components/Button';
import { FileUpload } from './components/FileUpload';
import { RichTextEditor } from './components/RichTextEditor';
import { AppState, FileData, PaperSize } from './types';
import { generateDocumentStructure, analyzeNarrative } from './services/geminiService';
import { downloadAsDoc, downloadAsPdf } from './utils/fileHelpers';

const App: React.FC = () => {
  const [narrativeText, setNarrativeText] = useState<string>('');
  const [referenceFile, setReferenceFile] = useState<FileData | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // New State for Paper Size
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  
  // Full Screen State
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Close full screen on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleGenerate = async () => {
    // Check text length (stripping tags)
    const textLength = narrativeText.replace(/<[^>]*>?/gm, '').trim().length;
    
    if (textLength === 0) {
      setErrorMessage("Mohon isi narasi teks terlebih dahulu.");
      return;
    }
    if (!referenceFile) {
      setErrorMessage("Mohon upload gambar model referensi.");
      return;
    }

    setAppState(AppState.GENERATING);
    setErrorMessage(null);

    try {
      const result = await generateDocumentStructure(
        narrativeText,
        referenceFile.base64,
        referenceFile.mimeType
      );
      setGeneratedHtml(result.htmlContent);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      setAppState(AppState.ERROR);
      setErrorMessage("Terjadi kesalahan saat memproses. Pastikan API Key valid atau coba lagi nanti.");
    }
  };

  const handleAnalysis = async () => {
    const textLength = narrativeText.replace(/<[^>]*>?/gm, '').trim().length;
    if (textLength === 0) {
      setErrorMessage("Mohon isi narasi teks untuk dianalisa.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setErrorMessage(null);

    try {
      const result = await analyzeNarrative(narrativeText);
      setAnalysisResult(result);
    } catch (error) {
      setErrorMessage("Gagal menganalisa teks.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setGeneratedHtml(null);
    setErrorMessage(null);
    setAnalysisResult(null);
  };

  // Helper to get dimension style based on paper size
  const getPaperDimensions = () => {
    switch(paperSize) {
      case 'A4': return { width: '210mm', minHeight: '297mm' };
      case 'Letter': return { width: '216mm', minHeight: '279mm' };
      case 'Legal': return { width: '216mm', minHeight: '356mm' };
      case 'A3': return { width: '297mm', minHeight: '420mm' };
      case 'A5': return { width: '148mm', minHeight: '210mm' };
      default: return { width: '210mm', minHeight: '297mm' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">DocuMimic AI</span>
            </div>
            <div className="text-sm text-slate-500 hidden sm:block">
              Ubah Narasi Menjadi Dokumen Terstruktur
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
                Input Data
              </h2>
              
              <div className="space-y-6">
                <FileUpload 
                  selectedFile={referenceFile}
                  onFileSelect={setReferenceFile}
                  onClear={() => setReferenceFile(null)}
                />

                <div className="relative">
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-sm font-semibold text-slate-700">
                      Narasi / Teks
                    </label>
                    <button 
                      onClick={handleAnalysis}
                      disabled={isAnalyzing}
                      className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-md border border-purple-200 hover:bg-purple-100 font-medium flex items-center gap-1 transition-colors"
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Menganalisa...
                        </>
                      ) : (
                        <>
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                          </svg>
                          Analisa Kualitas Teks
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Replaced textarea with RichTextEditor */}
                  <RichTextEditor 
                    value={narrativeText} 
                    onChange={setNarrativeText}
                  />

                  <p className="text-xs text-slate-400 mt-2 text-right">
                    {narrativeText.replace(/<[^>]*>?/gm, '').length} karakter
                  </p>
                </div>

                {/* Analysis Result Box */}
                {analysisResult && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 animate-fadeIn">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-purple-900 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        Hasil Analisa AI
                      </h4>
                      <button 
                        onClick={() => setAnalysisResult(null)}
                        className="text-purple-400 hover:text-purple-600"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div 
                      className="text-sm text-purple-800 prose prose-sm prose-purple max-w-none" 
                      dangerouslySetInnerHTML={{ __html: analysisResult }}
                    />
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    {errorMessage}
                  </div>
                )}

                <Button 
                  onClick={handleGenerate} 
                  isLoading={appState === AppState.GENERATING}
                  className="w-full h-12 text-base shadow-blue-200"
                >
                  {appState === AppState.GENERATING ? 'Sedang Menyusun...' : 'Buat Dokumen'}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-100 rounded-xl p-6 text-sm text-slate-600">
              <h3 className="font-semibold text-slate-800 mb-2">Cara Penggunaan:</h3>
              <ul className="list-disc pl-4 space-y-1">
                <li>Upload gambar dokumen (surat, laporan, esai) yang susunannya ingin ditiru.</li>
                <li>Masukkan teks mentah ke editor. Gunakan <strong>Bold</strong> atau <em>Italic</em> untuk penekanan.</li>
                <li>Gunakan "Analisa Kualitas Teks" untuk mengecek tata bahasa.</li>
                <li>Klik "Buat Dokumen" untuk menyusun ulang layout.</li>
                <li>Unduh hasilnya dalam format DOC atau PDF.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Preview & Result */}
          <div className="lg:col-span-7">
             <div className="sticky top-24">
              <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
                  Lihat Hasil
                </h2>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Paper Size Selector */}
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2 py-1.5 shadow-sm">
                    <span className="text-xs font-medium text-slate-500 mr-2">Ukuran:</span>
                    <select 
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                      className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                      <option value="A3">A3</option>
                      <option value="A5">A5</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </div>

                  {generatedHtml && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => downloadAsDoc(generatedHtml!, 'dokumen-tersusun', paperSize)}
                        className="text-sm py-1.5 px-3"
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        }
                      >
                        DOC
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => downloadAsPdf('document-preview', 'dokumen-tersusun', paperSize)}
                        className="text-sm py-1.5 px-3"
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        }
                      >
                        PDF
                      </Button>
                      
                      {/* View Full Screen Button */}
                      <button 
                        onClick={() => setIsFullScreen(true)}
                        className="ml-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors border border-blue-100"
                        title="Lihat Layar Penuh"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                      </button>

                      <button 
                        onClick={reset}
                        className="ml-1 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Reset"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-200/50 rounded-2xl p-4 sm:p-8 border border-slate-200 min-h-[600px] flex justify-center items-start overflow-auto">
                {generatedHtml ? (
                  <div 
                    id="document-preview"
                    className="paper-preview text-slate-900 transition-all duration-300 ease-in-out"
                    style={{
                      ...getPaperDimensions(),
                      // Add padding for better reading on screen, though PDF generation might respect margin settings in html2pdf
                      padding: '2.54cm' 
                    }}
                    dangerouslySetInnerHTML={{ __html: generatedHtml }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 pt-32">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="font-medium text-lg">Pratinjau Dokumen</p>
                    <p className="text-sm max-w-xs text-center mt-2">
                      Hasil susunan dokumen akan muncul di sini setelah Anda mengklik tombol "Buat Dokumen".
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Full Screen Modal */}
      {isFullScreen && generatedHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-fadeIn">
          {/* Close Button & Toolbar overlay */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
             <button
               onClick={() => setIsFullScreen(false)}
               className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
               title="Tutup (Esc)"
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>

          {/* Scrollable Container */}
          <div className="w-full h-full overflow-auto flex justify-center py-8" onClick={() => setIsFullScreen(false)}>
             {/* Paper */}
             <div
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking paper
                className="bg-white shadow-2xl origin-top"
                style={{
                  ...getPaperDimensions(),
                  padding: '2.54cm',
                  marginBottom: '2rem'
                }}
                dangerouslySetInnerHTML={{ __html: generatedHtml }}
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;