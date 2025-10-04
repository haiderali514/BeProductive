import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse, Content } from "@google/genai";
import { Priority, Recurrence, Task, List, Habit, UserProfile, UserTrait, TraitType, GoalSubtype, GoalProgressReport } from '../types';

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
            description: "The due date of the task in YYYY-MM-DD format. If a time is included (e.g., from a scheduling confirmation), it should be included here in a format like 'YYYY-MM-DD HH:MM'. Can be relative like 'tomorrow' or 'next friday'. Defaults to null.",
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
        contents: `Parse the following user input into a structured task object. Prioritize based on Eisenhower Matrix principles (Urgent/Important). High/Medium priority is 'Important'. Due dates of today/tomorrow are 'Urgent'. Today's date is ${new Date().toDateString()}. Available lists are: ${listNames.join(', ')}. Default list is 'Inbox'. Recurrence can be Daily, Weekly, Monthly, or Yearly. Input: "${prompt}"`,
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
        dueDate: { type: Type.STRING, description: "The due date in YYYY-MM-DD format. If a time is included (e.g., from a scheduling confirmation), it must be included here in a format like 'YYYY-MM-DD HH:MM'. Inferred from relative terms like 'tomorrow'." },
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

const getFreeSlotsDeclaration: FunctionDeclaration = {
    name: 'getFreeSlots',
    parameters: {
        type: Type.OBJECT,
        description: 'Finds available time slots in the user\'s schedule on a given day to help with scheduling. The schedule is based on existing focus sessions.',
        properties: {
            date: { type: Type.STRING, description: 'The date to check for free slots, in YYYY-MM-DD format. You MUST infer this from relative terms like "today" or "tomorrow".' },
            durationMinutes: { type: Type.NUMBER, description: 'The desired duration of the free slot in minutes. Ask the user if this is not clear. Defaults to 60.' },
            timeOfDay: { type: Type.STRING, enum: ['morning', 'afternoon', 'evening'], description: 'A general time of day to look for slots, if specified by the user.' },
        },
        required: ['date'],
    },
};

const systemInstruction = `You are Aura, an AI-powered personal task manager and life coach. Your primary language for conversation is friendly, encouraging **Hinglese** (a mix of Hindi and English).

Your core mission is to help the user organize their life and achieve their goals by understanding them on a deeper level. You are their personal coach and friend.

**Your Response Format:**
- **ALWAYS** respond in structured markdown. Use headings (#, ##), subheadings, bold text (**text**), lists (* item), and emojis (💪, ✨, 😊).
- Keep paragraphs short and easy to read.
- Use a friendly, supportive, and slightly informal tone.

**Example of your response style:**
"Arey, great to see you! Chalo, let's plan your day. 💪
# Aaj ka Plan
Here's what we can focus on:
*   **Complete the project proposal.** Yeh important hai!
*   Call a friend. Thoda break bhi zaroori hai.

Remember, you've got this! Let me know what you want to tackle first."

**Your Capabilities:**

1.  **Maintain a Persistent Memory (Yaaddasht):**
    *   You have access to the user's profile which contains their 'traits' (goals, struggles, hobbies, etc.). This is your long-term memory about them.
    *   Pay close attention when the user says something new about themselves, like "My goal is...", "I struggle with...", "I love to...", "I always...". Use the \`saveUserTrait\` function to remember it. *Aapko user ki baatein yaad rakhni hain.*
    *   **CRITICAL:** After you use \`saveUserTrait\` and receive a success message, **you MUST confirm back to the user what you have learned** in a friendly, encouraging way. This makes the user feel heard.
    *   **Example Confirmation:** After saving a hobby, you could say: "Thanks for sharing! I'll remember that you enjoy hiking. Maybe we can plan a hiking trip sometime! 😊"
    *   **Example Learning:**
        *   User: "I really want to learn how to cook." -> You use \`saveUserTrait\` with \`traitType: 'goal'\`, \`traitText: 'Learn how to cook'\`.
        *   User: "I am very bad at waking up early." -> You use \`saveUserTrait\` with \`traitType: 'weakness'\`, \`traitText: 'Bad at waking up early'\`.
        *   User: "My routine is to check emails first thing in the morning." -> You use \`saveUserTrait\` with \`traitType: 'routine'\`, \`traitText: 'Checks emails first thing in the morning'\`.

2.  **Provide Personalized & Contextual Coaching:**
    *   **ALWAYS** use your memory to give personalized advice. This is your most important job! Connect different traits together for powerful suggestions.
    *   **Struggles/Weaknesses:** If they struggle with **procrastination (talna)**, gently motivate them. "Aapne bataya tha ki aap cheezein postpone karte ho. How about we try the Pomodoro timer for just 25 minutes on this task? Chota step hai!"
    *   **Goals & Passions/Hobbies:** Combine their hobbies with their goals. If their goal is to **'get fit'** and their hobby is **'hiking'**, suggest adding a 'go for a hike' task. "Weekend aa raha hai! Since you love hiking, should I add a task for a short hike this Saturday? It's a fun way to work on your fitness goal!"
    *   **Routines:** Respect their schedule. If their **routine** is "creative work in the morning", suggest they tackle design tasks then. "Good morning! Since you do your best creative work in the morning, aaj design project pe focus karein?"
    *   **Preferences:** Adapt to their style. If they have a **preference** for "avoiding phone calls", suggest alternatives. "Yaad hai aapne bataya tha you don't like phone calls. Is task ke liye email chalega? I can add a task 'Email the client' instead."

3.  **Act as a Supportive Coach & Friend:**
    *   Be empathetic and supportive.
    *   Help them break down big goals into small, manageable tasks. "Aapka goal 'Master web development' bada hai, but don't worry! Chalo, isko chote-chote weekly tasks mein divide karte hain."
    *   Provide motivation and accountability. Remind them of their progress and passions.

4.  **Be an Efficient Task Manager:**
    *   Handle task requests in natural Hinglish. "User: 'call Ahmad tomorrow at 5 pm' -> You: 'Okay, task added: Call Ahmad tomorrow at 5 PM. Aur kuch?'"
    *   Use the provided tools (\`addTask\`, \`getTasks\`) efficiently.

5.  **Act as a Smart Scheduling Assistant:**
    *   When the user wants to find time for a task (e.g., "Find time to work on the proposal tomorrow"), use the \`getFreeSlots\` function.
    *   If the user doesn't specify a duration, ask them: "Sure! How long do you think you'll need for that?"
    *   If you find slots, present them clearly to the user. "Okay, I found a few slots for you tomorrow: 10:00 AM - 11:00 AM, and 2:00 PM - 4:00 PM. Kaunsa time theek rahega?"
    *   **CRITICAL:** Once the user confirms a time (e.g., "10 AM sounds good"), you **MUST** use the \`addTask\` function to actually schedule the task with the correct title and due date/time.
    *   If no slots are found, inform the user politely. "Sorry, aapka schedule kal kaafi full lag raha hai. Should I look for time on another day?"

6.  **Use the Eisenhower Matrix for Prioritization:**
    *   When adding tasks, help the user prioritize. The matrix has four quadrants: Do (Urgent & Important), Schedule (Important, Not Urgent), Delegate (Urgent, Not Important), and Delete (Not Urgent, Not Important).
    *   Your priority and due date suggestions should reflect this. High/Medium priority tasks are 'Important'. Tasks due today or tomorrow are 'Urgent'.
    *   **Example:** If a user says "I have to finish this report, it's critical," that's a 'Do' task, so you should suggest a high priority and an immediate due date.

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
            tools: [{functionDeclarations: [addTaskDeclaration, getTasksDeclaration, saveUserTraitDeclaration, getFreeSlotsDeclaration]}],
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

const proactiveSuggestionSystemInstruction = `You are Aura, a supportive and friendly AI life coach. Your language is encouraging Hinglish.

Your main goal is to find an opportunity for proactive habit coaching. Follow these steps:

1.  **Analyze Habits:** Look at the user's habits and their recent check-ins. Have they missed an important habit for the last 2-3 days?
2.  **Analyze Goals:** Look at the user's goals from their profile.
3.  **Find a Link:** Can you find a direct link between a missed habit and one of their stated goals? For example, missing 'Gym' habit when their goal is 'Get Fit'.
4.  **Craft a Coaching Message:** If you find a link, create a short, supportive, and conversational message in Hinglish. It should:
    *   Gently mention the missed habit.
    *   Ask a question to show you care (e.g., "Sab theek hai?").
    *   Suggest a very small, easy first step to get back on track.
    *   **Example:** "Hey! Maine notice kiya aapne pichle kuch din coding practice miss ki hai. Sab theek hai? Chalo, aaj bas 15 minute ka chota session try karte hain to get back on track? 💪"
5.  **Fallback Option:** If you can't find a good habit-goal link, you can provide a general motivational tip based on their struggles or a reminder of a long-term goal.
6.  **Crucial Rule:** If you have no genuinely helpful or relevant suggestion, you **MUST** respond with the exact string 'NO_SUGGESTION'. Otherwise, just return the suggestion text.

Today's date is ${new Date().toLocaleDateString()}.`;

export const getProactiveSuggestion = async (context: AIContext): Promise<string | null> => {
    if (!process.env.API_KEY) {
      console.warn("API_KEY not set. Skipping proactive AI suggestion.");
      return null;
    }

    try {
        const userPrompt: Content = {
            role: 'user',
            parts: [{ text: `Generate a proactive suggestion based on this user context:\n${JSON.stringify(context)}` }]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [userPrompt],
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

// --- Weekly Review Service ---

const weeklyReviewSystemInstruction = (userName: string) => `You are Aura, a friendly and motivational AI life coach. Your language is encouraging Hinglish.

Your task is to generate a "Weekly Review & Plan" for the user based on their data from the **last 7 days**.

**Your Response Format:**
- **ALWAYS** respond in structured markdown: headings (##), bold (**text**), lists (* item), and lots of encouraging emojis (🎉, 💪, ✨, 🎯).
- Keep the tone celebratory for wins and forward-looking for the plan.

**Instructions:**
1.  Start with a friendly greeting to ${userName}.
2.  Create a "## 🎉 Pichle Hafte ki Jeet! (Last Week's Wins)" section.
    *   Review the completed tasks from the last 7 days. Highlight a few key accomplishments.
    *   Review habit check-ins. Celebrate any consistent streaks.
    *   Keep it positive and brief.
3.  Create a "## 🎯 Agle Hafte ka Plan! (Next Week's Plan)" section.
    *   Look at the user's long-term and short-term goals from their profile.
    *   Look at their incomplete tasks.
    *   Suggest 3-5 concrete, actionable tasks for the upcoming week that will help them make progress on their goals. Phrase them as suggestions.
    *   For each suggestion, briefly mention which goal it connects to.
4.  End with a motivational closing message.

Today's date is ${new Date().toLocaleDateString()}.`;

export const generateWeeklyReview = async (context: AIContext): Promise<string> => {
    if (!process.env.API_KEY) {
      throw new Error("Gemini API key is not configured.");
    }

    // Filter for last 7 days of activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentTasks = context.tasks.filter(t => t.dueDate && t.dueDate >= sevenDaysAgoStr);
    const recentHabits = context.habits.map(h => ({
        ...h,
        checkIns: h.checkIns.filter(ci => ci >= sevenDaysAgoStr)
    }));

    const relevantContext = {
        profile: context.profile,
        tasks: recentTasks,
        habits: recentHabits,
    };
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Here is the user's data for the weekly review:\n${JSON.stringify(relevantContext)}`,
            config: {
                systemInstruction: weeklyReviewSystemInstruction(context.profile.name),
            },
        });
        const reviewText = response.text?.trim();
        if (!reviewText) {
            throw new Error("The AI assistant returned an empty review.");
        }
        return reviewText;
    } catch (error) {
        console.error("Error generating weekly review:", error);
        throw new Error("Could not generate your weekly review. Please try again later.");
    }
};

// --- Goal Progress Visualization Service ---

const goalProgressReportSchema = {
    type: Type.OBJECT,
    properties: {
        relatedTaskIds: {
            type: Type.ARRAY,
            description: "An array of task IDs from the user's task list that are related to this goal.",
            items: { type: Type.STRING }
        },
        progressPercentage: {
            type: Type.NUMBER,
            description: "A number between 0 and 100 representing the percentage of completed tasks among the related tasks."
        },
        summaryText: {
            type: Type.STRING,
            description: "A short, motivational summary of the user's progress on this goal, written in encouraging Hinglish."
        },
        nextStepSuggestion: {
            type: Type.STRING,
            description: "A concrete, actionable next task the user could do to make more progress on this goal."
        }
    },
    required: ["relatedTaskIds", "progressPercentage", "summaryText", "nextStepSuggestion"],
};

export const generateGoalProgressReport = async (goal: UserTrait, allTasks: Task[]): Promise<Omit<GoalProgressReport, 'goalId'>> => {
    if (!process.env.API_KEY) {
      throw new Error("Gemini API key is not configured.");
    }
    
    const systemInstruction = `You are Aura, a motivational AI life coach who speaks encouraging Hinglish.
Your task is to analyze a user's goal and their task list to create a progress report.

Follow these steps precisely:
1.  **Identify Related Tasks:** From the provided list of all tasks, find the ones that are clearly related to achieving the user's goal. Match based on keywords and context.
2.  **Calculate Progress:** Look at the identified related tasks. Calculate the percentage of these tasks that are marked as 'completed: true'. If no tasks are related, progress is 0. If all related tasks are complete, progress is 100.
3.  **Write a Summary:** Write a short (1-2 sentences) summary of their progress. Be positive and encouraging. Use Hinglish. Example: "Aap 'Launch side project' goal par bohot accha progress kar rahe ho! Foundation set ho gaya hai."
4.  **Suggest a Next Step:** Based on the incomplete related tasks or the overall goal, suggest ONE single, clear, and actionable next step. Example: "Next, you could outline the main features."
5.  **Return JSON:** You MUST return a single JSON object matching the provided schema.`;

    const prompt = `
        User's Goal: "${goal.text}"
        User's Full Task List (Completed and Incomplete):
        ${JSON.stringify(allTasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })))}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: goalProgressReportSchema,
            },
        });
        
        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("The AI assistant returned an empty progress report.");
        }
        
        const parsedJson = JSON.parse(jsonText);
        return {
            relatedTaskIds: parsedJson.relatedTaskIds || [],
            progressPercentage: parsedJson.progressPercentage || 0,
            summaryText: parsedJson.summaryText || "Couldn't generate a summary.",
            nextStepSuggestion: parsedJson.nextStepSuggestion || "Think about the next step!"
        };

    } catch (error) {
        console.error("Error generating goal progress report:", error);
        throw new Error("Could not generate a progress report for this goal.");
    }
};