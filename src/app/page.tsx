import { HomeHeroCta } from "@/components/home/home-hero-cta";

/** Mini mock of the Chrome new-tab product (finished look). */
function NewTabPreview() {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border-2 border-[#ff77a8] bg-[#0b0f19] shadow-[0_0_25px_rgba(255,119,168,0.35)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/midnight-lofi.png"
        alt="Pixel Alley new tab preview"
        className="absolute inset-0 h-full w-full object-cover object-center pixelated"
      />
      <div className="absolute inset-0 bg-black/15" />

      {/* Clock */}
      <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
        <p className="font-pixel text-xl text-white drop-shadow-[2px_2px_0_#000] sm:text-2xl">
          23:42
        </p>
        <p className="mt-1 font-pixel text-[7px] text-white/90 drop-shadow-[1px_1px_0_#000] sm:text-[8px]">
          SATURDAY, MAY 18
        </p>
      </div>

      {/* Search */}
      <div className="absolute left-1/2 top-[34%] z-10 w-[72%] max-w-[320px] -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-9 items-center gap-2 rounded-full border-2 border-[#ff77a8] bg-black/40 px-3 shadow-[0_0_12px_rgba(255,119,168,0.45)] backdrop-blur-sm sm:h-10">
          <span className="text-[#ff77a8]">⌕</span>
          <span className="font-mono text-sm text-white/55">Search the night...</span>
        </div>
        <p className="mt-2 text-center font-pixel text-[6px] text-white/80 drop-shadow-[0_0_6px_rgba(255,119,168,0.7)]">
          ✦ Google Search ✦
        </p>
      </div>

      {/* Demo pet on the street — finished new-tab look */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/demo-alley-pet.png"
        alt="Your pixel pet"
        className="pointer-events-none absolute z-20 pixelated object-contain object-bottom"
        style={{
          left: "46%",
          bottom: "2%",
          width: "min(14%, 96px)",
          transform: "translateX(-50%)",
          filter: "drop-shadow(0 0 12px rgba(255,119,168,0.85))",
          imageRendering: "pixelated",
        }}
      />

      <div className="absolute bottom-3 left-3 rounded-md border border-[#ff77a8]/70 bg-black/70 px-2 py-1 font-pixel text-[7px] uppercase text-[#ff77a8]">
        New tab preview
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      {/* Soft edge accents like the Build reference */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-1/3 h-24 w-2 bg-gradient-to-b from-[#ff77a8] via-[#5b8cff] to-transparent opacity-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 h-16 w-3 bg-gradient-to-b from-[#f6d55c] via-[#ff77a8] to-transparent opacity-80"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        {/* Hero — centered */}
        <section className="flex flex-col items-center text-center">
          <h1 className="font-pixel neon-brand text-4xl uppercase leading-tight tracking-wide sm:text-6xl">
            Pixel Alley
          </h1>
          <p className="mt-5 max-w-xl font-mono text-lg text-[#7dd3fc] sm:text-xl">
            Turn your pet into a midnight lo-fi companion.
          </p>
          <HomeHeroCta />
        </section>

        {/* Feature — left copy / right product preview */}
        <section className="mt-14 grid items-center gap-8 lg:mt-20 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <h2 className="font-pixel text-base uppercase leading-relaxed text-white sm:text-lg">
              Upload a photo of your pet and let them wait for you in the
              Midnight Pixel Alley.
            </h2>
            <p className="mt-4 font-mono text-base leading-relaxed text-gray-400">
              Generate a neon pixel companion, grab a sync code, and open any
              new tab to find them under the sakura lights.
            </p>
          </div>

          <NewTabPreview />
        </section>
      </div>
    </main>
  );
}
