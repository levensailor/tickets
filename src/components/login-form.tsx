"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const AUTH_PROVIDERS = [
  { id: "google" as const, label: "Continue with Google" },
  { id: "facebook" as const, label: "Continue with Facebook" },
  { id: "apple" as const, label: "Continue with Apple" },
];

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath = "/" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const appName = publicEnv.appName;
  const siteUrl = publicEnv.siteUrl;

  function callbackUrl(): string {
    const redirectTo = new URL(
      "/auth/callback",
      siteUrl || window.location.origin
    );
    redirectTo.searchParams.set("next", nextPath);
    return redirectTo.toString();
  }

  async function signInWithProvider(
    provider: (typeof AUTH_PROVIDERS)[number]["id"]
  ) {
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl(),
      },
    });
    if (oauthError) {
      console.error("OAuth sign-in failed", oauthError);
      setError(oauthError.message);
      setLoading(false);
    }
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl(),
      },
    });
    setLoading(false);
    if (otpError) {
      console.error("Email magic-link failed", otpError);
      setError(otpError.message);
      return;
    }
    setMessage(
      `Check your inbox at ${email.trim()} for a magic link to sign in to ${appName}.`
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use Google, Facebook, Apple, or email. Accounts with the same verified
          email are linked automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {AUTH_PROVIDERS.map((provider) => (
            <Button
              key={provider.id}
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => signInWithProvider(provider.id)}
              className="w-full"
            >
              {provider.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or email</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={signInWithEmail} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send magic link"}
          </Button>
        </form>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
