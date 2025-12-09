import { PaperSize } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const downloadAsDoc = (htmlContent: string, fileName: string, paperSize: PaperSize = 'A4') => {
  // Define dimensions based on paperSize
  let width = '21cm';
  let height = '29.7cm';

  switch (paperSize) {
    case 'Letter': width = '21.59cm'; height = '27.94cm'; break;
    case 'Legal': width = '21.59cm'; height = '35.56cm'; break;
    case 'A3': width = '29.7cm'; height = '42cm'; break;
    case 'A5': width = '14.8cm'; height = '21cm'; break;
    case 'A4': default: width = '21cm'; height = '29.7cm'; break;
  }

  // Word-specific XML to force Print Layout view and setup page size
  const preHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
    <meta charset='utf-8'>
    <title>Document</title>
    <!--[if gte mso 9]>
    <xml>
    <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page {
        size: ${width} ${height};
        margin: 2.54cm; /* Standard 1 inch margin */
      }
      body {
        font-family: 'Calibri', 'Arial', sans-serif;
        font-size: 11pt;
        line-height: 1.15;
        tab-interval: 36pt;
      }
      p {
        margin: 0;
        margin-bottom: 0pt; /* Remove default spacing to let inline styles control it */
      }
      /* Ensure tables behave well in Word for layout */
      table {
        border-collapse: collapse;
        width: 100%;
        mso-table-layout-alt: fixed; 
      }
      td {
        vertical-align: top;
        padding: 0;
      }
    </style>
    </head>
    <body>
    <div class="Section1">
  `;
  
  const postHtml = "</div></body></html>";
  const sourceHTML = preHtml + htmlContent + postHtml;

  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
  
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = `${fileName}.doc`;
  fileDownload.click();
  document.body.removeChild(fileDownload);
};

export const downloadAsPdf = (elementId: string, fileName: string, paperSize: PaperSize = 'A4') => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // @ts-ignore - html2pdf is loaded via CDN
  if (typeof window.html2pdf === 'undefined') {
    alert("PDF library is loading. Please try again in a moment.");
    return;
  }

  const opt = {
    margin: 1, // 1 inch margin roughly (25.4mm)
    filename: `${fileName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: paperSize.toLowerCase(), orientation: 'portrait' }
  };

  // @ts-ignore
  window.html2pdf().set(opt).from(element).save();
};