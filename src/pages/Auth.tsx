import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.svg";
import { ArrowRight, Check, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

const HIGHLIGHTS = [
  "Plain-English business reports in minutes",
  "Chat with your data — computations shown, not hidden",
  "Forecast key metrics without a data team",
  "Export polished PDF & Word reports",
];

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="hero-backdrop flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-4xl items-center gap-10 lg:grid-cols-2">
          {/* Pitch panel */}
          <div className="hidden lg:block">
            <Link to="/" className="mb-8 flex items-center gap-2">
              <img src={logo} alt="ReportGen" className="size-9 rounded-lg" />
              <span className="font-display text-lg font-bold tracking-tight">ReportGen</span>
            </Link>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight">
              Your data already knows the answer.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
              Sign in to upload a dataset, generate readable reports, ask follow-up questions, and forecast what's next.
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm leading-6">
                  <Check className="mt-1 size-4 shrink-0 text-primary" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Form panel */}
          <Card className="min-w-[350px] border shadow-md pb-0">
            {step === "signIn" ? (
              <>
                <CardHeader className="text-center lg:text-left">
                  <div className="flex justify-center lg:hidden">
                    <img src={logo} alt="logo" width={48} height={48} className="mb-2 rounded-lg cursor-pointer" onClick={() => navigate("/")} />
                  </div>
                  <CardTitle className="text-xl">Get started</CardTitle>
                  <CardDescription>Enter your email to log in or sign up</CardDescription>
                </CardHeader>
                <form onSubmit={handleEmailSubmit}>
                  <CardContent>
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="email"
                          placeholder="name@example.com"
                          type="email"
                          className="pl-9"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <Button type="submit" variant="outline" size="icon" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      </Button>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

                    <div className="mt-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>

                      <Button type="button" variant="outline" className="mt-4 w-full" onClick={handleGuestLogin} disabled={isLoading}>
                        <UserX className="mr-2 h-4 w-4" />
                        Continue as guest
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </>
            ) : (
              <>
                <CardHeader className="mt-4 text-center">
                  <CardTitle>Check your email</CardTitle>
                  <CardDescription>We've sent a code to {step.email}</CardDescription>
                </CardHeader>
                <form onSubmit={handleOtpSubmit}>
                  <CardContent className="pb-4">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />

                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                            const form = (e.target as HTMLElement).closest("form");
                            form?.requestSubmit();
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && <p className="mt-2 text-sm text-center text-red-500">{error}</p>}
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      Didn't receive a code?{" "}
                      <Button variant="link" className="h-auto p-0" onClick={() => setStep("signIn")}>
                        Try again
                      </Button>
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify code <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setStep("signIn")} disabled={isLoading} className="w-full">
                      Use different email
                    </Button>
                  </CardFooter>
                </form>
              </>
            )}

            <div className="rounded-b-lg border-t bg-muted px-6 py-4 text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                ← Back to home
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
