"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/components/auth/AuthContext';
import { Send } from 'lucide-react';

const formSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty.').max(500, 'Comment is too long.'),
});

type FormValues = z.infer<typeof formSchema>;

interface AddCommentFormProps {
  onSubmit: (body: string) => void;
}

export default function AddCommentForm({ onSubmit }: AddCommentFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { body: '' },
  });

  const handleFormSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    onSubmit(values.body);
    form.reset();
    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <div className="p-4 border rounded-lg text-center bg-muted">
        <p className="text-sm text-muted-foreground">You must be logged in to post a comment.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Share your thoughts..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
