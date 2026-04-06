import { GoogleGenAI } from "@google/genai";
import config from "../config/config.js";

const ai = new GoogleGenAI({
  apiKey: config.GEMINI_API_KEY
});

// Convert file buffer → base64
const bufferToBase64 = (buffer) => buffer.toString("base64");

// Prompt builder
const getPrompt = (documentType) => {
    return `
You are an AI that extracts structured data from business documents.

Extract data strictly in JSON format.

Document Type: ${documentType}

Rules:
- Return ONLY valid JSON (no explanation, no markdown)
- Use exact keys as specified
- If value missing, return null
- Extract items as array
- Assume that item code only contains number. If Item Code = "11423 psm" then ignore character after space

Schema:

For PO:
{
  "poNumber": "",
  "poDate": "",
  "vendorName": "",
  "items": [
    {
      "itemCode": "",
      "description": "",
      "quantity": 0
    }
  ]
}

For GRN:
{
  "grnNumber": "",
  "poNumber": "",
  "grnDate": "",
  "items": [
    {
      "itemCode": "",
      "description": "",
      "receivedQuantity": 0
    }
  ]
}

For Invoice:
{
  "invoiceNumber": "",
  "poNumber": "",
  "invoiceDate": "",
  "items": [
    {
      "itemCode": "",
      "description": "",
      "quantity": 0
    }
  ]
}
`;
};

export const parseDocument = async (fileBuffer, mimeType, documentType) => {
    try {
        const base64Data = bufferToBase64(fileBuffer);

        const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                {
                role: "user",
                parts: [
                    {
                    text: getPrompt(documentType)
                    },
                    {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                    }
                ]
                }
            ]
        });

        const responseText = result.text;
        console.log(responseText)

        const cleanText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

        const parsed = JSON.parse(cleanText);

        return parsed;

    } catch (error) {
        console.error("Gemini Parsing Error:", error.message);
        throw new Error("Failed to parse document using Gemini");
    }
};