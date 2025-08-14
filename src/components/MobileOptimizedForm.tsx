import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';

const mobileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  purpose: z.string().min(3, 'Purpose must be at least 3 characters'),
});

type MobileFormData = z.infer<typeof mobileFormSchema>;

interface MobileOptimizedFormProps {
  onSubmit: (data: MobileFormData) => Promise<void>;
  isLoading?: boolean;
}

export const MobileOptimizedForm: React.FC<MobileOptimizedFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<MobileFormData>({
    resolver: zodResolver(mobileFormSchema),
    mode: 'onChange'
  });

  const handleFormSubmit = async (data: MobileFormData) => {
    try {
      await onSubmit(data);
      toast({
        title: "Success",
        description: "Form submitted successfully",
      });
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Visitor Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              className="text-16px" // Prevents zoom on iOS
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="text-16px"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              className="text-16px"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Visit Purpose</Label>
            <Input
              id="purpose"
              type="text"
              placeholder="Reason for visit"
              className="text-16px"
              {...register('purpose')}
            />
            {errors.purpose && (
              <p className="text-sm text-red-500">{errors.purpose.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};