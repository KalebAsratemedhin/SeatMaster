"use client";

import { useState, useEffect } from "react";
import { ScrollAnimation } from "./scroll-animation";
import { Heart, Building2, Bus, Theater, GraduationCap, PartyPopper } from "lucide-react";

interface EventType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  gradient: string;
  features: string[];
}

const eventTypes: EventType[] = [
  {
    id: "wedding",
    name: "Weddings & Celebrations",
    icon: Heart,
    description: "Create magical moments with perfect seating arrangements",
    color: "from-pink-500 to-rose-500",
    gradient: "bg-gradient-to-br from-pink-500/20 to-rose-500/20",
    features: ["Guest Management", "Seating Charts", "RSVP Tracking", "Photo Sharing"]
  },
  {
    id: "business",
    name: "Business Events",
    icon: Building2,
    description: "Professional networking with seamless organization",
    color: "from-blue-500 to-indigo-500",
    gradient: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
    features: ["Attendee Tracking", "Networking Tools", "Analytics", "Badge Printing"]
  },
  {
    id: "transport",
    name: "Transportation",
    icon: Bus,
    description: "Organize group travel with seat assignments",
    color: "from-green-500 to-emerald-500",
    gradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
    features: ["Seat Booking", "Route Planning", "Passenger Lists", "Real-time Updates"]
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: Theater,
    description: "Manage concerts, shows, and performances",
    color: "from-purple-500 to-violet-500",
    gradient: "bg-gradient-to-br from-purple-500/20 to-violet-500/20",
    features: ["Ticket Sales", "Venue Layout", "Artist Management", "Crowd Control"]
  },
  {
    id: "education",
    name: "Educational",
    icon: GraduationCap,
    description: "Workshops, seminars, and training sessions",
    color: "from-orange-500 to-amber-500",
    gradient: "bg-gradient-to-br from-orange-500/20 to-amber-500/20",
    features: ["Registration", "Certificates", "Materials", "Progress Tracking"]
  },
  {
    id: "social",
    name: "Social Gatherings",
    icon: PartyPopper,
    description: "Parties, reunions, and community events",
    color: "from-yellow-500 to-orange-500",
    gradient: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20",
    features: ["Guest Lists", "Photo Sharing", "Memories", "Social Features"]
  }
];

export function EventTypeShowcase() {
  const [activeType, setActiveType] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveType((prev) => (prev + 1) % eventTypes.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentType = eventTypes[activeType];

  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary/20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-secondary/20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 rounded-full bg-accent/20 animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto max-w-7xl">
        <ScrollAnimation direction="up" distance={100} delay={0}>
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl font-bold mb-6">
              Perfect for Every{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Event Type
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From intimate gatherings to grand celebrations, SeatMaster adapts to your unique needs
            </p>
          </div>
        </ScrollAnimation>

        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Event Type Selector */}
            <ScrollAnimation direction="left" distance={100} delay={200}>
              <div className="space-y-3">
                {eventTypes.map((type, index) => (
                  <div
                    key={type.id}
                    className={`p-4 rounded-xl border-2 transition-all duration-500 cursor-pointer group ${
                      activeType === index
                        ? `border-primary bg-primary/10 shadow-lg scale-105`
                        : `border-border hover:border-primary/50 hover:bg-muted/50`
                    }`}
                    onClick={() => {
                      setIsAnimating(true);
                      setTimeout(() => {
                        setActiveType(index);
                        setIsAnimating(false);
                      }, 300);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`transition-transform duration-300 ${
                        activeType === index ? 'scale-110' : 'group-hover:scale-105'
                      }`}>
                        <type.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollAnimation>

            {/* Active Event Type Display */}
            <ScrollAnimation direction="right" distance={100} delay={400}>
              <div className="relative">
                <div className={`${currentType.gradient} rounded-2xl p-6 min-h-[400px] transition-all duration-500 ${
                  isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                }`}>
                  <div className="text-center mb-6">
                    <div className="mb-3 animate-bounce">
                      <currentType.icon className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{currentType.name}</h3>
                    <p className="text-base text-muted-foreground">{currentType.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {currentType.features.map((feature, index) => (
                      <div
                        key={feature}
                        className="bg-background/80 backdrop-blur-sm rounded-lg p-3 text-center hover:scale-105 transition-transform duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="text-xs font-medium">{feature}</div>
                      </div>
                    ))}
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary/30 animate-ping"></div>
                  <div className="absolute bottom-3 left-3 w-4 h-4 rounded-full bg-secondary/30 animate-ping delay-1000"></div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>

        {/* Bottom CTA */}
        <ScrollAnimation direction="up" distance={80} delay={600}>
          <div className="text-center mt-16">
            <div className="inline-flex items-center space-x-2 bg-muted/50 rounded-full px-6 py-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-medium">Ready to get started?</span>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:scale-105 transition-transform duration-300">
                Choose Your Event Type
              </button>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
