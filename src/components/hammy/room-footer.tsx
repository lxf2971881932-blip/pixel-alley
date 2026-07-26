import {
  PixelPaw,
  PixelYarn,
  PixelBone,
  PixelPlant,
  PixelHeart,
} from "@/components/hammy/pixel-icons";

export function RoomFooter() {
  return (
    <footer className="mt-6 rounded-xl border-2 border-[#ff77a8] bg-black/50 px-4 py-3 shadow-[0_0_15px_rgba(255,119,168,0.2)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 text-[#ff77a8]">
        <div className="flex items-center gap-3">
          <PixelPaw size={22} />
          <PixelPlant size={22} />
        </div>
        <p className="text-center font-mono text-base leading-none text-gray-300">
          Waiting for you in Midnight Pixel Alley
        </p>
        <div className="flex items-center gap-3">
          <PixelYarn size={22} />
          <PixelBone size={22} />
          <PixelHeart size={22} />
        </div>
      </div>
    </footer>
  );
}
