import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const variantStyles = {
  primary: "bg-class-mage hover:bg-class-mage/80 text-white border-class-mage",
  secondary: "bg-bg-panel hover:bg-bg-hover text-text-primary border-border",
  ghost: "bg-transparent hover:bg-bg-hover text-text-secondary border-transparent",
  danger: "bg-red-600 hover:bg-red-500 text-white border-red-500",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, disabled, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "font-semibold rounded-lg border",
          "transition-all duration-150",
          "active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-class-mage focus:ring-offset-2 focus:ring-offset-bg-dark",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";