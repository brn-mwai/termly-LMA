import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "w-full shadow-none border-0 bg-transparent",
          headerTitle: "text-2xl font-medium text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "border border-border hover:bg-muted",
          socialButtonsBlockButtonText: "text-foreground font-normal",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
          formFieldLabel: "text-foreground font-medium",
          formFieldInput: "border-border focus:ring-primary",
          formButtonPrimary:
            "bg-[#17A417] hover:bg-[#17A417]/90 text-white font-medium",
          footerActionLink: "text-primary hover:text-primary/90",
          identityPreviewEditButton: "text-primary",
          formFieldAction: "text-primary",
          otpCodeFieldInput: "border-border",
          formResendCodeLink: "text-primary",
        },
        layout: {
          socialButtonsPlacement: "top",
          socialButtonsVariant: "blockButton",
        },
      }}
      forceRedirectUrl="/dashboard"
    />
  );
}
