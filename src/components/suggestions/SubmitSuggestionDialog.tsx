"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Suggestion, SuggestionCategories } from "@/lib/types";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

const formSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters.").max(100, "Title cannot exceed 100 characters."),
  body: z.string().min(50, "Suggestion body must be at least 50 characters."),
  category: z.enum(SuggestionCategories),
  isAnonymous: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface SubmitSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (suggestion: Omit<Suggestion, 'suggestionId' | 'upvotesCount' | 'commentsCount'>) => void;
}

export function SubmitSuggestionDialog({ open, onOpenChange, onSubmit }: SubmitSuggestionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      body: "",
      isAnonymous: false,
    },
  });

  const handleFormSubmit = (values: FormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be signed in to submit a suggestion.",
      });
      return;
    }

    const newSuggestion: Omit<Suggestion, 'suggestionId' | 'upvotesCount' | 'commentsCount'> = {
      title: values.title,
      body: values.body,
      category: values.category,
      authorUid: values.isAnonymous ? 'ANONYMOUS' : user.uid,
      authorDisplayName: values.isAnonymous ? 'Anonymous' : user.displayName || 'User',
      authorPhotoURL: values.isAnonymous ? findImage('anonymous-avatar') : user.photoURL,
      status: 'SUBMITTED',
      submissionTimestamp: new Date(),
      impactScore: 0,
      feasibilityRating: 0,
      costEffectivenessRating: 0,
    };
    
    onSubmit(newSuggestion);
    toast({
        title: "Suggestion Submitted!",
        description: "Thank you for your contribution to improving our community.",
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Submit a New Suggestion</DialogTitle>
          <DialogDescription>
            Share your idea to improve our engineering community. Please be detailed and constructive.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suggestion Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Upgrade University Wi-Fi Infrastructure" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suggestion Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your suggestion in detail. What is the problem, and how does your idea solve it?"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a relevant category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SuggestionCategories.map(cat => (
                        <SelectItem key={cat} value={cat} className="capitalize">
                          {cat.replace(/_/g, " ").toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Submit Anonymously</FormLabel>
                    <FormDescription>
                      If checked, your name will not be publicly associated with this suggestion.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Submit Suggestion</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
