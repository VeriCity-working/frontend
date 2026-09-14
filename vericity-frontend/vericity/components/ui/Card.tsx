import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-paper-line bg-paper-raised shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
