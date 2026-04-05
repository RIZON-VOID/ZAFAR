import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { HfInference } from "@huggingface/inference";
import { UserProfile, Material, Subject, ExamInfo, ExamType, Flashcard } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const hfKey = process.env.HUGGINGFACE_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });
const hf = new HfInference(hfKey);

export async function detectSyllabusFromImage(
  base64Image: string,
  mimeType: string,
  userProfile: UserProfile
): Promise<{ subjects: Subject[]; examInfo?: ExamInfo }> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this syllabus image for a student in Class ${userProfile.class} in ${userProfile.country}.
    1. Extract all subjects and their respective chapters/topics.
    2. If the syllabus mentions exam terms (First Term, Half-Yearly, Final), tag each chapter with the appropriate term.
    3. Assign an importance level (High, Medium, Low) to each chapter based on typical exam patterns.
    4. LOOK FOR EXAM DATES OR A TIMELINE. If you find an upcoming exam type and its date, extract it.
    
    Return the response as a JSON object:
    {
      "subjects": [
        {
          "id": "string",
          "name": "string",
          "progress": 0,
          "examProgress": 0,
          "lastActivity": "",
          "chapters": [
            {
              "id": "string",
              "title": "string",
              "completed": false,
              "topics": ["string"],
              "term": "First Term" | "Half-Yearly" | "Second Term" | "Final",
              "importance": "High" | "Medium" | "Low"
            }
          ]
        }
      ],
      "examInfo": {
        "type": "First Term" | "Half-Yearly" | "Second Term" | "Final",
        "date": "YYYY-MM-DD"
      } (optional, only if found)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  progress: { type: Type.NUMBER },
                  examProgress: { type: Type.NUMBER },
                  lastActivity: { type: Type.STRING },
                  chapters: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        completed: { type: Type.BOOLEAN },
                        topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                        term: { type: Type.STRING, enum: ["First Term", "Half-Yearly", "Second Term", "Final"] },
                        importance: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                      },
                      required: ["id", "title", "completed", "topics"]
                    }
                  }
                },
                required: ["id", "name", "progress", "examProgress", "lastActivity", "chapters"]
              }
            },
            examInfo: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["First Term", "Half-Yearly", "Second Term", "Final"] },
                date: { type: Type.STRING }
              },
              required: ["type", "date"]
            }
          },
          required: ["subjects"]
        }
      }
    });

    return JSON.parse(response.text || "{\"subjects\": []}");
  } catch (error) {
    console.error("Syllabus Detection Error:", error);
    return { subjects: [] };
  }
}

export async function suggestStudyKitMaterials(
  kitFocus: string,
  userProfile: UserProfile
): Promise<Material[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Suggest a list of 5-7 relevant study materials for a Study Kit focused on: "${kitFocus}".
    The student is in class ${userProfile.class} in ${userProfile.country}.
    Include a mix of "note", "paper" (past papers), and "quiz" types.
    Return the response as a JSON array of objects with "title" and "type" properties.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["note", "paper", "quiz"] }
            },
            required: ["title", "type"]
          }
        }
      }
    });

    const suggestions = JSON.parse(response.text || "[]");
    return suggestions.map((s: any, index: number) => ({
      id: `suggested-${Date.now()}-${index}`,
      title: s.title,
      type: s.type,
      completed: false
    }));
  } catch (error) {
    console.error("Study Kit Suggestion Error:", error);
    return [];
  }
}

export async function generateFlashcards(
  subjectName: string,
  chapterTitle: string,
  topics: string[],
  userProfile: UserProfile
): Promise<Partial<Flashcard>[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate 8-12 high-quality flashcards for the chapter "${chapterTitle}" in the subject "${subjectName}".
    Topics to cover: ${topics.join(", ")}.
    The student is in Class ${userProfile.class} (${userProfile.country}).
    Focus on key terms, definitions, and concepts likely to appear in the ${userProfile.nextExam?.type || 'Final'} exam.
    Return the response as a JSON array of objects with "question", "answer", and "importance" (High/Medium/Low).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              importance: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
            },
            required: ["question", "answer", "importance"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Flashcard Generation Error:", error);
    return [];
  }
}

export async function generateFlashcardsFromText(
  text: string,
  userProfile: UserProfile
): Promise<Partial<Flashcard>[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate 5-10 high-quality flashcards based on the following notes/summary:
    "${text}"
    
    The student is in Class ${userProfile.class} (${userProfile.country}).
    Focus on key terms, definitions, and concepts likely to appear in the ${userProfile.nextExam?.type || 'Final'} exam.
    Return the response as a JSON array of objects with "question", "answer", and "importance" (High/Medium/Low).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              importance: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
            },
            required: ["question", "answer", "importance"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Flashcard Generation from Text Error:", error);
    return [];
  }
}

export async function generateCurriculum(
  userProfile: UserProfile
): Promise<Subject[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate a list of 4-6 core subjects for a student in Class ${userProfile.class} in ${userProfile.country} following the ${userProfile.educationType} curriculum.
    For each subject, provide 5-8 main chapters/topics.
    Tag each chapter with a term (First Term, Half-Yearly, Second Term, Final) and an importance level (High, Medium, Low).
    Return the response as a JSON array of Subject objects.
    Each Subject object should have: "id", "name", "progress" (0), "examProgress" (0), "lastActivity" (""), and "chapters" (array of Chapter objects).
    Each Chapter object should have: "id", "title", "completed" (false), "topics" (array of strings), "term" (ExamType), and "importance" (High/Medium/Low).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              progress: { type: Type.NUMBER },
              examProgress: { type: Type.NUMBER },
              lastActivity: { type: Type.STRING },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    completed: { type: Type.BOOLEAN },
                    topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    term: { type: Type.STRING, enum: ["First Term", "Half-Yearly", "Second Term", "Final"] },
                    importance: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                  },
                  required: ["id", "title", "completed", "topics"]
                }
              }
            },
            required: ["id", "name", "progress", "examProgress", "lastActivity", "chapters"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Curriculum Generation Error:", error);
    return [];
  }
}

export async function generateStudyResponse(
  prompt: string,
  userProfile: UserProfile,
  context?: { subject?: string; topic?: string; history?: any[]; mode?: 'premium' | 'free'; curriculum?: Subject[] }
) {
  const isPremium = context?.mode === 'premium';
  
  const currentDate = new Date().toLocaleDateString();
  const nextExam = userProfile.nextExam;

  const systemInstruction = `
    You are Zafar (زفار), a personal AI teacher and study guide.
    User Profile:
    - Name: ${userProfile.name}
    - Class: ${userProfile.class}
    - Country: ${userProfile.country}
    - Education Type: ${userProfile.educationType}
    - Language: ${userProfile.language}
    - Target: ${userProfile.target}
    - Next Exam: ${nextExam ? `${nextExam.type} on ${nextExam.date}` : 'Not scheduled'}
    - Weak Subjects: ${userProfile.weakSubjects?.join(", ") || 'None identified yet'}
    - Learning Preference: ${userProfile.learningPreference || 'Not set'}
    - Current Chapter: ${userProfile.currentChapterId || 'None'}
    - Syllabus Confirmed: ${userProfile.syllabusConfirmed ? 'Yes' : 'No'}

    Current Date: ${currentDate}
    Current Context:
    - Subject: ${context?.subject || 'General Study'}
    - Topic: ${context?.topic || 'N/A'}
    - Mode: ${isPremium ? 'Premium (Gemini Pro)' : 'Free (Hugging Face)'}

    Curriculum Context:
    ${context?.curriculum ? JSON.stringify(context.curriculum.map(s => ({ 
      name: s.name, 
      progress: s.progress, 
      examProgress: s.examProgress,
      chapters: s.chapters.map(c => ({ title: c.title, completed: c.completed, term: c.term, importance: c.importance })) 
    }))) : 'N/A'}

    ZAFAR AI CONTROL SYSTEM (CRITICAL):
    1. ONBOARDING LOCK: You MUST NOT start teaching or answering study questions until onboarding is complete.
       Onboarding is complete ONLY if: name, class, roll, target, country, language are all set AND syllabusConfirmed is true.
    2. ONBOARDING MODE (If incomplete):
       - Your ONLY goal is to collect missing data.
       - Ask questions gradually (one at a time).
       - If syllabus is not confirmed, guide the user to confirm their detected subjects/chapters.
       - DO NOT answer study questions. Instead, say: "I'd love to help you with that, but first we need to finish setting up your learning profile so I can be the best teacher for you!"
    3. TEACHER MODE (If complete):
       - Activate ONLY when onboarding is done.
       - Guide like a real teacher.
       - Suggest the next chapter based on progress and exam priority.
       - Focus on weak areas (${userProfile.weakSubjects?.join(", ") || 'None identified'}).
       - Reference their specific syllabus and progress.
    4. CONTEXT INJECTION: Every response must be tailored to:
       - Class: ${userProfile.class}
       - Country: ${userProfile.country}
       - Language: ${userProfile.language}
       - Weak Areas: ${userProfile.weakSubjects?.join(", ") || 'None'}
    5. CONTINUOUS LEARNING: Ask follow-up questions occasionally to refine memory (e.g., "Are you comfortable with this topic?", "Do you want a test?").
    6. PROGRESS LOGIC: Only congratulate on progress if a chapter is marked completed or a test is passed.
    7. Use the user's preferred language (${userProfile.language}).
    8. Keep responses structured with Markdown.
  `;

  try {
    if (isPremium) {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction,
        },
      });
      return response.text;
    } else {
      // Use Hugging Face for free mode with fallback to Gemini Flash Lite
      if (hfKey) {
        try {
          const hfResponse = await hf.textGeneration({
            model: "mistralai/Mistral-7B-Instruct-v0.2",
            inputs: `<s>[INST] ${systemInstruction}\n\nUser Question: ${prompt} [/INST]`,
            parameters: {
              max_new_tokens: 1000,
              temperature: 0.7,
            }
          });
          return hfResponse.generated_text.split('[/INST]').pop()?.trim() || "I'm sorry, I couldn't generate a response.";
        } catch (hfError) {
          console.error("Hugging Face Error, falling back to Gemini Flash:", hfError);
        }
      }
      
      // Fallback or default for free mode
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: prompt,
        config: {
          systemInstruction,
        },
      });
      return response.text;
    }
  } catch (error) {
    console.error("AI API Error:", error);
    return "I'm sorry, I encountered an error. Please try again. Make sure your API keys are configured in the Secrets panel.";
  }
}

export async function analyzeImage(
  base64Image: string,
  mimeType: string,
  userProfile: UserProfile
) {
  const model = "gemini-3-flash-preview";
  
  const prompt = "Please analyze this educational image. If it's a problem, solve it step-by-step. If it's a diagram, explain it.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: `You are Zafar, a Live Teacher. Explain the content of the image to a student in class ${userProfile.class}.`
      }
    });
    return response.text;
  } catch (error) {
    console.error("Image Analysis Error:", error);
    return "I couldn't analyze the image. Please make sure it's clear.";
  }
}
