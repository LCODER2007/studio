
"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Suggestion, SuggestionStatuses } from "@/lib/types";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../auth/AuthContext";
import { summarizeSuggestion } from "@/ai/flows/summarize-suggestion-flow";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { retryWithBackoff, getFirebaseErrorMessage } from "@/lib/retry-utils";

interface EditSuggestionSheetProps {
  suggestion: Suggestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (suggestion: Suggestion) => void;
}

const formSchema = z.object({
  impactScore: z.number().min(1, "Impact score must be at least 1").max(5, "Impact score cannot exceed 5"),
  feasibilityRating: z.number().min(1, "Feasibility rating must be at least 1").max(5, "Feasibility rating cannot exceed 5"),
  costEffectivenessRating: z.number().min(1, "Cost-effectiveness rating must be at least 1").max(5, "Cost-effectiveness rating cannot exceed 5"),
  status: z.enum(SuggestionStatuses),
  publicFeedback: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EditSuggestionSheet({ suggestion, open, onOpenChange, onUpdate }: EditSuggestionSheetProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const firestore = useFirestore();
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (suggestion) {
            form.reset({
                impactScore: suggestion.impactScore || 1,
                feasibilityRating: suggestion.feasibilityRating || 1,
                costEffectivenessRating: suggestion.costEffectivenessRating || 1,
                status: suggestion.status,
                publicFeedback: suggestion.publicFeedback || "",
            });
            setSummary(null); // Reset summary when suggestion changes
        }
    }, [suggestion, form]);

    if (!suggestion) return null;

    const handleFormSubmit = async (values: FormValues) => {
        if (!firestore || !user) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Unable to update suggestion. Please try again.",
            });
            return;
        }

        // Update the suggestion with new values and reviewer UID
        const updatedSuggestion: Suggestion = { 
            ...suggestion, 
            ...values,
            reviewerUid: user.uid,
        };

        const updateData = {
            impactScore: values.impactScore,
            feasibilityRating: values.feasibilityRating,
            costEffectivenessRating: values.costEffectivenessRating,
            status: values.status,
            publicFeedback: values.publicFeedback || "",
            reviewerUid: user.uid,
        };

        try {
            // Persist changes to Firestore with retry logic
            const suggestionRef = doc(firestore, 'suggestions', suggestion.suggestionId);
            
            await retryWithBackoff(async () => {
                await updateDocumentNonBlocking(suggestionRef, updateData);
            });

            // Call the onUpdate callback for optimistic UI update
            onUpdate(updatedSuggestion);

            toast({
                title: "Suggestion Updated",
                description: `"${suggestion.title}" has been updated successfully.`,
            });

            // Close the sheet
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to update suggestion:', error);
            
            const errorMessage = getFirebaseErrorMessage(error);
            
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: errorMessage,
            });
        }
    };
    
    const handleSummarize = async () => {
        setIsSummarizing(true);
        setSummary(null);
        try {
            const result = await summarizeSuggestion({
                title: suggestion.title,
                body: suggestion.body,
            });
            setSummary(result);
        } catch (error) {
            console.error("Error summarizing suggestion:", error);
            toast({
                variant: "destructive",
                title: "Summarization Failed",
                description: "Could not generate a summary. Please try again.",
            });
        } finally {
            setIsSummarizing(false);
        }
    };


    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg">
                <ScrollArea className="h-full pr-6">
                    <SheetHeader>
                        <SheetTitle>Review Suggestion</SheetTitle>
                        <SheetDescription>
                            Update the evaluation scores for: "{suggestion.title}"
                        </SheetDescription>
                    </SheetHeader>
                    
                    {summary && (
                        <div className="mt-6 space-y-2 rounded-md border bg-muted/50 p-4">
                            <h4 className="font-semibold text-sm">AI Summary</h4>
                            <p className="text-sm text-muted-foreground">{summary}</p>
                        </div>
                    )}
                    
                    <div className="my-4">
                        <Button onClick={handleSummarize} disabled={isSummarizing} variant="outline" size="sm" className="w-full">
                            {isSummarizing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Summarizing...</> : "✨ Generate AI Summary"}
                        </Button>
                    </div>

                    <Separator className="my-6" />

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
                            
                            <div className="space-y-6 rounded-md border p-4">
                                <h4 className="text-sm font-medium">Evaluation Scores</h4>
                                <FormField
                                    control={form.control}
                                    name="impactScore"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between items-center">
                                                <FormLabel>Impact</FormLabel>
                                                <span className="text-sm font-bold w-4">{field.value}</span>
                                            </div>
                                            <FormControl>
                                                <Slider defaultValue={[field.value]} min={1} max={5} step={1} onValueChange={(value) => field.onChange(value[0])} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="feasibilityRating"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between items-center">
                                                <FormLabel>Feasibility</FormLabel>
                                                <span className="text-sm font-bold w-4">{field.value}</span>
                                            </div>
                                            <FormControl>
                                                <Slider defaultValue={[field.value]} min={1} max={5} step={1} onValueChange={(value) => field.onChange(value[0])} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="costEffectivenessRating"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between items-center">
                                                <FormLabel>Cost-Effectiveness</FormLabel>
                                                <span className="text-sm font-bold w-4">{field.value}</span>
                                            </div>
                                            <FormControl>
                                                <Slider defaultValue={[field.value]} min={1} max={5} step={1} onValueChange={(value) => field.onChange(value[0])} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {SuggestionStatuses.map(status => (
                                                        <SelectItem key={status} value={status}>
                                                            {status.replace(/_/g, ' ')}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Changing to SHORTLISTED or IMPLEMENTED will trigger notifications
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="publicFeedback"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Public Feedback</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Provide feedback that will be visible to the suggestion author and voters..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                This feedback will be visible to users when viewing the suggestion
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <SheetFooter className="mt-8 sticky bottom-0 bg-background py-4">
                                <SheetClose asChild>
                                    <Button type="button" variant="ghost">Cancel</Button>
                                </SheetClose>
                                <Button type="submit" variant="accent">Save Changes</Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
