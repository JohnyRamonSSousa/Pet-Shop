
import { GoogleGenAI } from "@google/genai";

export class PetAIService {
  // Always create a new instance right before making an API call to ensure it uses the most up-to-date API key.
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async getPetAdvice(question: string, petType: string): Promise<string> {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é um assistente virtual especialista em cuidados com pets para o PetVibe. 
        Um cliente perguntou sobre um ${petType}: "${question}". 
        Dê conselhos úteis, amigáveis e profissionais. 
        Sempre lembre o cliente que esta IA não substitui uma consulta veterinária presencial no PetVibe.`,
      });
      // Use .text property to get the response string.
      return response.text || "Desculpe, não consegui processar seu pedido agora.";
    } catch (error) {
      console.error("AI Error:", error);
      return "Estou tendo problemas para me conectar. Tente novamente mais tarde.";
    }
  }

  // Adding the missing editImage method used by the AIImageEditor component.
  static async editImage(imageBase64: string, prompt: string): Promise<string | null> {
    const ai = this.getAI();
    try {
      // Extract base64 and mime type from data URL.
      const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error("Formato de imagem inválido");
      }
      const mimeType = matches[1];
      const base64Data = matches[2];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      // Find the image part in the response candidates.
      if (response.candidates && response.candidates[0] && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("AI Image Edit Error:", error);
      throw error;
    }
  }
}
