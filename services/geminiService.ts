import { GoogleGenAI } from "@google/genai";
import { GeneratedDocument } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert document layout specialist and typographer using HTML for Microsoft Word export.
Your task is to take a raw text narrative provided by the user and reformat it to mimic the structural style of a provided reference image.

CRITICAL FOR WORD COMPATIBILITY:
- Microsoft Word DOES NOT support CSS Flexbox or Grid. 
- You MUST use HTML TABLES (<table style="width:100%; border:none;">) to create columns, alignments, or complex layouts (like headers with text on left and date on right).
- Use inline CSS strictly.
- Use 'pt' (points) for font sizes and margins, not 'px' or 'rem'.

Analyze the image for:
1. Paragraph indentation and spacing.
2. Heading styles (bold, size, hierarchy).
3. Lists (bullet points vs numbered).
4. Alignment (justified, left-aligned, centered).
5. Font styles (serif vs sans-serif approximation).

OUTPUT RULES:
- Return ONLY valid HTML code inside a <div> tag. 
- Do NOT include <html>, <head>, or <body> tags.
- Do NOT include markdown code fences (like \`\`\`html).
- The user input might contain basic HTML tags (<b>, <i>, <ul>). Preserve the user's emphasis.
- If the image shows a signature block or date aligned to the right, use a 2-column borderless table.
`;

const ANALYSIS_INSTRUCTION = `
You are a professional editor and writing coach.
Analyze the provided text for:
1. Grammar and spelling errors (Bahasa Indonesia).
2. Sentence flow and clarity.
3. Professional tone inconsistencies.

Output your response in valid HTML format (using <ul>, <li>, <strong> tags) so it can be rendered easily. 
Keep it concise. If the text is good, compliment it. If there are errors, list them clearly.
`;

export const generateDocumentStructure = async (
  narrativeText: string,
  referenceImageBase64: string,
  mimeType: string
): Promise<GeneratedDocument> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: referenceImageBase64,
              },
            },
            {
              text: `Here is the narrative text (HTML format): "${narrativeText}". \n\nReconstruct this text into an HTML document structure that visually mimics the layout, spacing, and hierarchy of the provided image. Ensure it renders correctly in Microsoft Word.`,
            },
          ],
        },
      ],
    });

    let htmlText = response.text || "";
    htmlText = htmlText.replace(/```html/g, "").replace(/```/g, "");

    return {
      htmlContent: htmlText,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Gagal menyusun dokumen. Silakan coba lagi.");
  }
};

export const analyzeNarrative = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Strip HTML tags for analysis to focus on content
  const plainText = text.replace(/<[^>]*>?/gm, '');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: ANALYSIS_INSTRUCTION,
      },
      contents: [{ role: "user", parts: [{ text: `Analyze this text: "${plainText}"` }] }],
    });
    
    let result = response.text || "";
    return result.replace(/```html/g, "").replace(/```/g, "");
  } catch (error) {
    console.error("Analysis Error", error);
    throw new Error("Gagal menganalisa teks.");
  }
};