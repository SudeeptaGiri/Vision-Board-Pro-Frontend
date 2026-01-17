import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Brain, 
  BarChart3, 
  Sparkles,
  CheckCircle2,
  Zap,
  Users,
  Star
} from 'lucide-react';
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-bg dark:bg-warm-text">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-warm-border/50 dark:border-warm-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center shadow-terracotta">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-warm-text dark:text-warm-bg">VisionBoard Pro</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-warm-muted hover:text-warm-text dark:text-warm-bg/70 dark:hover:text-warm-bg transition">
                Features
              </Link>
              <Link href="#how-it-works" className="text-warm-muted hover:text-warm-text dark:text-warm-bg/70 dark:hover:text-warm-bg transition">
                How it Works
              </Link>
              <Link href="#pricing" className="text-warm-muted hover:text-warm-text dark:text-warm-bg/70 dark:hover:text-warm-bg transition">
                Pricing
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="gradient-bg hover:opacity-90">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warm-highlight dark:bg-warm-muted/30 text-warm-text dark:text-warm-bg text-sm font-medium mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-terracotta" />
              AI-Powered Goal Achievement
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-warm-text dark:text-warm-bg">
              Turn Your <span className="text-terracotta">Dreams</span> Into
              <br />
              <span className="text-terracotta">Achievable</span> Plans
            </h1>
            
            <p className="text-xl text-warm-muted dark:text-warm-bg/70 mb-10 max-w-2xl mx-auto">
              Stop feeling overwhelmed by big goals. Our AI breaks down your dreams into 
              actionable steps, tracks your progress, and keeps you motivated every day.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="gradient-bg hover:opacity-90 text-lg px-8 py-6">
                  Start Your Journey
                  <Zap className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-warm-muted dark:text-warm-bg/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-sage" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-sage" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-sage" />
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-warm-bg dark:from-warm-text to-transparent z-10 pointer-events-none" />
            <div className="glass-card rounded-2xl p-2 shadow-2xl shadow-warm-text/10">
              <img 
                src="/dashboard-preview.png" 
                alt="VisionBoard Pro Dashboard"
                className="rounded-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-warm-text dark:text-warm-bg">
              Everything You Need to <span className="text-terracotta">Succeed</span>
            </h2>
            <p className="text-xl text-warm-muted dark:text-warm-bg/70 max-w-2xl mx-auto">
              Powerful features designed to help you achieve any goal, no matter how big or small.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card rounded-2xl p-8 hover:shadow-xl hover:shadow-warm-text/10 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-warm-text dark:text-warm-bg">{feature.title}</h3>
                <p className="text-warm-muted dark:text-warm-bg/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-b from-transparent via-warm-card/50 to-transparent dark:via-warm-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-warm-text dark:text-warm-bg">
              How <span className="text-terracotta">VisionBoard Pro</span> Works
            </h2>
            <p className="text-xl text-warm-muted dark:text-warm-bg/70 max-w-2xl mx-auto">
              Three simple steps to transform your goals into reality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-terracotta flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-terracotta">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-warm-text dark:text-warm-bg">{step.title}</h3>
                  <p className="text-warm-muted dark:text-warm-bg/70">{step.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-warm-border to-terracotta/50 dark:from-warm-muted dark:to-terracotta/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-warm-text dark:text-warm-bg">
              Loved by <span className="text-terracotta">Achievers</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-card rounded-2xl p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-status-warning text-status-warning" />
                  ))}
                </div>
                <p className="text-warm-muted dark:text-warm-bg/80 mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta to-sage shadow-warm" />
                  <div>
                    <p className="font-semibold text-warm-text dark:text-warm-bg">{testimonial.name}</p>
                    <p className="text-sm text-warm-muted dark:text-warm-bg/70">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-terracotta rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-terracotta">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Achieve Your Dreams?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of achievers who are turning their visions into reality with VisionBoard Pro.
              </p>
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Get Started Free
                  <Zap className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-warm-border dark:border-warm-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-warm-text dark:text-warm-bg">VisionBoard Pro</span>
            </div>
            <p className="text-warm-muted dark:text-warm-bg/70 text-sm">
              © 2024 VisionBoard Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Planning',
    description: 'Our AI analyzes your goals and creates personalized, actionable step-by-step plans tailored to your situation.',
    color: 'bg-terracotta',
  },
  {
    icon: Target,
    title: 'Smart Goal Breakdown',
    description: 'Big goals become manageable when broken into smaller tasks. We do this automatically for you.',
    color: 'bg-terracotta-hover',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Visual progress bars and statistics keep you motivated and show how far you\'ve come.',
    color: 'bg-sage',
  },
  {
    icon: Sparkles,
    title: 'Beautiful Vision Boards',
    description: 'Create stunning vision boards with images and goals. See your dreams every day.',
    color: 'bg-status-warning',
  },
  {
    icon: CheckCircle2,
    title: 'Habit Building',
    description: 'Build lasting habits with streak tracking and daily reminders that keep you consistent.',
    color: 'bg-status-success',
  },
  {
    icon: Zap,
    title: 'Kanban Workflow',
    description: 'Organize tasks your way with drag-and-drop Kanban boards for maximum productivity.',
    color: 'bg-status-alert',
  },
];

const steps = [
  {
    title: 'Define Your Goal',
    description: 'Tell us what you want to achieve. Whether it\'s learning a skill, planning a trip, or building a habit.',
  },
  {
    title: 'Answer a Few Questions',
    description: 'Our AI asks personalized questions to understand your situation, timeline, and resources.',
  },
  {
    title: 'Follow Your Plan',
    description: 'Get a customized action plan with tasks, milestones, and daily habits. Just follow along!',
  },
];

const testimonials = [
  {
    quote: 'I finally learned to play guitar after years of failed attempts. The AI broke it down into such manageable steps!',
    name: 'Sarah Chen',
    role: 'Marketing Manager',
  },
  {
    quote: 'Planned my dream trip to Japan with every detail covered. The personalized itinerary was incredible.',
    name: 'Mike Johnson',
    role: 'Software Engineer',
  },
  {
    quote: 'Lost 30 pounds by following the AI-generated fitness plan. The habit tracking kept me accountable.',
    name: 'Emily Rodriguez',
    role: 'Teacher',
  },
];