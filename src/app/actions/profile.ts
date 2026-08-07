"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { profileFormSchema } from "@/lib/validations";
import { createLogger } from "@/lib/logger";
import { FLYERS_BUCKET } from "@/lib/types";

const log = createLogger("profile-actions");

export type ProfileActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfileAction(
  formData: FormData
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/profile");
  }

  const parsed = profileFormSchema.safeParse({
    first_name: String(formData.get("first_name") || ""),
    last_name: String(formData.get("last_name") || ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Invalid profile data",
    };
  }

  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `avatars/${user.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(FLYERS_BUCKET)
      .upload(path, avatarFile, {
        contentType: avatarFile.type || "image/jpeg",
        upsert: true,
      });
    if (uploadError) {
      log.error({ err: uploadError }, "Avatar upload failed");
      return { ok: false, error: uploadError.message };
    }
    const { data } = supabase.storage.from(FLYERS_BUCKET).getPublicUrl(path);
    avatarUrl = data.publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", user.id);

  if (error) {
    log.error({ err: error }, "Profile update failed");
    return { ok: false, error: error.message };
  }

  log.info({ userId: user.id }, "Profile updated");
  revalidatePath("/account/profile");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Permanently deletes the signed-in user's account and associated personal data.
 * Uses the service-role client to remove auth.users (cascades to profiles and related rows).
 */
export async function deleteAccountAction(): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/data-deletion");
  }

  const userId = user.id;
  const admin = createServiceClient();

  try {
    const { data: createdEvents } = await admin
      .from("events")
      .select("id")
      .eq("creator_id", userId);

    const eventIds = (createdEvents || []).map((e) => e.id);

    if (eventIds.length > 0) {
      const { data: flyers } = await admin
        .from("event_flyers")
        .select("storage_path")
        .in("event_id", eventIds);

      const flyerPaths = (flyers || []).map((f) => f.storage_path);
      if (flyerPaths.length > 0) {
        const { error: flyerRemoveError } = await admin.storage
          .from(FLYERS_BUCKET)
          .remove(flyerPaths);
        if (flyerRemoveError) {
          log.error(
            { err: flyerRemoveError, userId },
            "Failed to remove event flyer files during account deletion"
          );
        }
      }

      // Orders/tickets reference events with ON DELETE RESTRICT — clear them first.
      await admin.from("tickets").delete().in("event_id", eventIds);
      await admin.from("orders").delete().in("event_id", eventIds);
      await admin.from("event_flyers").delete().in("event_id", eventIds);
      await admin.from("event_cohosts").delete().in("event_id", eventIds);
      await admin.from("events").delete().in("id", eventIds);
    }

    // Remove purchases for events the user did not create
    await admin.from("tickets").delete().eq("buyer_id", userId);
    await admin.from("orders").delete().eq("buyer_id", userId);
    await admin.from("event_cohosts").delete().eq("user_id", userId);

    const { data: avatarFiles } = await admin.storage
      .from(FLYERS_BUCKET)
      .list("avatars", { search: userId });

    if (avatarFiles && avatarFiles.length > 0) {
      const avatarPaths = avatarFiles.map((f) => `avatars/${f.name}`);
      await admin.storage.from(FLYERS_BUCKET).remove(avatarPaths);
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      log.error({ err: deleteUserError, userId }, "Failed to delete auth user");
      return {
        ok: false,
        error: deleteUserError.message || "Could not delete account",
      };
    }

    await supabase.auth.signOut();
    log.info({ userId }, "Account and associated data deleted");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Account deletion failed";
    log.error({ err, userId }, "Account deletion exception");
    return { ok: false, error: message };
  }
}
