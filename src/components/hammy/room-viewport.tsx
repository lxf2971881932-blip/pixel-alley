"use client";

import { useRouter } from "next/navigation";
import { PixelButton } from "@/components/hammy/pixel-button";
import { PixelPaw } from "@/components/hammy/pixel-icons";
import { RoomStage } from "@/components/room/room-stage";

export function RoomViewport() {
  const router = useRouter();

  return (
    <section aria-label="Pet cozy room" className="flex flex-col gap-4">
      <RoomStage interactive={false} autoLive={false} />

      <PixelButton
        variant="orange"
        className="w-full"
        onClick={() => router.push("/upload")}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <PixelPaw size={16} />
          Upload pet photo
        </span>
      </PixelButton>
    </section>
  );
}
