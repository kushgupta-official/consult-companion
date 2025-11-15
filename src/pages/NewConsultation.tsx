import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Mic, 
  Download,
  User,
  Check
} from "lucide-react";

const NewConsultation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [hasRecorded, setHasRecorded] = useState(false);
  
  // Mocked AI-extracted data
  const [aiData, setAiData] = useState({
    chiefComplaint: "",
    consultationNotes: "",
    diagnosis: "",
    medications: [] as any[],
    followUpInstructions: ""
  });

  useEffect(() => {
    checkDoctor();
  }, []);

  const checkDoctor = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData?.role !== "doctor") {
      toast({
        title: "Access Denied",
        description: "Only doctors can create consultations",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setProfile(profileData);
  };

  const handleVoiceRecording = () => {
    if (!recording) {
      setRecording(true);
      toast({
        title: "Listening...",
        description: "Speak naturally about the consultation",
      });
      
      // Mock AI extraction after 3 seconds
      setTimeout(() => {
        setRecording(false);
        setHasRecorded(true);
        setAiData({
          chiefComplaint: "Fever and headache for 3 days",
          consultationNotes: "Patient reports high fever (102°F) with severe headache. No cough or cold symptoms. Appetite normal. Sleep disturbed due to fever.",
          diagnosis: "Viral Fever with associated headache",
          medications: [
            {
              name: "Paracetamol",
              dosage: "500mg",
              duration: "3 days",
              frequency: { morning: true, afternoon: false, evening: true },
              timing_detail: "after_breakfast",
              instructions: "Take with water after meals"
            },
            {
              name: "Rest",
              dosage: "Full bed rest",
              duration: "3 days",
              frequency: { morning: true, afternoon: true, evening: true },
              timing_detail: "anytime",
              instructions: "Stay hydrated, drink plenty of fluids"
            }
          ],
          followUpInstructions: "Return if fever persists beyond 3 days or if symptoms worsen"
        });
        toast({
          title: "Consultation Captured",
          description: "AI has extracted all details",
        });
      }, 3000);
    } else {
      setRecording(false);
    }
  };

  const handleExportPrescription = () => {
    toast({
      title: "Prescription Exported",
      description: "PDF saved to your device",
    });
  };

  const handleSaveConsultation = async () => {
    if (!patientName || !hasRecorded) {
      toast({
        title: "Missing Information",
        description: "Please add patient name and record consultation",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success!",
      description: "Consultation saved (mocked)",
    });
    
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">New Consultation</h1>
        <div className="w-10" />
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
        {/* Patient Info Card */}
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="patientName" className="text-sm">Patient Name *</Label>
              <Input
                id="patientName"
                placeholder="Enter patient name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="patientPhone" className="text-sm">Phone Number (Optional)</Label>
              <Input
                id="patientPhone"
                type="tel"
                placeholder="+91 98765 43210"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* Voice Recording Section */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8">
          {!hasRecorded ? (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Tap to speak</h2>
                <p className="text-sm text-muted-foreground px-4">
                  Describe the consultation naturally - AI will extract all details
                </p>
              </div>
              
              {/* Large Mic Button */}
              <button
                onClick={handleVoiceRecording}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                  recording
                    ? "bg-destructive shadow-lg shadow-destructive/50 scale-110"
                    : "bg-primary shadow-lg shadow-primary/30 hover:scale-105 active:scale-95"
                }`}
              >
                <Mic className={`w-10 h-10 text-primary-foreground ${recording ? "animate-pulse" : ""}`} />
                
                {recording && (
                  <div className="absolute inset-0 rounded-full border-4 border-destructive animate-ping" />
                )}
              </button>
              
              {recording && (
                <p className="text-sm text-destructive font-medium animate-pulse">
                  Listening...
                </p>
              )}
            </>
          ) : (
            <>
              {/* AI Extracted Data Display */}
              <div className="w-full space-y-4">
                <div className="flex items-center justify-center gap-2 text-medical-green">
                  <div className="w-8 h-8 rounded-full bg-medical-green/10 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Consultation Captured</span>
                </div>

                <Card>
                  <CardContent className="pt-4 space-y-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Chief Complaint</p>
                      <p className="font-medium">{aiData.chiefComplaint}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm leading-relaxed">{aiData.consultationNotes}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Diagnosis</p>
                      <p className="font-medium">{aiData.diagnosis}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Medications</p>
                      <div className="space-y-2">
                        {aiData.medications.map((med, idx) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                            <p className="font-medium">{med.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {med.dosage} • {med.duration}
                            </p>
                            <div className="flex gap-1 mt-2">
                              {med.frequency.morning && <div className="w-2 h-2 rounded-full bg-primary" />}
                              {med.frequency.afternoon && <div className="w-2 h-2 rounded-full bg-primary" />}
                              {med.frequency.evening && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            {med.instructions && (
                              <p className="text-xs text-muted-foreground mt-1">{med.instructions}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Follow-up</p>
                      <p className="text-sm">{aiData.followUpInstructions}</p>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setHasRecorded(false);
                    setAiData({
                      chiefComplaint: "",
                      consultationNotes: "",
                      diagnosis: "",
                      medications: [],
                      followUpInstructions: ""
                    });
                  }}
                >
                  Re-record Consultation
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pb-4">
          {hasRecorded && (
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleExportPrescription}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Prescription
            </Button>
          )}
          
          <Button
            className="w-full h-12"
            onClick={handleSaveConsultation}
            disabled={!patientName || !hasRecorded}
          >
            <User className="w-4 h-4 mr-2" />
            Save Consultation
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NewConsultation;
