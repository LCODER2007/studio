
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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

interface EditSuggestionSheetProps {
  suggestion: Suggestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (suggestion: Suggestion) => void;
}

const formSchema = z.object({
  status: z.enum(SuggestionStatuses),
  impactScore: z.number().min(1).max(5),
  feasibilityRating: z.number().min(1).max(5),
  costEffectivenessRating: z.number().min(1).max(5),
});

type FormValues = z.infer<typeof formSchema>;

export function EditSuggestionSheet({ suggestion, open, onOpenChange, onUpdate }: EditSuggestionSheetProps) {
    const { toast } = useToast();
    const { role } = useAuth();
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    const availableStatuses = role === 'SUPER_ADMIN' 
        ? SuggestionStatuses 
        : SuggestionStatuses.filter(s => s !== 'IMPLEMENTED');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (suggestion) {
            form.reset({
                status: suggestion.status,
                impactScore: suggestion.impactScore || 1,
                feasibilityRating: suggestion.feasibilityRating || 1,
                costEffectivenessRating: suggestion.costEffectivenessRating || 1,
            });
            setSummary(null); // Reset summary when suggestion changes
        }
    }, [suggestion, form]);

    if (!suggestion) return null;

    const handleFormSubmit = (values: FormValues) => {
        const updatedSuggestion = { ...suggestion, ...values };
        onUpdate(updatedSuggestion);

        toast({
            title: "Suggestion Updated",
            description: `"${suggestion.title}" has been updated successfully.`,
        });

        if ((suggestion.status !== 'SHORTLISTED' && values.status === 'SHORTLISTED') || (suggestion.status !== 'IMPLEMENTED' && values.status === 'IMPLEMENTED')) {
            toast({
                title: "Notifications Sent!",
                description: `Authors and voters have been notified about the status change.`,
                variant: 'default'
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
                            Update the status and evaluation scores for: "{suggestion.title}"
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
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableStatuses.map(status => (
                                                    <SelectItem key={status} value={status} className="capitalize">{status.replace(/_/g, " ").toLowerCase()}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
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
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <SheetFooter className="mt-8 sticky bottom-0 bg-background py-4">
                                <SheetClose asChild>
                                    <Button type="button" variant="ghost">Cancel</Button>
                                </SheetClose>
                                <Button type="submit">Save Changes</Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
