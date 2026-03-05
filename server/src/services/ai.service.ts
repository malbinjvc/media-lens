import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../lib/env.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const aiService = {
  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<string> {
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType,
        },
      },
      "Analyze this image in detail. Describe what you see, including objects, people, text, colors, composition, and any notable elements. If there is text in the image, extract it (OCR). Provide a comprehensive but concise analysis.",
    ]);
    return result.response.text();
  },

  async summarizeText(text: string): Promise<string> {
    const result = await model.generateContent([
      `Summarize the following document concisely, capturing the key points, main arguments, and important details:\n\n${text}`,
    ]);
    return result.response.text();
  },

  async generateTags(
    content: string,
    mimeType: string
  ): Promise<string[]> {
    const prompt =
      mimeType.startsWith("image/")
        ? "Based on this image analysis, generate 5-10 relevant tags as a JSON array of strings. Only output the JSON array, nothing else."
        : "Based on this text content, generate 5-10 relevant tags as a JSON array of strings. Only output the JSON array, nothing else.";

    const result = await model.generateContent([`${prompt}\n\nContent:\n${content}`]);
    const responseText = result.response.text();

    const match = responseText.match(/\[[\s\S]*?\]/);
    if (!match) return [];

    try {
      const tags = JSON.parse(match[0]);
      if (Array.isArray(tags) && tags.every((t: unknown) => typeof t === "string")) {
        return tags.slice(0, 10);
      }
      return [];
    } catch {
      return [];
    }
  },

  async askQuestion(
    content: string,
    mimeType: string,
    question: string,
    imageBuffer?: Buffer
  ): Promise<string> {
    const parts: Parameters<typeof model.generateContent>[0] = [];

    if (imageBuffer && mimeType.startsWith("image/")) {
      (parts as unknown[]).push({
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType,
        },
      });
    }

    (parts as unknown[]).push(
      `Context about this media:\n${content}\n\nUser question: ${question}\n\nProvide a helpful, accurate answer based on the media content.`
    );

    const result = await model.generateContent(parts);
    return result.response.text();
  },

  async extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
      "Extract all text content from this PDF document. Preserve the structure and formatting as much as possible.",
    ]);
    return result.response.text();
  },
};
