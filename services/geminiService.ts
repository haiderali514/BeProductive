
import { GoogleGenAI, Type } from "@google/genai";
import { Priority, Recurrence } from '../types';

if (!process.env.API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this example, we'll alert the user and disable AI features.
  console.error("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const smartAddTaskSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "The main title of the task. Should be concise.",
        },
        priority: {
            type: Type.STRING,
            enum: Object.values(Priority),
            description: "The priority of the task. Defaults to 'None'. Use '!high', '!medium', '!low' as indicators.",
        },
        listName: {
            type: Type.STRING,
            description: "The name of the list the task belongs to. Indicated by a hashtag, e.g., '#work'. Defaults to 'Inbox'."
        },
        dueDate: {
            type: Type.STRING,
            description: "The due date of the task in YYYY-MM-DD format. Can be relative like 'tomorrow' or 'next friday'. If a time is included, keep it with the date. Defaults to null.",
        },
        recurrence: {
            type: Type.STRING,
            enum: Object.values(Recurrence),
            description: "The recurrence rule for the task, e.g., 'Daily', 'Weekly'. Inferred from phrases like 'every day', 'every monday'. Defaults to null."
        },
    },
    required: ["title"],
};

const generateSubtasksSchema = {
    type: Type.OBJECT,
    properties: {
        subtasks: {
            type: Type.ARRAY,
            description: "An array of strings, where each string is a small, actionable subtask.",
            items: {
                type: Type.STRING,
            }
        }
    },
    required: ["subtasks"],
};


export const parseTaskFromString = async (prompt: string, listNames: string[]) => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Parse the following user input into a structured task object. Today's date is ${new Date().toDateString()}. Available lists are: ${listNames.join(', ')}. Default list is 'Inbox'. Recurrence can be Daily, Weekly, Monthly, or Yearly. Input: "${prompt}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: smartAddTaskSchema,
        },
    });
    
    const parsedJson = JSON.parse(response.text);

    // Basic validation and default assignment
    return {
        title: parsedJson.title || 'Untitled Task',
        priority: Object.values(Priority).includes(parsedJson.priority) ? parsedJson.priority : Priority.NONE,
        listName: listNames.includes(parsedJson.listName) ? parsedJson.listName : 'Inbox',
        dueDate: parsedJson.dueDate || null,
        recurrence: Object.values(Recurrence).includes(parsedJson.recurrence) ? parsedJson.recurrence : null,
    };

  } catch (error) {
    console.error("Error parsing task with Gemini:", error);
    throw new Error("Could not understand the task. Please try a different phrasing.");
  }
};

export const generateSubtasks = async (taskTitle: string): Promise<string[]> => {
    if (!process.env.API_KEY) {
      throw new Error("Gemini API key is not configured.");
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Break down the following complex task into a list of small, actionable subtasks. Task: "${taskTitle}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: generateSubtasksSchema,
            },
        });
        const parsedJson = JSON.parse(response.text);
        return parsedJson.subtasks || [];
    } catch (error) {
        console.error("Error generating subtasks with Gemini:", error);
        throw new Error("Could not generate subtasks. Please try again.");
    }
}