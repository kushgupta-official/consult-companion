import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Stethoscope, FileText, Search, MessageSquare, Shield, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    }
  };

  const features = [
    {
      icon: Stethoscope,
      title: "Smart Recording",
      description: "Capture consultations via voice or text with AI-powered transcription",
    },
    {
      icon: FileText,
      title: "Digital Prescriptions",
      description: "Structured medication records with visual schedules",
    },
    {
      icon: Search,
      title: "Searchable History",
      description: "Find past consultations, prescriptions, and notes instantly",
    },
    {
      icon: MessageSquare,
      title: "AI Assistant",
      description: "Ask questions about your medical history anytime",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your medical data is encrypted and protected",
    },
    {
      icon: Clock,
      title: "Continuity of Care",
      description: "Never lose track of treatments and follow-ups",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-accent/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Stethoscope className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Digital Healthcare Records</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Never Forget a <span className="text-primary">Consultation</span> Again
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            MediConsult digitally captures, organizes, and makes searchable every doctor-patient conversation. 
            Perfect for doctors and patients seeking better healthcare continuity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8 shadow-elevated hover:shadow-lg transition-all"
            >
              Get Started
              <Stethoscope className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-24">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-card border border-border hover:shadow-elevated transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center p-12 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Medical Records?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join doctors and patients who are already experiencing better healthcare continuity 
            with digital consultation records.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
