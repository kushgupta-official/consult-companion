import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Mic, 
  Square, 
  FileText, 
  Loader2,
  Sparkles,
  User,
  Calendar
} from "lucide-react";

const NewConsultation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Form states
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [consultationNotes, setConsultationNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");

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
      // Start recording
      setRecording(true);
      toast({
        title: "Recording Started",
        description: "Speak your consultation notes...",
      });
      // TODO: Implement actual voice recording
    } else {
      // Stop recording
      setRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Processing your audio...",
      });
      // TODO: Send to transcription API
    }
  };

  const handleAISummarize = async () => {
    if (!consultationNotes) {
      toast({
        title: "No Notes",
        description: "Please add consultation notes first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Call AI edge function for summarization
      toast({
        title: "AI Summarization",
        description: "This feature will be available soon",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConsultation = async () => {
    if (!patientName || !chiefComplaint) {
      toast({
        title: "Missing Information",
        description: "Please fill in patient name and chief complaint",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, create or find patient
      let patientId: string;

      // For now, create a new patient profile (in production, you'd search first)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `patient_${Date.now()}@temp.mediconsult.app`,
        password: Math.random().toString(36).slice(-16),
        options: {
          data: {
            full_name: patientName,
            phone: patientPhone,
            role: "patient",
          },
        },
      });

      if (authError) throw authError;
      patientId = authData.user!.id;

      // Create patient profile
      await supabase.from("profiles").insert({
        id: patientId,
        full_name: patientName,
        phone: patientPhone,
        role: "patient",
      });

      // Create appointment
      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: patientId,
          doctor_id: profile.id,
          chief_complaint: chiefComplaint,
          consultation_notes: consultationNotes,
          diagnosis,
          follow_up_instructions: followUpInstructions,
          status: "completed",
        });

      if (appointmentError) throw appointmentError;

      toast({
        title: "Success!",
        description: "Consultation saved successfully",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error saving consultation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save consultation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-accent/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">New Consultation</h1>
              <p className="text-sm text-muted-foreground">Record a patient consultation</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Information
              </CardTitle>
              <CardDescription>Basic patient details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name *</Label>
                  <Input
                    id="patientName"
                    placeholder="John Doe"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientPhone">Phone Number</Label>
                  <Input
                    id="patientPhone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consultation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Consultation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="complaint">Chief Complaint *</Label>
                <Input
                  id="complaint"
                  placeholder="e.g., Fever and headache for 3 days"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notes">Consultation Notes</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={recording ? "destructive" : "outline"}
                      onClick={handleVoiceRecording}
                    >
                      {recording ? (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Record
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAISummarize}
                      disabled={loading || !consultationNotes}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Summarize
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="notes"
                  placeholder="Type or record your consultation notes here..."
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  rows={6}
                  className={recording ? "border-destructive animate-pulse" : ""}
                />
                {recording && (
                  <p className="text-sm text-destructive">🔴 Recording in progress...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Your diagnosis and findings..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUp">Follow-up Instructions</Label>
                <Textarea
                  id="followUp"
                  placeholder="Next steps, follow-up date, lifestyle advice..."
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medications Section - Coming Soon */}
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Medication Management</p>
              <p className="text-sm text-muted-foreground">
                Add medications with structured dosing - coming soon
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button onClick={handleSaveConsultation} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Save Consultation
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewConsultation;
