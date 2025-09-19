"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCursor } from "@/components/ui/animated-cursor";
import { ParticleBackground } from "@/components/ui/particle-background";
import { ScrollAnimation } from "@/components/ui/scroll-animation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, UserPlus, User, Phone } from "lucide-react";
import { useSignUpMutation } from "@/lib/api";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [signUp, { isLoading, error }] = useSignUpMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (!formData.agreeToTerms) {
      alert("Please agree to the terms and conditions!");
      return;
    }
    
    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || undefined,
      }).unwrap();
      // Store token and redirect
      localStorage.setItem('auth_token', result.token);
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Signup failed:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <AnimatedCursor>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <ParticleBackground />
        
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SM</span>
              </div>
              <span className="font-bold text-xl">SeatMaster</span>
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="min-h-screen flex items-center justify-center pt-24 px-4 py-8">
          <div className="w-full max-w-lg">
            <ScrollAnimation direction="up" distance={100} delay={0}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-sm font-medium text-primary">Join SeatMaster</span>
                </div>
                <h1 className="text-4xl font-bold mb-4">
                  Create your{" "}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    account
                  </span>
                </h1>
                <p className="text-muted-foreground">
                  Start managing your events like a professional
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation direction="up" distance={80} delay={200}>
              <Card className="relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse"></div>
                  <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-gradient-to-r from-secondary to-accent animate-pulse delay-1000"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-accent to-primary animate-pulse delay-500"></div>
                </div>

                <CardHeader className="relative z-10 pb-6">
                  <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
                  <CardDescription className="text-center">
                    Fill in your details to create your account
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium">
                          First Name
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          </div>
                          <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 bg-background border-2 border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-primary/50"
                            placeholder="John"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm font-medium">
                          Last Name
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          </div>
                          <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 bg-background border-2 border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-primary/50"
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-background border-2 border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-primary/50"
                          placeholder="john.doe@example.com"
                        />
                      </div>
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-background border-2 border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-primary/50"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-12 py-3 bg-background border-2 border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-primary/50"
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirm Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-12 py-3 bg-background border-2 border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-primary/50"
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Terms Agreement */}
                    <div className="flex items-start space-x-3">
                      <input
                        id="agreeToTerms"
                        name="agreeToTerms"
                        type="checkbox"
                        required
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        className="mt-1 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <label htmlFor="agreeToTerms" className="text-sm text-muted-foreground cursor-pointer">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 text-lg font-medium hover:scale-105 transition-transform duration-300 hover:shadow-lg"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  {/* Social Signup */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="hover:scale-105 transition-transform duration-300">
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" className="hover:scale-105 transition-transform duration-300">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </Button>
                  </div>

                  {/* Login Link */}
                  <div className="text-center mt-6">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="text-primary hover:underline font-medium transition-colors"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </div>
    </AnimatedCursor>
  );
}
