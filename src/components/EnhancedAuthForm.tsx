import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { FadeIn } from './AnimationComponents';
import { useAccessibility } from '@/hooks/useAccessibility';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

interface EnhancedAuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: AuthFormData) => Promise<void>;
  isLoading?: boolean;
}

export const EnhancedAuthForm: React.FC<EnhancedAuthFormProps> = ({
  mode,
  onSubmit,
  isLoading = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { announceMessage } = useAccessibility();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    watch
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    mode: 'onChange'
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  const handleFormSubmit = async (data: AuthFormData) => {
    try {
      await onSubmit(data);
      announceMessage(`Successfully ${mode === 'login' ? 'logged in' : 'registered'}`);
      toast({
        title: "Success",
        description: `Successfully ${mode === 'login' ? 'logged in' : 'registered'}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      announceMessage(`Error: ${errorMessage}`, 'assertive');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength] || 'Very Weak';
    return { strength, text: strengthText };
  };

  const passwordStrength = getPasswordStrength(watchedPassword || '');

  return (
    <FadeIn>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className={`
                    pr-10
                    ${errors.email ? 'border-red-500 focus:border-red-500' : ''}
                    ${touchedFields.email && !errors.email ? 'border-green-500' : ''}
                  `}
                  {...register('email')}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {touchedFields.email && !errors.email && watchedEmail && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`
                    pr-10
                    ${errors.password ? 'border-red-500 focus:border-red-500' : ''}
                    ${touchedFields.password && !errors.password ? 'border-green-500' : ''}
                  `}
                  {...register('password')}
                  aria-describedby={errors.password ? 'password-error' : 'password-help'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {mode === 'register' && watchedPassword && (
                <div className="space-y-1">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength.strength ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    Password strength: {passwordStrength.text}
                  </p>
                </div>
              )}
              
              {errors.password && (
                <p id="password-error" className="text-sm text-red-500" role="alert">
                  {errors.password.message}
                </p>
              )}
              
              {!errors.password && mode === 'register' && (
                <p id="password-help" className="text-xs text-gray-600">
                  Password must be at least 8 characters long
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={!isValid || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading 
                ? `${mode === 'login' ? 'Signing In' : 'Creating Account'}...` 
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
};