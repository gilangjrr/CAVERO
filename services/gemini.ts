import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AspectRatio, HashtagStrategy, PromoScript, StoryboardScene } from "../types";
import { fileToBase64 } from "../utils";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set. Please set the environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// 1. Text to Image
export const generateImagesFromText = async (prompt: string, aspectRatio: AspectRatio): Promise<string[]> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 3,
      outputMimeType: 'image/jpeg',
      aspectRatio: aspectRatio,
    },
  });
  
  return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
};

// 2. Image Combiner
export const combineImages = async (
  modelFile: File,
  productFile: File,
  instructions: string,
  aspectRatio: AspectRatio,
  background: string
): Promise<string[]> => {
  const modelBase64 = await fileToBase64(modelFile);
  const productBase64 = await fileToBase64(productFile);

  const modelPart = { inlineData: { data: modelBase64, mimeType: modelFile.type } };
  const productPart = { inlineData: { data: productBase64, mimeType: productFile.type } };

  const aspectRatioText = aspectRatio === '9:16' ? 'tall portrait' : aspectRatio === '16:9' ? 'wide landscape' : 'square';
  
  let fullInstructions = `Take the person from the first image and the product from the second image. Place the product realistically with the person according to these instructions: "${instructions}".`;
  if (background === 'Asli') {
    fullInstructions += ` Keep the original background of the model image.`;
  } else if (background === 'Acak') {
    fullInstructions += ` Place them on a new, interesting, and random background that fits the scene.`;
  }

  fullInstructions += ` IMPORTANT: The final image's composition must strictly follow a ${aspectRatioText} aspect ratio (${aspectRatio}).`;
  
  const textPart = { text: fullInstructions };

  const generationPromises = Array(3).fill(0).map(() => 
    ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [modelPart, productPart, textPart] },
        config: { responseModalities: [Modality.IMAGE] },
    })
  );

  const responses = await Promise.all(generationPromises);
  
  return responses.map(response => {
      const part = response.candidates[0].content.parts[0];
      if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      return '';
  }).filter(url => url);
};

// 3. Change Model Style
export const generateModelVariations = async (modelFile: File, prompt: string): Promise<string[]> => {
    const modelBase64 = await fileToBase64(modelFile);
    const modelPart = { inlineData: { data: modelBase64, mimeType: modelFile.type } };
    
    let textContent = "Generate a variation of this model. Keep the face, body, and clothing as consistent as possible with the original image.";
    if (prompt) {
        textContent += ` Apply this specific style or instruction: "${prompt}". Be creative with the composition, lighting, and background.`;
    } else {
        textContent += " Create a variation with a slightly different pose or style, for example in a professional studio photo setting.";
    }
    const textPart = { text: textContent };

    const generationPromises = Array(3).fill(0).map(() => 
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [modelPart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        })
    );

    const responses = await Promise.all(generationPromises);
    
    return responses.map(response => {
        const part = response.candidates[0].content.parts[0];
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return '';
    }).filter(url => url);
};


// 4. Promo Script Writer
export const generatePromoScript = async (
  productName: string,
  description: string,
  style: string,
  audience: string
): Promise<PromoScript> => {
  const prompt = `Create a promotional script for a product.
    Product Name: ${productName}
    Description: ${description}
    Writing Style: ${style}
    Target Audience: ${audience}

    Structure the output into these exact sections: HOOK, MASALAH, SOLUSI, CTA, CAPTION.
    HOOK should be a catchy opening line.
    MASALAH should describe a problem the audience faces.
    SOLUSI should present the product as the solution.
    CTA should be a clear call to action.
    CAPTION should be a ready-to-use social media caption with emojis.
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hook: { type: Type.STRING, description: 'Catchy opening line.' },
          problem: { type: Type.STRING, description: 'The problem the audience faces.' },
          solution: { type: Type.STRING, description: 'How the product solves the problem.' },
          cta: { type: Type.STRING, description: 'A clear call to action.' },
          caption: { type: Type.STRING, description: 'A social media caption with emojis.' }
        },
        required: ["hook", "problem", "solution", "cta", "caption"],
      }
    }
  });

  const jsonString = response.text.trim();
  return JSON.parse(jsonString) as PromoScript;
};


// 5. Hashtag Planner
export const generateHashtags = async (keyword: string): Promise<HashtagStrategy> => {
    const prompt = `Generate a hashtag strategy for the keyword "${keyword}". 
    Categorize the hashtags into four groups:
    1.  mainHashtags: Core hashtags directly related to the keyword.
    2.  broadHashtags: More general hashtags to reach a wider audience.
    3.  trendingHashtags: Currently popular or viral hashtags that can be relevant.
    4.  audienceHashtags: Hashtags that target a specific user group or interest.
    Provide 3-5 hashtags for each category.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    mainHashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    broadHashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    trendingHashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    audienceHashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["mainHashtags", "broadHashtags", "trendingHashtags", "audienceHashtags"],
            },
        },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as HashtagStrategy;
};

// 6. Text to Speech
export const generateSpeech = async (
    text: string,
    style: string,
    voice: string
): Promise<string> => {
    const prompt = `Say ${style.toLowerCase()}: ${text}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data returned from API.");
    }
    return base64Audio;
};


// 7. Image to Prompt
export const generatePromptFromImage = async (imageFile: File): Promise<string> => {
    const imageBase64 = await fileToBase64(imageFile);
    const imagePart = { inlineData: { data: imageBase64, mimeType: imageFile.type } };
    const textPart = { text: "Describe this image in vivid detail. Create a descriptive prompt that an AI image generator could use to recreate a similar image. Focus on subject, setting, lighting, style, and composition." };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
};

// 8. Image to Image
export const generateImageFromImage = async (imageFile: File, prompt: string): Promise<string[]> => {
    const imageBase64 = await fileToBase64(imageFile);
    const imagePart = { inlineData: { data: imageBase64, mimeType: imageFile.type } };
    const textPart = { text: prompt };

    const generationPromises = Array(3).fill(0).map(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        })
    );
    
    const responses = await Promise.all(generationPromises);
    return responses.map(response => {
        const part = response.candidates[0].content.parts[0];
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return '';
    }).filter(url => url);
};

// 9. Storyboard Director
export const generateStoryboardFromScript = async (script: string, modelFile: File | null): Promise<StoryboardScene[]> => {
    // Step 1: Generate scene descriptions from the script
    const scenePrompt = `Based on the following script, break it down into a maximum of 6 key visual scenes for a storyboard. For each scene, provide a short description and a detailed visual prompt for an AI image generator. IMPORTANT: Ensure the main character(s) are described consistently across all visual prompts to maintain visual identity.
    
    Script: "${script}"`;

    const sceneResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: scenePrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    scenes: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                scene_description: { type: Type.STRING },
                                visual_prompt: { type: Type.STRING }
                            },
                            required: ["scene_description", "visual_prompt"]
                        }
                    }
                }
            }
        }
    });
    
    const sceneData = JSON.parse(sceneResponse.text.trim()) as { scenes: StoryboardScene[] };
    let scenes = sceneData.scenes;
    
    // Step 2: Generate an image for each scene
    if (modelFile) {
        // Use uploaded image for character consistency
        const modelBase64 = await fileToBase64(modelFile);
        const modelPart = { inlineData: { data: modelBase64, mimeType: modelFile.type } };

        const imagePromises = scenes.map(scene => {
            const textPart = { text: `Use the character from the reference image. Place them in this scene, maintaining their appearance and clothing as much as possible: "${scene.visual_prompt}". The final image must have a 16:9 widescreen aspect ratio.` };
            return ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [modelPart, textPart] },
                config: { responseModalities: [Modality.IMAGE] },
            });
        });

        const imageResults = await Promise.all(imagePromises);
        
        return scenes.map((scene, index) => {
             const part = imageResults[index].candidates[0].content.parts[0];
             let imageUrl = '';
             if (part.inlineData) {
                 imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             }
             return { ...scene, imageUrl };
        });

    } else {
        // Use text-based consistency
        const imagePromises = scenes.map(scene => 
            ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: scene.visual_prompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: '16:9'
                }
            })
        );

        const imageResults = await Promise.all(imagePromises);

        return scenes.map((scene, index) => ({
            ...scene,
            imageUrl: `data:image/jpeg;base64,${imageResults[index].generatedImages[0].image.imageBytes}`
        }));
    }
};

// 10. Remove Background
export const removeImageBackground = async (imageFile: File): Promise<string> => {
    const imageBase64 = await fileToBase64(imageFile);
    const imagePart = { inlineData: { data: imageBase64, mimeType: imageFile.type } };
    const textPart = { text: "Remove the background from this image completely. Make the new background transparent. Keep only the main subject in the foreground with clean edges." };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const part = response.candidates[0].content.parts[0];
    if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Could not remove background.");
};

// 11. Image to Video Prompt
export const generateVideoPromptFromImage = async (imageFile: File, instructions: string): Promise<string> => {
    const imageBase64 = await fileToBase64(imageFile);
    const imagePart = { inlineData: { data: imageBase64, mimeType: imageFile.type } };
    
    let textContent = "You are a creative video director. Based on this image, write a compelling and descriptive prompt for a text-to-video AI model. Describe a short, dynamic video clip that starts with or is inspired by this scene. Include details on camera movement (e.g., zoom in, dolly shot), character action, and atmosphere.";

    if (instructions) {
        textContent += ` Follow these specific user instructions: "${instructions}".`
    }
    
    const textPart = { text: textContent };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
};

// 12. Text to Video
export const generateVideoFromText = async (
    prompt: string,
    aspectRatio: '9:16' | '16:9',
    resolution: '720p' | '1080p'
): Promise<string> => {
    // Create a new instance right before the call to ensure the latest API key is used.
    const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    let operation = await localAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: resolution,
            aspectRatio: aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await localAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no URI.");
    }

    return downloadLink;
};

// 13. Image to Video
export const generateVideoFromImage = async (
    imageFile: File,
    prompt: string,
    aspectRatio: '9:16' | '16:9',
    resolution: '720p' | '1080p'
): Promise<string> => {
    // Create a new instance right before the call to ensure the latest API key is used.
    const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const imageBase64 = await fileToBase64(imageFile);

    let operation = await localAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: imageBase64,
            mimeType: imageFile.type,
        },
        config: {
            numberOfVideos: 1,
            resolution: resolution,
            aspectRatio: aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await localAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no URI.");
    }

    return downloadLink;
};