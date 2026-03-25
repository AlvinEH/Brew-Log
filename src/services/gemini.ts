import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

function getAI(customKey?: string) {
  const apiKey = customKey || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
}

export async function getRecommendedRecipes(coffeeType?: string, customKey?: string) {
  const ai = getAI(customKey);
  const prompt = coffeeType 
    ? `Recommend 3 popular pourover coffee recipes for ${coffeeType} beans. Include source, description, coffee weight (g), water weight (g), ratio, step-by-step instructions, specific timings for each step (e.g., 0:45, 1:30), and the cumulative water weight to pour for each step (e.g., 50g, 150g).`
    : "Recommend 3 popular pourover coffee recipes (e.g., V60, Chemex, Kalita Wave). Include source, description, coffee weight (g), water weight (g), ratio, step-by-step instructions, specific timings for each step (e.g., 0:45, 1:30), and the cumulative water weight to pour for each step (e.g., 50g, 150g).";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      maxOutputTokens: 4000,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            source: { type: Type.STRING },
            description: { type: Type.STRING },
            coffeeWeight: { type: Type.NUMBER },
            waterWeight: { type: Type.NUMBER },
            ratio: { type: Type.STRING },
            steps: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            timings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  time: { type: Type.STRING },
                  waterWeight: { type: Type.STRING }
                },
                required: ["step", "time", "waterWeight"]
              }
            },
            url: { type: Type.STRING }
          },
          required: ["title", "source", "description", "coffeeWeight", "waterWeight", "ratio", "steps", "timings"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse recipes:", e);
    return [];
  }
}

export async function extractBeanInfoFromUrl(url: string, customKey?: string) {
  const ai = getAI(customKey);
  const prompt = `Extract coffee bean information from this URL: ${url}. 
  Provide the bean name, roaster name, roast date (if mentioned), price, weight/bag size, and a list of flavor notes/profile. 
  For the weight/bag size, ONLY retrieve the value in ounces (oz). For example, if the page says "16oz (1lb)", return "16oz".
  If any information is missing, leave it as an empty string or empty array.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ urlContext: {} }],
      responseMimeType: "application/json",
      maxOutputTokens: 2000,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          roaster: { type: Type.STRING },
          roastDate: { type: Type.STRING },
          price: { type: Type.STRING },
          weight: { 
            type: Type.STRING,
            description: "The weight of the coffee bag, specifically in ounces (e.g., '12oz', '16oz')."
          },
          flavorProfile: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["name", "roaster", "price", "weight", "flavorProfile"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse bean info:", e);
    return null;
  }
}
