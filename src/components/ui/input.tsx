import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border-2 border-[#ff77a8]/50 bg-white/10 px-3 py-2 font-mono text-lg text-white outline-none placeholder:text-gray-400 transition-all focus-visible:border-[#ff77a8] focus-visible:shadow-[0_0_15px_rgba(255,119,168,0.45)] disabled:cursor-not-allowed disabled:opacity-50 file:mr-3 file:border-0 file:bg-transparent file:font-sans file:text-[9px] file:uppercase file:text-[#ff77a8]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
