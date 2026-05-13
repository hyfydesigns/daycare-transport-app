"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bus, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const prefillEmail    = searchParams.get("email")    ?? "";
  const prefillPassword = searchParams.get("password") ?? "";
  const isAutoLogin     = !!(prefillEmail && prefillPassword);

  const [email, setEmail]       = useState(prefillEmail);
  const [password, setPassword] = useState(prefillPassword);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(isAutoLogin); // show spinner immediately if auto-login
  const router = useRouter();

  async function doSignIn(e?: string, p?: string) {
    const em = e ?? email;
    const pw = p ?? password;
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email: em, password: pw, redirect: false });
    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      const session = await getSession();
      router.push(session?.user?.role === "DRIVER" ? "/driver" : "/dashboard");
      router.refresh();
    }
  }

  // Auto-submit when pre-filled credentials arrive from the welcome email link
  useEffect(() => {
    if (isAutoLogin) {
      doSignIn(prefillEmail, prefillPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <Bus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DaycareRide</h1>
          <p className="text-sm text-gray-500 mt-1">Transportation Management System</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              {isAutoLogin && loading
                ? "Signing you in automatically…"
                : "Enter your credentials to access the system"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAutoLogin && loading ? (
              <div className="flex flex-col items-center py-8 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Signing in…</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); doSignIn(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in…</> : "Sign in"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
