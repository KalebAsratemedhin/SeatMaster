import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCursor } from "@/components/ui/animated-cursor";
import { ScrollAnimation } from "@/components/ui/scroll-animation";
import { FloatingElement } from "@/components/ui/floating-elements";
import { ParticleBackground } from "@/components/ui/particle-background";
import { EventTypeShowcase } from "@/components/ui/event-type-showcase";
import { HeroFloatingElements } from "@/components/ui/hero-floating-elements";
import { FeaturesCarousel } from "@/components/ui/features-carousel";
import { Rocket, Calendar, Palette, BookOpen, MessageCircle, Shield } from "lucide-react";

export default function Home() {
  return (
    <AnimatedCursor>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <ParticleBackground />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SM</span>
            </div>
            <span className="font-bold text-xl">SeatMaster</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#use-cases" className="text-sm font-medium hover:text-primary transition-colors">Use Cases</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-24 px-4 relative">
        <HeroFloatingElements />
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <ScrollAnimation direction="up" distance={100} delay={0}>
              <FloatingElement speed={0.5} amplitude={5}>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                  Transform Your Event Management with{" "}
                  <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    SeatMaster
                  </span>
                </h1>
              </FloatingElement>
            </ScrollAnimation>
            
            <ScrollAnimation direction="up" distance={80} delay={200}>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                The all-in-one platform for managing events, guests, RSVPs, and seating arrangements. 
                From intimate gatherings to large conferences, make every event unforgettable.
              </p>
            </ScrollAnimation>
            
            <ScrollAnimation direction="up" distance={60} delay={400}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 hover:scale-105 transition-transform duration-300 hover:shadow-lg"
                >
                  Start Your Free Trial
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6 hover:scale-105 transition-transform duration-300 hover:shadow-lg"
                >
                  Watch Demo
                </Button>
              </div>
            </ScrollAnimation>
            
            <ScrollAnimation direction="up" distance={40} delay={600}>
              <p className="text-sm text-muted-foreground mt-4">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Features Carousel */}
      <FeaturesCarousel />

      {/* Event Types Showcase */}
      <EventTypeShowcase />

      {/* Testimonials Section */}
      <section className="min-h-screen flex items-center justify-center py-20 px-4 bg-muted/50 relative">
        <div className="container mx-auto">
          <ScrollAnimation direction="up" distance={80} delay={0}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trusted by Event Organizers Worldwide
              </h2>
              <p className="text-xl text-muted-foreground">
                See what our customers have to say about SeatMaster
              </p>
            </div>
          </ScrollAnimation>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollAnimation direction="up" distance={60} delay={100}>
              <Card className="hover:scale-105 transition-all duration-300 hover:shadow-xl">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">
                    "SeatMaster transformed our wedding planning. The seating arrangements were perfect, and our guests loved the digital invitations."
                  </p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold">SM</span>
                    </div>
                    <div>
                      <p className="font-semibold">Sarah & Michael</p>
                      <p className="text-sm text-muted-foreground">Wedding Couple</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation direction="up" distance={60} delay={200}>
              <Card className="hover:scale-105 transition-all duration-300 hover:shadow-xl">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">
                    "Managing our annual conference became effortless. The guest management and real-time updates saved us hours of work."
                  </p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold">JD</span>
                    </div>
                    <div>
                      <p className="font-semibold">Jennifer Davis</p>
                      <p className="text-sm text-muted-foreground">Event Coordinator</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation direction="up" distance={60} delay={300}>
              <Card className="hover:scale-105 transition-all duration-300 hover:shadow-xl">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-4">
                    "The analytics and insights helped us optimize our events. We've seen a 40% increase in guest satisfaction."
                  </p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold">RC</span>
                    </div>
                    <div>
                      <p className="font-semibold">Robert Chen</p>
                      <p className="text-sm text-muted-foreground">Event Manager</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-gradient-to-r from-secondary to-accent animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-r from-accent to-primary animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimation direction="up" distance={100} delay={0}>
              <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-8">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm font-medium text-primary">Get Started Today</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-8">
                Ready to Transform Your{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Events?
                </span>
              </h2>
            </ScrollAnimation>
            
            <ScrollAnimation direction="up" distance={80} delay={200}>
              <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands of event organizers who trust SeatMaster to make their events unforgettable. 
                Start your free trial today and experience the difference professional event management makes.
              </p>
            </ScrollAnimation>
            
            <ScrollAnimation direction="up" distance={60} delay={400}>
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Button 
                  size="lg" 
                  className="text-lg px-12 py-8 hover:scale-105 transition-transform duration-300 hover:shadow-2xl hover:shadow-primary/20 bg-gradient-to-r from-primary to-primary/90"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-12 py-8 hover:scale-105 transition-transform duration-300 hover:shadow-2xl border-2 hover:border-primary/50"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Demo
                </Button>
              </div>
            </ScrollAnimation>

            {/* Pricing Preview */}
            <ScrollAnimation direction="up" distance={60} delay={600}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:scale-105">
                  <div className="text-3xl font-bold text-primary mb-2">Free</div>
                  <div className="text-muted-foreground mb-4">Perfect for small events</div>
                  <ul className="text-sm space-y-2 text-left">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Up to 50 guests</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Basic seating charts</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>RSVP tracking</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border-2 border-primary/50 hover:scale-105 transition-all duration-300 relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">Pro</div>
                  <div className="text-muted-foreground mb-4">For growing events</div>
                  <ul className="text-sm space-y-2 text-left">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Up to 500 guests</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>AI-powered seating</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-border hover:border-secondary/50 transition-all duration-300 hover:scale-105">
                  <div className="text-3xl font-bold text-secondary mb-2">Enterprise</div>
                  <div className="text-muted-foreground mb-4">For large organizations</div>
                  <ul className="text-sm space-y-2 text-left">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Unlimited guests</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Custom integrations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>White-label options</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Dedicated support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollAnimation>

            {/* Trust Indicators */}
            <ScrollAnimation direction="up" distance={40} delay={800}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                <div className="text-center group">
                  <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">10K+</div>
                  <div className="text-sm text-muted-foreground">Events Created</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold text-secondary mb-2 group-hover:scale-110 transition-transform duration-300">500K+</div>
                  <div className="text-sm text-muted-foreground">Happy Guests</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold text-accent mb-2 group-hover:scale-110 transition-transform duration-300">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Additional Links */}
            <ScrollAnimation direction="up" distance={20} delay={1000}>
              <div className="flex flex-wrap justify-center gap-8 text-sm">
                <a href="/color-palettes" className="text-primary hover:underline transition-colors flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span>View Color Palette Showcase</span>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Documentation</span>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Community</span>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Security</span>
                </a>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">SM</span>
                </div>
                <span className="font-bold text-xl">SeatMaster</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Transform your event management with our comprehensive platform for events, guests, and seating.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 SeatMaster. All rights reserved. Built with Next.js and powered by modern web technologies.</p>
          </div>
        </div>
      </footer>
    </div>
    </AnimatedCursor>
  );
}
