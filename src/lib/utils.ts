import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Yeh function multiple classes ko safely merge karta hai (Tailwind conflicts hatata hai)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}