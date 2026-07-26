import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-[#ff77a8] bg-clip-padding font-sans text-[10px] uppercase leading-relaxed tracking-tight whitespace-nowrap outline-none select-none transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-[#ff77a8]/40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-black/60 text-[#ff77a8] shadow-[0_0_15px_rgba(255,119,168,0.2)] hover:bg-[#ff77a8] hover:text-white hover:shadow-[0_0_20px_rgba(255,119,168,0.6)]",
        outline:
          "bg-black/40 text-white shadow-[0_0_12px_rgba(255,119,168,0.15)] hover:bg-[#ff77a8]/20 hover:text-white",
        secondary:
          "bg-[#f6d55c]/15 text-[#f6d55c] border-[#f6d55c] hover:bg-[#f6d55c] hover:text-[#0b0f19]",
        ghost:
          "border-transparent bg-transparent text-gray-300 shadow-none hover:bg-white/10 hover:text-white",
        destructive:
          "border-[#ff4d6d] bg-black/50 text-[#ff4d6d] hover:bg-[#ff4d6d] hover:text-white",
        link: "border-transparent bg-transparent text-[#ff77a8] underline-offset-4 shadow-none hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7 gap-1 px-2 text-[8px]",
        sm: "h-8 gap-1.5 px-3 text-[9px]",
        lg: "h-12 gap-2 px-6 text-[11px] sm:text-xs",
        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
