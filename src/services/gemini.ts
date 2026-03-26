import { GoogleGenAI, Type } from "@google/genai";

function getAI(customKey?: string) {
  const apiKey = customKey || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
}

export async function getRecommendedRecipes(coffeeType?: string, customKey?: string) {
  const ai = getAI(customKey);
  const prompt = coffeeType 
    ? `Recommend 3 popular pourover coffee recipes for ${coffeeType} beans. Include source, description, coffee weight (g), water weight (g), ratio, step-by-step instructions, specific timings for each step (e.g., 0:45, 1:30), and the cumulative water weight to pour for each step (e.g., 50g, 150g).`
    : "Recommend 3 popular pourover coffee recipes (e.g., V60, Chemex, Kalita Wave). Include source, description, coffee weight (g), water weight (g), ratio, step-by-step instructions, specific timings for each step (e.g., 0:45, 1:30), and the cumulative water weight to pour for each step (e.g., 50g, 150g).";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        maxOutputTokens: 4000,
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

    return JSON.parse(response.text || "[]");
  } catch (e: any) {
    console.error("Failed to fetch or parse recipes:", e);
    // Re-throw with more context if it's a rate limit or auth error
    if (e?.message?.includes("429") || e?.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded (429).");
    }
    if (e?.message?.includes("API_KEY_INVALID") || e?.message?.includes("invalid API key")) {
      throw new Error("Invalid Gemini API key.");
    }
    throw e;
  }
}

export async function extractBeanInfoFromUrl(url: string, customKey?: string) {
  const ai = getAI(customKey);
  const prompt = `Extract coffee bean information from this URL: ${url}. 
  Provide the bean name, roaster name, roast date (if mentioned), price, weight/bag size, and a list of flavor notes/profile. 
  For the weight/bag size, ONLY retrieve the value in ounces (oz). For example, if the page says "16oz (1lb)", return "16oz".
  If any information is missing, leave it as an empty string or empty array.`;

  console.log("Extracting bean info from:", url);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: "application/json",
        maxOutputTokens: 2000,
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

    console.log("Gemini response received:", response.text);

    if (!response.text) {
      console.warn("Gemini returned empty text for URL extraction");
      return null;
    }

    return JSON.parse(response.text);
  } catch (e: any) {
    console.error("Failed to extract or parse bean info:", e);
    // Re-throw with more context if it's a rate limit or auth error
    if (e?.message?.includes("429") || e?.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded (429).");
    }
    if (e?.message?.includes("API_KEY_INVALID") || e?.message?.includes("invalid API key")) {
      throw new Error("Invalid Gemini API key.");
    }
    throw e; // Re-throw to be caught by the UI handler
  }
}

export async function extractRecipeFromUrl(url: string, customKey?: string) {
  const ai = getAI(customKey);
  const prompt = `Extract a pourover coffee recipe from this URL: ${url}. 
  Provide the recipe title, source, a brief description, coffee weight (g), water weight (g), ratio, step-by-step instructions (steps), and specific timings for each step (timings) including the cumulative water weight to pour for each step (e.g., 50g, 150g).
  If any information is missing, leave it as an empty string or empty array.`;

  console.log("Extracting recipe from:", url);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: "application/json",
        maxOutputTokens: 4000,
        responseSchema: {
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
            }
          },
          required: ["title", "source", "description", "coffeeWeight", "waterWeight", "ratio", "steps", "timings"]
        }
      }
    });

    console.log("Gemini response received:", response.text);

    if (!response.text) {
      console.warn("Gemini returned empty text for recipe extraction");
      return null;
    }

    return JSON.parse(response.text);
  } catch (e: any) {
    console.error("Failed to extract or parse recipe:", e);
    if (e?.message?.includes("429") || e?.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded (429).");
    }
    if (e?.message?.includes("API_KEY_INVALID") || e?.message?.includes("invalid API key")) {
      throw new Error("Invalid Gemini API key.");
    }
    throw e;
  }
}
