"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAccountAction } from "@/app/actions/profile";
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

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountCard() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_PHRASE;

  function handleDelete() {
    setError(null);
    if (!canDelete) return;

    startTransition(async () => {
      const result = await deleteAccountAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/data-deletion?deleted=1");
      router.refresh();
    });
  }

  return (
    <Card className="max-w-lg border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Delete account</CardTitle>
        <CardDescription>
          Permanently delete your Band Guru account and associated personal
          data. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Your profile, avatar, and sign-in identities are removed</li>
          <li>Events you created and their flyers are removed</li>
          <li>Your ticket orders and ticket records are removed</li>
          <li>Payment records may be retained by Stripe as required by law</li>
        </ul>
        <div className="space-y-2">
          <Label htmlFor="confirm_delete">
            Type {CONFIRM_PHRASE} to confirm
          </Label>
          <Input
            id="confirm_delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            placeholder={CONFIRM_PHRASE}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          variant="destructive"
          disabled={!canDelete || isPending}
          onClick={handleDelete}
        >
          {isPending ? "Deleting…" : "Delete my account and data"}
        </Button>
      </CardContent>
    </Card>
  );
}
