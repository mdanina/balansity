import logoOtters from "@/assets/logo-otters.png";
import otterReading from "@/assets/otter-reading.png";
import otterHearts from "@/assets/otter-hearts.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { User } from "lucide-react";

export default function Dashboard() {
  const familyMembers = [
    { name: "Мария Данина", age: "39 yo", avatar: null },
    { name: "Alice Danina", age: "8 yo", avatar: null },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoOtters} alt="Little Otter" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">Little Otter</span>
          </div>
          <Avatar className="h-10 w-10 bg-primary">
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
          </Avatar>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 px-6 py-16 text-white">
        {/* Decorative elements */}
        <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-teal-400/30 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-teal-400/30 to-transparent" />
        
        <div className="container mx-auto relative z-10 max-w-5xl">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Hello there, Мария</h1>
          <p className="text-xl md:text-2xl opacity-90">How are you feeling today?</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-5xl px-6 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 overflow-hidden border-2 bg-card p-8 shadow-lg">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="mb-3 text-3xl font-bold text-foreground">
                Welcome to your new Care Den
              </h2>
              <p className="text-lg text-muted-foreground">
                A bit lost?... Let us help, click the button to watch our intro video.
              </p>
            </div>
            <Button 
              size="lg" 
              className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
            >
              Watch Intro Video
            </Button>
          </div>
        </Card>

        {/* Portal Cards */}
        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <Card className="group cursor-pointer overflow-hidden border-2 bg-gradient-to-br from-purple-50 to-white p-8 shadow-md transition-all hover:shadow-xl">
            <div className="flex flex-col items-center text-center">
              <img 
                src={otterReading} 
                alt="Little Otter Portal" 
                className="mb-6 h-40 w-auto object-contain"
              />
              <h3 className="mb-2 text-2xl font-bold text-foreground">Little Otter</h3>
              <p className="text-lg font-medium text-muted-foreground">PORTAL</p>
            </div>
          </Card>

          <Card className="group cursor-pointer overflow-hidden border-2 bg-gradient-to-br from-pink-50 to-white p-8 shadow-md transition-all hover:shadow-xl">
            <div className="flex flex-col items-center text-center">
              <img 
                src={otterHearts} 
                alt="Family Mental Health Check-up" 
                className="mb-6 h-40 w-auto object-contain"
              />
              <h3 className="mb-2 text-2xl font-bold text-foreground">Family Mental Health</h3>
              <p className="text-lg font-medium text-muted-foreground">Check-up</p>
            </div>
          </Card>
        </div>

        {/* Your Family Section */}
        <div>
          <h2 className="mb-6 text-3xl font-bold text-foreground">Your Family</h2>
          <div className="space-y-4">
            {familyMembers.map((member, index) => (
              <Card 
                key={index}
                className="flex items-center gap-4 border-2 bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <Avatar className="h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-600">
                  <div className="flex h-full w-full items-center justify-center text-white">
                    <User className="h-8 w-8" />
                  </div>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{member.name}</h3>
                  <p className="text-muted-foreground">{member.age}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
