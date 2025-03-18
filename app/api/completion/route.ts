import OpenAI from 'openai';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

// Helper function to log requests and responses
function logOpenAI(type: string, data: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] OpenAI ${type}:`);
  console.log(JSON.stringify(data, null, 2));
  console.log('-----------------------------------');
}

// Function to validate if the prompt is related to cron expressions using GPT
async function validateWithGPT(prompt: string): Promise<{ isValid: boolean; reason: string; isNonsensical: boolean }> {
  try {
    const messages = [
      {
        role: "system" as const,
        content: `You are a validator that determines if a user's prompt is related to generating cron expressions or scheduling tasks.
        
        Return a JSON object with three fields:
        1. "isValid": boolean - true if the prompt is asking about creating a cron expression or scheduling, false otherwise. It should also be
        false if the prompt is asking to generate an invalid cron expression.
        2. "reason": string - a brief explanation of your decision
        3. "isNonsensical": boolean - true if the prompt is nonsensical, humorous, or unrelated to scheduling but could be interpreted in a fun way
        (like "how many cups?", "when pigs fly", "are you a squirrel?", etc.), false otherwise
        
        Examples of valid prompts:
        - "I need a cron job that runs every day at midnight"
        - "every 15 minutes"
        - "Every year"
        
        Examples of nonsensical prompts that should have isNonsensical = true:
        - "how many cups?"
        - "when pigs fly"
        - "on the 12th of never"
        - "are you a squirrel?"
        - "what's your favorite color?"
        
        Examples of invalid prompts that are NOT nonsensical (isNonsensical = false):
        - "What's the weather like today?"
        - "Write me a poem about cats"
        - "How do I make chocolate chip cookies?"
        `
      },
      {
        role: "user" as const,
        content: prompt
      }
    ];

    // Log the validation request
    logOpenAI('Validation Request', { prompt, messages });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages
    });

    // Log the validation response
    logOpenAI('Validation Response', response);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { isValid: false, reason: "Failed to validate the prompt", isNonsensical: false };
    }

    try {
      // Parse the JSON response
      const validation = JSON.parse(content);
      return {
        isValid: validation.isValid,
        reason: validation.reason,
        isNonsensical: validation.isNonsensical || false
      };
    } catch (error) {
      console.error("Error parsing validation response:", error);
      // If parsing fails, default to allowing the prompt
      return { isValid: true, reason: "Validation parsing failed, allowing by default", isNonsensical: false };
    }
  } catch (error) {
    console.error("Error validating with GPT:", error);
    // If validation fails, default to allowing the prompt
    return { isValid: true, reason: "Validation failed, allowing by default", isNonsensical: false };
  }
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    console.log(`[${new Date().toISOString()}] Received prompt: "${prompt}"`);
    
    // Validate that the prompt is provided
    if (!prompt || typeof prompt !== 'string') {
      console.log(`[${new Date().toISOString()}] Invalid prompt format`);
      return Response.json({ error: "Prompt is required and must be a string" }, { status: 400 });
    }
    
    // Validate that the prompt is related to cron expressions using GPT
    const validation = await validateWithGPT(prompt);
    console.log(`[${new Date().toISOString()}] Validation result:`, validation);
    
    // Allow nonsensical prompts to proceed, but reject non-cron related prompts that aren't nonsensical
    if (!validation.isValid && !validation.isNonsensical) {
      return Response.json({ 
        error: "Your prompt doesn't seem to be about scheduling or cron expressions. " + validation.reason
      }, { status: 400 });
    }

    // If the prompt is nonsensical but not valid, we'll treat it as nonsensical
    const isNonsensical = validation.isNonsensical || !validation.isValid;

    // Choose the appropriate system prompt based on whether the input is nonsensical
    const systemPrompt = isNonsensical
      ? `The user has provided a nonsensical or humorous scheduling request.
         Your goal is to:
         - Generate an equally ridiculous but valid cron expression that somehow relates to their request.
         - The cron expression must be valid syntax but can use unusual or extreme values.
         - Add a brief humorous comment after the cron expression.
         - Format your response as: "CRON_EXPRESSION # funny comment"
         
         Examples:
         - For "how many cups?": "42 * * * * # One cup for each meaning of life, every minute"
         - For "when pigs fly": "0 0 31 2 * # Only on February 31st, when pigs get their pilot licenses"
         - For "on the 12th of never": "0 0 0 0 0 # This will run precisely never, as requested"`
      : `Below is text describing a cron expression.
         Your goal is to:
         - Convert the text to a valid cron expression.
         - The cron expression you generate must match this regular expression: "^((\*|[0-9]|[1-5][0-9]|60) |(\*|[0-9]|[1-5][0-9]|60) |(\*|[0-9]|[1-2][0-9]|3[0-1]) |(\*|[0-9]|[1-9]|[1-2][0-9]|3[0-1]|4[0-6]|5[0-3]) |(\*|[0-9]|[1-9]|1[0-2]))(\*|\/[0-9]|[0-9\-,\/]+) (\*|\/[0-9]|[0-9\-,\/]+) (\*|\/[0-9]|[0-9\-,\/]+) (\*|\/[0-9]|[0-9\-,\/]+) (\*|\/[0-9]|[0-9\-,\/]+)$"
         - Return only the generated cron expression and nothing else.
         Here are some examples:
         - Text: A cron that runs every hour
         - Cron: 0 * * * *
         - Text: A cron that runs ever 12 hour
         - Cron: 0 */12 * * *`;

    const messages = [
      {
        role: "system" as const, 
        content: systemPrompt
      },
      { 
        role: "user" as const, 
        content: prompt 
      }
    ];

    // Log the generation request
    logOpenAI('Generation Request', {
      prompt,
      isNonsensical,
      temperature: isNonsensical ? 0.9 : 0,
      messages
    });

    // Request the OpenAI API for the response without streaming
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: isNonsensical ? 0.9 : 0, // Higher temperature for nonsensical responses
      messages
    });

    // Log the generation response
    logOpenAI('Generation Response', response);

    // Validate the response
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      console.log(`[${new Date().toISOString()}] Failed to generate content`);
      return Response.json({ error: "Failed to generate a cron expression" }, { status: 500 });
    }

    console.log(`[${new Date().toISOString()}] Generated cron expression: "${content}"`);

    // Create a response message based on whether the prompt was nonsensical
    const responseMessage = isNonsensical 
      ? "Your request was a bit unusual, but I've created a whimsical cron expression for you anyway!" 
      : "Here's your cron expression:";

    // Return just the content as a regular JSON response
    return Response.json({ 
      completion: content,
      isNonsensical,
      message: responseMessage
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing request:`, error);
    return Response.json({ 
      error: "An error occurred while processing your request" 
    }, { status: 500 });
  }
}
