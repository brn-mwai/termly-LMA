import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between overflow-hidden">
        {/* Background Image */}
        <Image
          src="/Auth-image.png"
          alt="Team collaborating on loan management"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo/termly-logo-white.svg"
              alt="Termly"
              width={140}
              height={36}
              priority
            />
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-medium text-white leading-tight">
            AI-Powered Loan<br />Covenant Monitoring
          </h1>
          <p className="text-lg text-white/80">
            Automate document extraction and track compliance in real-time.<br />Never miss a covenant breach again.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/50">
          Trusted by leading financial institutions worldwide
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/">
              <Image
                src="/logo/termly-logo.svg"
                alt="Termly"
                width={140}
                height={36}
                priority
              />
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
