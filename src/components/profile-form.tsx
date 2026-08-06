"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import type { Profile } from "@/lib/types";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ProfileFormProps = {
  profile: Profile;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
        <CardDescription>
          Update your name and avatar. Email comes from your identity provider
          and cannot be changed here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={profile.avatar_url || undefined}
                alt={profile.first_name || profile.email}
              />
              <AvatarFallback>
                {(profile.first_name?.[0] || profile.email[0] || "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 flex-1">
              <Label htmlFor="avatar">Avatar</Label>
              <Input id="avatar" name="avatar" type="file" accept="image/*" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              name="first_name"
              required
              defaultValue={profile.first_name || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              name="last_name"
              required
              defaultValue={profile.last_name || ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-muted-foreground" role="status">
              Profile saved.
            </p>
          ) : null}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
