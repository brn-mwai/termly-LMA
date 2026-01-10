"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartLineUp,
  Buildings,
  Rocket,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  CircleNotch,
  Sparkle,
  FileText,
  Bell,
} from "@phosphor-icons/react";
import Image from "next/image";

const STEPS = [
  { id: "welcome", title: "Welcome", icon: Sparkle },
  { id: "organization", title: "Organization", icon: Buildings },
  { id: "features", title: "Features", icon: ChartLineUp },
  { id: "complete", title: "Complete", icon: Rocket },
];

const FEATURES = [
  {
    icon: FileText,
    title: "AI Document Extraction",
    description: "Upload credit agreements and let AI extract covenants automatically",
  },
  {
    icon: ChartLineUp,
    title: "Real-time Monitoring",
    description: "Track covenant compliance with live dashboards and alerts",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified before breaches happen with predictive warnings",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if user has already completed onboarding
  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!isLoaded) return;

      try {
        const res = await fetch("/api/onboarding/status");
        if (res.ok) {
          const { data } = await res.json();
          if (data?.onboarding_completed) {
            router.replace("/dashboard");
            return;
          }
          if (data?.organization_name) {
            setOrgName(data.organization_name);
          }
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      } finally {
        setCheckingStatus(false);
      }
    }

    checkOnboardingStatus();
  }, [isLoaded, router]);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName: orgName }),
      });

      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isLoaded || checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircleNotch className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo/Termly-logo.png"
            alt="Termly"
            width={140}
            height={40}
            className="h-10 w-auto"
          />
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{STEPS[currentStep].title}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            return (
              <div
                key={step.id}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground scale-110"
                    : isComplete
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="h-5 w-5" weight="fill" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                      <Sparkle className="h-10 w-10 text-primary" weight="fill" />
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                      Welcome to Termly, {user?.firstName || "there"}!
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                      Let&apos;s get you set up in just a few steps. You&apos;ll be monitoring
                      covenants like a pro in no time.
                    </p>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Buildings className="h-8 w-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-semibold">Your Organization</h2>
                      <p className="text-muted-foreground mt-2">
                        Confirm or update your organization name
                      </p>
                    </div>
                    <div className="max-w-sm mx-auto space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                          id="orgName"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="Enter your organization name"
                          className="h-12 text-lg"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This will be displayed across the platform and in reports.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <ChartLineUp className="h-8 w-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-semibold">What You Can Do</h2>
                      <p className="text-muted-foreground mt-2">
                        Here&apos;s what Termly helps you accomplish
                      </p>
                    </div>
                    <div className="grid gap-4">
                      {FEATURES.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                          <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{feature.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4"
                    >
                      <CheckCircle className="h-10 w-10 text-green-600" weight="fill" />
                    </motion.div>
                    <h2 className="text-3xl font-semibold">You&apos;re All Set!</h2>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                      Your account is ready. Start by uploading your first credit
                      agreement or exploring the demo data.
                    </p>
                    <div className="pt-4">
                      <Button
                        size="lg"
                        onClick={handleComplete}
                        disabled={loading}
                        className="gap-2"
                      >
                        {loading ? (
                          <>
                            <CircleNotch className="h-5 w-5 animate-spin" />
                            Setting up...
                          </>
                        ) : (
                          <>
                            Go to Dashboard
                            <Rocket className="h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        {currentStep < 3 && (
          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={nextStep} className="gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Skip link */}
        {currentStep < 3 && (
          <div className="text-center">
            <button
              onClick={handleComplete}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip onboarding and go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
