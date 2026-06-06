import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/format";
import { ImageIcon } from "lucide-react";

type Props = {
  card: {
    id: string;
    display_title: string;
    grade: string | null;
    front_image_path: string | null;
    purchase_price_cents: number | null;
  };
  imageUrl: string | null;
  estimatedValueCents: number | null;
};

export function CollectionCard({ card, imageUrl, estimatedValueCents }: Props) {
  return (
    <Link
      to="/collection/card/$cardId"
      params={{ cardId: card.id }}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={card.display_title} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-40" />
          </div>
        )}
        {card.grade && (
          <span className="absolute left-2 top-2 rounded-md bg-foreground/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background">
            {card.grade}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{card.display_title}</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-xs text-muted-foreground">Est. value</span>
          <span className="font-display text-base text-[var(--gold)] tabular">
            {estimatedValueCents == null ? "—" : formatPrice(estimatedValueCents)}
          </span>
        </div>
      </div>
    </Link>
  );
}
