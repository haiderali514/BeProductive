

import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse, Content } from "@google/genai";
import { Priority, Recurrence, Task, List, Habit, UserProfile } from '../types';

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
    
    const jsonText = response.text?.trim();
    if (!jsonText) {
      console.error("Gemini returned an empty response for parsing task.", { response });
      throw new Error("The AI assistant gave an empty response. Please rephrase your request.");
    }
    
    const parsedJson = JSON.parse(jsonText);

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
    if (error instanceof SyntaxError) {
        throw new Error("The AI couldn't understand the task format. Please try phrasing it differently.");
    }
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
        
        const jsonText = response.text?.trim();
        if (!jsonText) {
            console.error("Gemini returned an empty response for generating subtasks.", { response });
            throw new Error("The AI assistant couldn't generate subtasks for this task. Please try again.");
        }

        const parsedJson = JSON.parse(jsonText);
        return parsedJson.subtasks || [];
    } catch (error) {
        console.error("Error generating subtasks with Gemini:", error);
        if (error instanceof SyntaxError) {
            throw new Error("The AI assistant returned an invalid format for subtasks. Please try again.");
        }
        throw new Error("Could not generate subtasks. Please try again.");
    }
}

// --- AI Planning Service ---
export interface AITaskSuggestion {
    title: string;
    listName: string;
}

const generateTaskPlanSchema = {
    type: Type.OBJECT,
    properties: {
        tasks: {
            type: Type.ARRAY,
            description: "An array of task objects.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A small, actionable task title." },
                    listName: { type: Type.STRING, description: "The recommended list for this task from the available list names provided." }
                },
                required: ['title', 'listName']
            }
        }
    },
    required: ["tasks"],
};

export const generateTaskPlan = async (goal: string, listNames: string[]): Promise<AITaskSuggestion[]> => {
    if (!process.env.API_KEY) {
      throw new Error("Gemini API key is not configured.");
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an expert project planner. Break down the following user goal into a list of small, actionable tasks. For each task, suggest the most appropriate list it should belong to from the provided list names. Your suggestions should be logical. Goal: "${goal}". Available lists: ${listNames.join(', ')}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: generateTaskPlanSchema,
            },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            console.error("Gemini returned an empty response for generating a task plan.", { response });
            throw new Error("The AI assistant couldn't generate a plan for this goal. Please try again.");
        }

        const parsedJson = JSON.parse(jsonText);
        return parsedJson.tasks || [];
    } catch (error) {
        console.error("Error generating task plan with Gemini:", error);
        if (error instanceof SyntaxError) {
            throw new Error("The AI assistant returned an invalid format for the plan. Please try again.");
        }
        throw new Error("Could not generate a plan for this goal. Please try again.");
    }
};

// --- AI Assistant Service ---

export interface AIContext {
    tasks: Task[];
    lists: List[];
    habits: Habit[];
    profile: UserProfile;
}

const addTaskDeclaration: FunctionDeclaration = {
  name: 'addTask',
  parameters: {
    type: Type.OBJECT,
    description: 'Adds a new task to the user\'s todo list.',
    properties: {
        title: { type: Type.STRING, description: 'The title of the task. Should include all details like time if provided in the prompt.' },
        listName: { type: Type.STRING, description: 'The name of the list to add the task to. Defaults to Inbox if not specified.' },
        priority: { type: Type.STRING, enum: Object.values(Priority), description: 'Task priority, inferred from words like "important" or "urgent".' },
        dueDate: { type: Type.STRING, description: 'The due date in YYYY-MM-DD format. Inferred from relative terms like "tomorrow".' },
    },
    required: ['title'],
  },
};

const getTasksDeclaration: FunctionDeclaration = {
    name: 'getTasks',
    parameters: {
        type: Type.OBJECT,
        description: 'Retrieves a list of tasks based on a time period like "today" or "this week".',
        properties: {
            period: { type: Type.STRING, enum: ['today', 'tomorrow', 'this week'], description: 'The time period to fetch tasks for.' }
        },
        required: ['period'],
    },
};

const saveUserTraitDeclaration: FunctionDeclaration = {
    name: 'saveUserTrait',
    parameters: {
        type: Type.OBJECT,
        description: 'Saves a personal detail about the user to their profile for long-term memory. Use this to remember their goals, struggles, weaknesses, passions, hobbies, routines, and other preferences mentioned in conversation.',
        properties: {
            traitType: { type: Type.STRING, enum: ['goal', 'struggle', 'passion', 'hobby', 'routine', 'preference', 'weakness'], description: 'The category of the information being saved.' },
            traitText: { type: Type.STRING, description: 'The detail or statement to save.' },
            goalSubtype: { type: Type.STRING, enum: ['long-term', 'short-term'], description: 'If the traitType is "goal", specify if it is long-term or short-term. Otherwise, omit this.' }
        },
        required: ['traitType', 'traitText'],
    },
};

const systemInstruction = `You are Aura, an AI-powered personal task manager and life coach integrated inside a TickTick-style app. You combine the functionality of a task manager with the conversational and supportive abilities of a personal coach.

Your core mission is to help the user organize their life and achieve their goals by understanding them on a deeper level.

**Your Capabilities:**

1.  **Maintain a Persistent Memory:**
    *   You have access to the user's profile, which contains a list of 'traits'. Each trait has a type (like 'goal', 'struggle', 'hobby', 'passion') and text. This is your long-term memory about the user.
    *   You also have access to their current task lists and habits.

2.  **Learn from Conversation:**
    *   Pay close attention to what the user says. If they mention a new goal, challenge, interest, or personal detail, use the \`saveUserTrait\` function to update your memory of them.
    *   **Goal Example:** If the user says, "I really want to learn to code in 6 months," you should call \`saveUserTrait({ traitType: 'goal', traitText: 'Learn to code in 6 months', goalSubtype: 'long-term' })\`.
    *   **Struggle Example:** If the user says, "I always put things off until the last minute," you should call \`saveUserTrait({ traitType: 'struggle', traitText: 'Procrastination' })\`.
    *   **Hobby Example:** If the user says, "I love hiking on the weekends," you should call \`saveUserTrait({ traitType: 'hobby', traitText: 'Hiking on weekends' })\`.
    *   **Passion Example:** If they say, "I'm really passionate about photography," call \`saveUserTrait({ traitType: 'passion', traitText: 'Photography' })\`.

3.  **Provide Personalized & Contextual Responses:**
    *   **ALWAYS** use your memory (the user's traits) to tailor your advice, task suggestions, and encouragement.
    *   If the user struggles with procrastination, suggest strategies like breaking tasks down or using the Pomodoro timer.
    *   If a user's goal is to 'get fit' and their hobby is 'hiking', suggest adding a 'go for a hike' task.

4.  **Act as a Supportive Coach:**
    *   Respond in a conversational, empathetic, and supportive tone.
    *   Help the user achieve their goals by breaking them down into smaller, actionable daily/weekly tasks.
    *   Provide motivation and accountability. Remind them of their progress and the struggles or passions they've mentioned before.

5.  **Be an Efficient Task Manager:**
    *   Handle natural language queries for task management efficiently using the provided tools (\`addTask\`, \`getTasks\`).

**Interaction Flow:**

1.  The user sends a message.
2.  You analyze the message, considering their profile data (traits) and current tasks.
3.  If they state a new personal detail, call the \`saveUserTrait\` function to save it.
4.  If they ask for tasks or to add a task, call the appropriate function.
5.  Formulate a helpful, supportive, and conversational response that acknowledges their context. For example, if you save a new hobby for them, confirm that you've remembered it and ask if they'd like to schedule time for it.

Today's date is ${new Date().toLocaleDateString()}.`;


export const chatWithAssistant = async (history: Content[], context: AIContext): Promise<GenerateContentResponse> => {
    if (!process.env.API_KEY) {
      throw new Error("Gemini API key is not configured.");
    }

    const fullContext = `
      Here is the user's current data:
      - Profile: ${JSON.stringify(context.profile)}
      - Lists: ${JSON.stringify(context.lists)}
      - Tasks: ${JSON.stringify(context.tasks)}
      - Habits: ${JSON.stringify(context.habits)}
    `;
    
    // Create a deep copy of the history to avoid mutating the original state object.
    const historyWithContext = JSON.parse(JSON.stringify(history));
    
    // Add the full context to the latest user message in the copied history.
    const lastMessage = historyWithContext[historyWithContext.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
        const lastPart = lastMessage.parts[lastMessage.parts.length - 1];
        if (lastPart && 'text' in lastPart) {
           lastPart.text = `${lastPart.text}\n\n[CONTEXT]\n${fullContext}`;
        }
    }
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: historyWithContext,
        config: {
            systemInstruction: systemInstruction,
            tools: [{functionDeclarations: [addTaskDeclaration, getTasksDeclaration, saveUserTraitDeclaration]}],
        },
    });
    
    return response;
};

export const generateChatTitle = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
      return "Chat"; // Fallback title
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a very short, concise title (3-5 words max) for a conversation that starts with this user prompt: "${prompt}". Just return the title text, nothing else.`,
        });
        const title = response.text.trim().replace(/"/g, ''); // Clean up quotes
        return title || "Untitled Chat";
    } catch (error) {
        console.error("Error generating chat title:", error);
        return "Chat"; // Fallback title
    }
};


// --- Proactive AI Service ---

const proactiveSuggestionSystemInstruction = `You are Aura, an AI life coach. Your task is to analyze the user's data and provide a single, short, proactive notification. This could be a motivational tip related to their struggles, a reminder of their long-term goals, or a suggestion to work on a habit they've missed. Keep the message under 25 words. Be supportive and encouraging. If you have no good suggestion, you MUST respond with the exact string 'NO_SUGGESTION'. Otherwise, just return the suggestion text.

Today's date is ${new Date().toLocaleDateString()}.`;

export const getProactiveSuggestion = async (context: AIContext): Promise<string | null> => {
    if (!process.env.API_KEY) {
      console.warn("API_KEY not set. Skipping proactive AI suggestion.");
      return null;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a proactive suggestion based on this user context:\n${JSON.stringify(context)}`,
            config: {
                systemInstruction: proactiveSuggestionSystemInstruction,
            },
        });

        const suggestion = response.text.trim();
        if (suggestion === 'NO_SUGGESTION' || suggestion === '') {
            return null;
        }
        return suggestion;
    } catch (error) {
        console.error("Error getting proactive suggestion:", error);
        return null;
    }
};
