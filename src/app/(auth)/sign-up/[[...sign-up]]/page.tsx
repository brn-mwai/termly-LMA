import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        variables: {
          colorPrimary: "#17A417",
          colorText: "#0f172a",
          colorTextSecondary: "#64748b",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorInputText: "#0f172a",
          borderRadius: "0.5rem",
        },
        elements: {
          rootBox: {
            width: "100%",
          },
          card: {
            width: "100%",
            boxShadow: "none",
            border: "none",
            backgroundColor: "transparent",
          },
          headerTitle: {
            fontSize: "1.5rem",
            fontWeight: "500",
          },
          formButtonPrimary: {
            backgroundColor: "#17A417",
            color: "#ffffff",
            fontWeight: "500",
            "&:hover": {
              backgroundColor: "#128a12",
            },
          },
          footerActionLink: {
            color: "#17A417",
            "&:hover": {
              color: "#128a12",
            },
          },
          formFieldAction: {
            color: "#17A417",
          },
          identityPreviewEditButton: {
            color: "#17A417",
          },
          formResendCodeLink: {
            color: "#17A417",
          },
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
