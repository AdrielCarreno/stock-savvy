import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({ value, onChange, readOnly = false, size = 16 }: { value: number | null | undefined; onChange?: (n: number) => void; readOnly?: boolean; size?: number }) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn("transition-transform", !readOnly && "hover:scale-110 cursor-pointer", readOnly && "cursor-default")}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(n <= v ? "fill-yellow-400 text-yellow-400" : "fill-none text-muted-foreground")}
          />
        </button>
      ))}
    </div>
  );
}
