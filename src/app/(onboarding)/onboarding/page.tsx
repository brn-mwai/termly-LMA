"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  CircleNotch,
  FileText,
  ChartLine,
  ShieldCheck,
} from "@phosphor-icons/react";
import Image from "next/image";

const STEPS = ["Welcome", "Organization", "Get Started"];

const FEATURES = [
  {
    icon: FileText,
    title: "Upload Documents",
    description: "Credit agreements, compliance certificates, and amendments",
  },
  {
    icon: ChartLine,
    title: "Track Covenants",
    description: "Monitor compliance status with real-time dashboards",
  },
  {
    icon: ShieldCheck,
    title: "Stay Compliant",
    description: "Receive alerts before breaches occur",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

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
        <CircleNotch className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo/Logo-mark.png"
            alt="Termly"
            width={48}
            height={48}
            className="h-12 w-12"
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" weight="bold" />
                ) : (
                  index + 1
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 1: Welcome */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome{user?.firstName ? `, ${user.firstName}` : ""}
                      </h1>
                      <p className="text-muted-foreground">
                        Termly helps you monitor loan covenants and stay compliant.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {FEATURES.map((feature) => {
                        const Icon = feature.icon;
                        return (
                          <div
                            key={feature.title}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                          >
                            <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{feature.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Organization */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Your Organization
                      </h2>
                      <p className="text-muted-foreground">
                        Confirm your organization name
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Enter organization name"
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        This appears in reports and across the platform.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Get Started */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="flex justify-center mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                          <CheckCircle className="h-6 w-6 text-green-600" weight="fill" />
                        </div>
                      </div>
                      <h2 className="text-2xl font-semibold tracking-tight">
                        You&apos;re ready
                      </h2>
                      <p className="text-muted-foreground">
                        Start by uploading a document or explore the demo data.
                      </p>
                    </div>

                    <Button
                      className="w-full h-11"
                      onClick={handleComplete}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircleNotch className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Go to Dashboard
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 2 && (
          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button size="sm" onClick={nextStep}>
              Continue
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Skip */}
        <div className="text-center">
          <button
            onClick={handleComplete}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip and go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
