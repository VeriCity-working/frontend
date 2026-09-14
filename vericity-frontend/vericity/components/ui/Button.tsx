import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-ink text-paper-raised hover:bg-ink-soft disabled:bg-ink/40",
  secondary: "bg-transparent text-ink border border-ink/30 hover:border-ink hover:bg-ink/5",
  ghost: "bg-transparent text-ink/70 hover:text-ink hover:bg-ink/5",
  danger: "bg-brick text-paper-raised hover:bg-brick/90 disabled:bg-brick/40"
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", fullWidth, className = "", children, ...rest }, ref) => (
    <button
      ref={ref}
      className={[
        "inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-medium",
        "transition-colors duration-150 disabled:cursor-not-allowed",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel",
        fullWidth ? "w-full" : "",
        variantClasses[variant],
        className
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";
