"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
