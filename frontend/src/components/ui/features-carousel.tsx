"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollAnimation } from "./scroll-animation";
import { Calendar, Users, Sofa, Ticket, MessageSquare, BarChart3 } from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  features: string[];
}

const features: Feature[] = [
  {
    id: "event-management",
    title: "Event Management",
    description: "Create and manage events of any scale with flexible scheduling, capacity planning, and multi-event support. Handle everything from intimate gatherings to large conferences.",
    icon: Calendar,
    color: "primary",
    gradient: "from-primary/20 to-secondary/20",
    features: ["Scheduling", "Capacity", "Multi-Event"]
  },
  {
    id: "guest-rsvp",
    title: "Guest & RSVP System",
    description: "Comprehensive guest database with real-time RSVP tracking, categories, and special requirements management. Keep track of dietary restrictions, accessibility needs, and preferences.",
    icon: Users,
    color: "secondary",
    gradient: "from-secondary/20 to-accent/20",
    features: ["RSVP Tracking", "Categories", "Requirements"]
  },
  {
    id: "smart-seating",
    title: "Smart Seating",
    description: "Interactive seating charts with AI-powered arrangements based on relationships and preferences. Automatically optimize seating for maximum guest satisfaction and networking opportunities.",
    icon: Sofa,
    color: "accent",
    gradient: "from-accent/20 to-primary/20",
    features: ["AI-Powered", "Interactive", "Optimized"]
  },
  {
    id: "digital-ticketing",
    title: "Digital Ticketing",
    description: "Generate QR code tickets, handle multiple ticket types, and integrate secure payment processing. Support for early bird pricing, group discounts, and VIP packages.",
    icon: Ticket,
    color: "primary",
    gradient: "from-primary/20 to-accent/20",
    features: ["QR Codes", "Payment", "Discounts"]
  },
  {
    id: "communication",
    title: "Communication Hub",
    description: "Automated reminders, multi-channel notifications, and real-time event updates for all guests. Email, SMS, and push notifications to keep everyone informed.",
    icon: MessageSquare,
    color: "secondary",
    gradient: "from-secondary/20 to-primary/20",
    features: ["Automated", "Multi-Channel", "Real-time"]
  },
  {
    id: "analytics",
    title: "Analytics & Insights",
    description: "Real-time attendance tracking, revenue reports, and guest analytics to optimize your events. Understand your audience and improve future events with detailed insights.",
    icon: BarChart3,
    color: "accent",
    gradient: "from-accent/20 to-secondary/20",
    features: ["Real-time", "Reports", "Insights"]
  }
];

export function FeaturesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToCard = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.scrollWidth / features.length;
      carouselRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
    setCurrentIndex(index);
  };

  const nextCard = () => {
    const nextIndex = (currentIndex + 1) % features.length;
    scrollToCard(nextIndex);
  };

  const prevCard = () => {
    const prevIndex = (currentIndex - 1 + features.length) % features.length;
    scrollToCard(prevIndex);
  };

  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        nextCard();
      }, 4000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentIndex, isAutoPlaying]);

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const cardWidth = carouselRef.current.scrollWidth / features.length;
      const newIndex = Math.round(scrollLeft / cardWidth);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  return (
    <section id="features" className="min-h-screen flex items-center justify-center py-20 px-4 bg-muted/50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-gradient-to-r from-secondary to-accent animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-r from-accent to-primary animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <ScrollAnimation direction="up" distance={100} delay={0}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-medium text-primary">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Everything You Need for{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Perfect Events
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Powerful features designed to streamline your event planning process and delight your guests. 
              From initial planning to post-event analytics, we&apos;ve got you covered.
            </p>
          </div>
        </ScrollAnimation>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            onClick={prevCard}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <span className="text-xl">←</span>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            onClick={nextCard}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <span className="text-xl">→</span>
          </Button>

          {/* Carousel */}
          <div
            ref={carouselRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-8 py-8"
            onScroll={handleScroll}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className="flex-shrink-0 w-80 snap-center"
              >
                <div className="group relative h-full">
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <Card className="relative hover:scale-105 transition-all duration-500 hover:shadow-2xl group-hover:shadow-primary/20 border-2 hover:border-primary/50 bg-background/80 backdrop-blur-sm h-full flex flex-col">
                    <CardHeader className="p-8 flex-1 flex flex-col">
                      <div className="mb-6">
                        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-${feature.color}/20 to-${feature.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <feature.icon className="w-8 h-8" />
                        </div>
                      </div>
                      <CardTitle className="text-xl mb-3">{feature.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed flex-1">
                        {feature.description}
                      </CardDescription>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {feature.features.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {features.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary scale-125'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                onClick={() => scrollToCard(index)}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
