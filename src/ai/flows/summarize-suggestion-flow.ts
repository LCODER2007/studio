
'use server';
/**
 * @fileOverview A Genkit flow for summarizing a suggestion.
 * 
 * - summarizeSuggestion - A function that takes a suggestion's title and body and returns a concise summary.
 * - SummarizeSuggestionInputSchema - The Zod schema for the input.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SummarizeSuggestionInputSchema = z.object({
  title: z.string().describe("The title of the suggestion."),
  body: z.string().describe("The detailed body of the suggestion."),
});

// The main exported function that clients will call.
export async function summarizeSuggestion(input: z.infer<typeof SummarizeSuggestionInputSchema>): Promise<string> {
  return summarizeSuggestionFlow(input);
}

// Define the prompt for the AI model.
const summaryPrompt = ai.definePrompt({
    name: 'summarizeSuggestionPrompt',
    input: { schema: SummarizeSuggestionInputSchema },
    output: { format: 'text' },
    prompt: `You are an expert analyst. Summarize the following suggestion into a single, concise paragraph. Focus on the core problem and the proposed solution.
    
    Title: {{{title}}}
    
    Suggestion Body:
    {{{body}}}
    
    Summary:
    `,
});

// Define the Genkit flow.
const summarizeSuggestionFlow = ai.defineFlow(
  {
    name: 'summarizeSuggestionFlow',
    inputSchema: SummarizeSuggestionInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await summaryPrompt(input);
    return output || "Could not generate a summary.";
  }
);
