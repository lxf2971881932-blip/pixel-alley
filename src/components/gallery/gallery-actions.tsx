"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function GalleryActions({
  petId,
  isActive,
}: {
  petId: number;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function activate() {
    setPending(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPending(false);
      return;
    }

    await supabase
      .from("pets")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .neq("id", petId);

    await supabase.from("pets").update({ is_active: true }).eq("id", petId);
    await supabase.from("user_settings").upsert({
      user_id: user.id,
      active_pet_id: petId,
      updated_at: new Date().toISOString(),
    });

    setPending(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this pet?")) return;
    setPending(true);
    const supabase = createClient();
    await supabase.from("pets").delete().eq("id", petId);
    setPending(false);
    router.refresh();
  }

  return (
    <>
      {!isActive && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={activate}
        >
          Activate
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={remove}
      >
        Delete
      </Button>
    </>
  );
}
