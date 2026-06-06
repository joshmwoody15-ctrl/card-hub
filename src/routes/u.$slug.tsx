import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPublicCollection } from "@/lib/collection.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { CollectionCard } from "@/components/CollectionCard";


export const Route = createFileRoute("/u/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} · Card Hub collection` },
      { name: "description", content: "A public sports card collection on Card Hub." },
    ],
  }),
  component: PublicCollectionPage,
});

function PublicCollectionPage() {
  const { slug } = Route.useParams();
  const fn = useServerFn(getPublicCollection);
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-collection", slug],
    queryFn: () => fn({ data: { slug } }),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-10">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && (
          <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">{(error as Error).message}</p>
          </div>
        )}
        {data && (
          <>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Public collection</div>
            <h1 className="font-display text-4xl md:text-5xl">{data.collection.name}</h1>
            {data.collection.description && (
              <p className="mt-2 max-w-2xl text-muted-foreground">{data.collection.description}</p>
            )}
            {data.owner && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span>by {data.owner.display_name ?? "anonymous"}</span>
              </div>
            )}


            <div className="mt-8">
              {data.cards.length === 0 ? (
                <p className="text-muted-foreground">No cards yet.</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {data.cards.map((c) => (
                    <li key={c.id}>
                      <CollectionCard
                        card={c}
                        imageUrl={c.front_image_path ? data.signedUrls[c.front_image_path] ?? null : null}
                        estimatedValueCents={null}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
