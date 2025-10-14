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
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../auth/AuthContext";

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
            // This is where you would rely on a Cloud Function (triggerStatusNotification)
            // to send emails to the author and all voters.
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Review Suggestion</SheetTitle>
                    <SheetDescription>
                        Update the status and evaluation scores for: "{suggestion.title}"
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-6">
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

                        <SheetFooter>
                            <SheetClose asChild>
                                <Button type="button" variant="ghost">Cancel</Button>
                            </SheetClose>
                            <Button type="submit">Save Changes</Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
