'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// In-memory count of cron expressions generated
let cronExpressionsGenerated = 100

// Helper function to get the base URL
function getBaseUrl() {
  // In production, use Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // In development, use a hardcoded URL that matches the current server
  // This should be updated if the port changes
  return 'http://localhost:3000'
}

// Schema for the form data
const FormSchema = z.object({
  prompt: z.string().min(1, {
    message: 'Please enter a prompt',
  }),
})

// Type for the response from the API
interface ApiResponse {
  completion?: string
  error?: string
  isNonsensical?: boolean
  message?: string
}

// Type for the return value of the generateCronExpression function
export type GenerateCronState = {
  success: boolean
  message: string
  count?: number
  cronExpression?: string
  isNonsensical?: boolean
  responseMessage?: string
}

// Helper function for logging
function logAction(step: string, data: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Action - ${step}:`);
  console.log(JSON.stringify(data, null, 2));
  console.log('-----------------------------------');
}

export async function generateCronExpression(
  prevState: GenerateCronState | null,
  formData: FormData,
): Promise<GenerateCronState> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Starting cron expression generation`);
  
  // Log the form data
  const formDataObj: Record<string, any> = {};
  formData.forEach((value, key) => {
    formDataObj[key] = value.toString();
  });
  logAction('Form Data', formDataObj);
  
  // Validate the form data
  const validatedFields = FormSchema.safeParse({
    prompt: formData.get('prompt'),
  })

  // Return error if validation fails
  if (!validatedFields.success) {
    const errors = validatedFields.error.format();
    logAction('Validation Error', errors);
    return {
      success: false,
      message: 'Invalid prompt. Please try again.',
    }
  }

  try {
    const prompt = validatedFields.data.prompt
    const baseUrl = getBaseUrl()
    
    console.log(`[${timestamp}] Using base URL: ${baseUrl}`);
    console.log(`[${timestamp}] Sending prompt: "${prompt}"`);

    // Prepare the request
    const requestBody = { prompt: prompt.toString() };
    logAction('API Request', {
      url: `${baseUrl}/api/completion`,
      method: 'POST',
      body: requestBody
    });

    // Call the API to generate the cron expression
    const response = await fetch(`${baseUrl}/api/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // Log the response status
    console.log(`[${timestamp}] API response status: ${response.status}`);
    
    // Parse the response
    const data: ApiResponse = await response.json()
    logAction('API Response', data);

    // Check for errors
    if (data.error || !data.completion) {
      console.log(`[${timestamp}] Error in API response: ${data.error || 'No completion returned'}`);
      return {
        success: false,
        message: data.error || 'Failed to generate cron expression',
      }
    }

    // Increment the count
    cronExpressionsGenerated++
    console.log(`[${timestamp}] Incremented count to: ${cronExpressionsGenerated}`);
    console.log(`[${timestamp}] Generated cron expression: "${data.completion}"`);
    console.log(`[${timestamp}] Is nonsensical: ${data.isNonsensical ? 'Yes' : 'No'}`);

    // Revalidate the path
    revalidatePath('/')

    // Return success
    const result = {
      success: true,
      message: 'Cron expression generated!',
      count: cronExpressionsGenerated,
      cronExpression: data.completion,
      isNonsensical: data.isNonsensical || false,
      responseMessage: data.message
    };
    
    logAction('Result', result);
    return result;
  } catch (error) {
    console.error(`[${timestamp}] Error generating cron expression:`, error);
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    }
  }
}

export async function getCronGenerationCount() {
  return cronExpressionsGenerated;
}
