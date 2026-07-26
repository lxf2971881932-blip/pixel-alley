import { PixelPaw, PixelPlant, PixelYarn, PixelBone } from "@/components/hammy/pixel-icons";

export function RoomHeader() {
  return (
    <header className="relative flex flex-col items-center pt-4 text-center sm:pt-6">
      <div className="pointer-events-none absolute left-0 top-6 hidden flex-col gap-4 text-[#ff77a8] sm:left-2 sm:flex">
        <PixelPlant
          size={40}
          className="animate-[hammy-bob_3s_ease-in-out_infinite]"
        />
        <PixelPaw size={34} />
      </div>
      <div className="pointer-events-none absolute right-0 top-6 hidden flex-col items-end gap-4 text-[#ff77a8] sm:right-2 sm:flex">
        <PixelYarn
          size={40}
          className="animate-[hammy-bob_2.6s_ease-in-out_infinite]"
        />
        <PixelBone size={34} />
      </div>

      <h1 className="font-pixel neon-brand text-3xl uppercase leading-tight sm:text-5xl">
        Pixel Alley
      </h1>

      <p className="mt-5 max-w-xl px-4 font-mono text-lg leading-relaxed text-gray-300 sm:text-xl">
        Upload a photo of your pet and let them wait for you in the Midnight
        Pixel Alley.
      </p>
    </header>
  );
}
