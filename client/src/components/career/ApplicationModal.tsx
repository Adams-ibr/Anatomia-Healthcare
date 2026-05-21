import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResumeUploader } from "./ResumeUploader";

export interface ApplicationModalProps {
  jobId: string;
  jobTitle: string;
  open: boolean;
  onClose: () => void;
}

interface ApplicationPayload extends Record<string, unknown> {
  jobId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: number;
  startDate: string;
  portfolioUrl?: string;
  coverLetter: string;
  resumeUrl: string;
}

interface FormFields {
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  startDate: string;
  coverLetter: string;
}

const EMPTY_FORM: FormFields = {
  name: "",
  email: "",
  phone: "",
  location: "",
  experience: "",
  startDate: "",
  coverLetter: "",
};

function isFormComplete(fields: FormFields, resumeUrl: string): boolean {
  return (
    fields.name.trim() !== "" &&
    fields.email.trim() !== "" &&
    fields.phone.trim() !== "" &&
    fields.location.trim() !== "" &&
    fields.experience.trim() !== "" &&
    fields.startDate.trim() !== "" &&
    fields.coverLetter.trim() !== "" &&
    resumeUrl !== ""
  );
}

export function ApplicationModal({
  jobId,
  jobTitle,
  open,
  onClose,
}: ApplicationModalProps) {
  const { toast } = useToast();

  const [fields, setFields] = useState<FormFields>(EMPTY_FORM);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  const canSubmit = isFormComplete(fields, resumeUrl);

  const applyMutation = useMutation({
    mutationFn: (data: ApplicationPayload) =>
      apiRequest("POST", "/api/applications", data),
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description:
          "Thank you for applying! We'll review your application and get back to you soon.",
      });
      // Reset form state and close
      setFields(EMPTY_FORM);
      setPortfolioUrl("");
      setResumeUrl("");
      onClose();
    },
    onError: (err) => {
      toast({
        title: "Submission Failed",
        description:
          err instanceof Error
            ? err.message
            : "There was an error submitting your application.",
        variant: "destructive",
      });
    },
  });

  const handleFieldChange =
    (field: keyof FormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleUploadComplete = (url: string) => {
    setResumeUrl(url);
  };

  const handleUploadError = (message: string) => {
    toast({
      title: "Upload Failed",
      description: message,
      variant: "destructive",
    });
    // Keep form open; resumeUrl remains empty so submit stays disabled
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    const data: ApplicationPayload = {
      jobId,
      name: fields.name.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      location: fields.location.trim(),
      experience: parseInt(fields.experience, 10) || 0,
      startDate: fields.startDate.trim(),
      portfolioUrl: portfolioUrl.trim() || undefined,
      coverLetter: fields.coverLetter.trim(),
      resumeUrl,
    };

    applyMutation.mutate(data);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const isPending = applyMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {jobTitle}</DialogTitle>
          <DialogDescription>
            Please provide your details to apply for this position. All fields
            are required unless marked as optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Full Name</Label>
              <Input
                id="app-name"
                name="name"
                required
                placeholder="Jane Doe"
                disabled={isPending}
                value={fields.name}
                onChange={handleFieldChange("name")}
                data-testid="input-app-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-email">Email Address</Label>
              <Input
                id="app-email"
                name="email"
                type="email"
                required
                placeholder="jane@example.com"
                disabled={isPending}
                value={fields.email}
                onChange={handleFieldChange("email")}
                data-testid="input-app-email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app-phone">Phone Number</Label>
              <Input
                id="app-phone"
                name="phone"
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                disabled={isPending}
                value={fields.phone}
                onChange={handleFieldChange("phone")}
                data-testid="input-app-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-location">Current Location</Label>
              <Input
                id="app-location"
                name="location"
                required
                placeholder="City, Country"
                disabled={isPending}
                value={fields.location}
                onChange={handleFieldChange("location")}
                data-testid="input-app-location"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app-experience">Years of Experience</Label>
              <Input
                id="app-experience"
                name="experience"
                type="number"
                min="0"
                required
                placeholder="e.g. 5"
                disabled={isPending}
                value={fields.experience}
                onChange={handleFieldChange("experience")}
                data-testid="input-app-experience"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-startDate">Available Start Date</Label>
              <Input
                id="app-startDate"
                name="startDate"
                type="date"
                required
                disabled={isPending}
                value={fields.startDate}
                onChange={handleFieldChange("startDate")}
                data-testid="input-app-startDate"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Resume / CV</Label>
            <ResumeUploader
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, DOC, DOCX (Max 5MB)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-portfolio">
              Portfolio / LinkedIn URL (Optional)
            </Label>
            <Input
              id="app-portfolio"
              name="portfolio"
              type="url"
              placeholder="https://..."
              disabled={isPending}
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              data-testid="input-app-portfolio"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-coverLetter">Cover Letter</Label>
            <Textarea
              id="app-coverLetter"
              name="coverLetter"
              required
              placeholder="Tell us why you're a great fit for this role and what excites you about Anatomia..."
              className="min-h-[120px]"
              disabled={isPending}
              value={fields.coverLetter}
              onChange={handleFieldChange("coverLetter")}
              data-testid="textarea-app-coverLetter"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isPending}
              data-testid="button-submit-application"
            >
              {isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
