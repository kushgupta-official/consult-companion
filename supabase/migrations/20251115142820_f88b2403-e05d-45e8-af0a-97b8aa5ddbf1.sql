-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('doctor', 'patient');

-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('pending', 'completed', 'cancelled');

-- Create enum for medication timing
CREATE TYPE public.medication_timing AS ENUM (
  'before_breakfast', 'after_breakfast',
  'before_lunch', 'after_lunch',
  'before_dinner', 'after_dinner',
  'bedtime', 'anytime'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL,
  specialization TEXT, -- For doctors
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status appointment_status NOT NULL DEFAULT 'pending',
  chief_complaint TEXT,
  consultation_notes TEXT, -- Raw transcription/notes
  ai_summary TEXT, -- AI-generated summary
  diagnosis TEXT,
  follow_up_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create medications table with structured format
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL, -- e.g., "500mg / 1 tablet"
  duration TEXT NOT NULL, -- e.g., "5 days" or "2 weeks"
  frequency_morning BOOLEAN NOT NULL DEFAULT false,
  frequency_afternoon BOOLEAN NOT NULL DEFAULT false,
  frequency_evening BOOLEAN NOT NULL DEFAULT false,
  timing_detail medication_timing,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create attachments table (for images, lab reports)
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'prescription_image', 'lab_report', 'other'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create conversation messages for AI Q&A
CREATE TABLE public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for appointments
CREATE POLICY "Patients can view own appointments"
  ON public.appointments FOR SELECT
  USING (
    auth.uid() = patient_id OR auth.uid() = doctor_id
  );

CREATE POLICY "Doctors can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

CREATE POLICY "Doctors can update their appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = doctor_id);

-- RLS Policies for medications
CREATE POLICY "Users can view medications for their appointments"
  ON public.medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE id = appointment_id
      AND (patient_id = auth.uid() OR doctor_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can manage medications"
  ON public.medications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id = appointment_id
      AND a.doctor_id = auth.uid()
      AND p.role = 'doctor'
    )
  );

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments for their appointments"
  ON public.attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments
      WHERE id = appointment_id
      AND (patient_id = auth.uid() OR doctor_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can manage attachments"
  ON public.attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id AND a.doctor_id = auth.uid()
    )
  );

-- RLS Policies for conversation messages
CREATE POLICY "Users can view own conversation messages"
  ON public.conversation_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversation messages"
  ON public.conversation_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-attachments', 'medical-attachments', false);

-- Storage RLS policies
CREATE POLICY "Users can upload their own attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_medications
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();