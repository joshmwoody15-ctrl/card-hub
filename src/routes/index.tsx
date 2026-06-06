import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { MARKETPLACES } from "@/lib/marketplaces";
import { Search, LineChart, Bell, ScanLine, Library } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Card Hub — Live sports card comps from every marketplace" },
      { name: "description", content: "Pull recent sales for any sports card across eBay, Fanatics Collect, Beckett, COMC, Whatnot, Sportlots, MySlabs, and CollX. Scan your collection, set price alerts, and track the market." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero — massive bold typography on black, gold accent */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-36">
          <p className="mb-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Sports card market intelligence
          </p>
          <h1 className="font-display text-[14vw] leading-[0.9] md:text-[10rem]">
            CARD HUB
          </h1>
          <div className="mt-10 h-px w-full bg-border" />
          <div className="mt-10 grid gap-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-display text-3xl text-[var(--gold)] underline decoration-[var(--gold)] decoration-2 underline-offset-8 md:text-5xl">
                Every comp. Every marketplace.
              </h2>
              <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
                Card Hub pulls live sold listings from eBay, Fanatics Collect, Beckett, COMC, Whatnot, Sportlots, MySlabs, and CollX — then tracks them, charts them, and helps you build a real collection.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild className="font-display tracking-widest"><Link to="/auth">Get Started</Link></Button>
                <Button size="lg" variant="outline" asChild className="font-display tracking-widest"><Link to="/auth">Sign In</Link></Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 self-end text-center font-display text-xs tracking-widest">
              <Stat n="8" label="Markets" />
              <Stat n="∞" label="Comps" />
              <Stat n="0%" label="Fees" />
            </div>
          </div>
        </div>
      </section>

      {/* Marketplaces strip */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="mb-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">Pulling sold data from</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {MARKETPLACES.map((m) => (
              <div key={m.id} className="border border-border px-3 py-4 text-center font-display text-sm tracking-widest">
                {m.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">01 — What it does</p>
          <h2 className="mt-4 font-display text-5xl md:text-7xl">
            Built for <span className="text-[var(--gold)]">serious</span> collectors.
          </h2>
          <div className="mt-14 grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            <Feature icon={<Search className="h-6 w-6" />} title="Unified Comp Search" body="Type a card. We scrape every marketplace in parallel and merge the results into one clean view." />
            <Feature icon={<ScanLine className="h-6 w-6" />} title="Scan & Collect" body="Snap a photo, AI identifies the card, and it joins your collection with a live market value." />
            <Feature icon={<LineChart className="h-6 w-6" />} title="Price History" body="Recharts-powered trend lines so you can see how a card's market is moving over time." />
            <Feature icon={<Bell className="h-6 w-6" />} title="Price Alerts" body="Set a floor or ceiling on any card. We watch the market and ping you when it crosses." />
          </div>
        </div>
      </section>

      {/* Collection callout */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">02 — Your collection</p>
            <h2 className="mt-4 font-display text-5xl md:text-7xl leading-[0.9]">
              Scan it.<br />
              <span className="text-primary">Track it.</span><br />
              <span className="text-[var(--gold)]">Own it.</span>
            </h2>
            <p className="mt-6 max-w-md text-muted-foreground">
              Upload a photo, let AI identify the card, organize into folders, and watch each card's value move with the market — auto-linked to live comp data.
            </p>
            <Button asChild size="lg" className="mt-8 font-display tracking-widest"><Link to="/auth"><Library className="mr-2 h-4 w-4" />Start your collection</Link></Button>
          </div>
          <div className="border border-border p-8">
            <ol className="space-y-8">
              <Step n="01" title="Snap a photo">Front and back. Camera or upload.</Step>
              <Step n="02" title="AI identifies">Player, year, set, parallel, grade — confirmed by you.</Step>
              <Step n="03" title="Live valuation">30-day median across every marketplace, updated continuously.</Step>
            </ol>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
          <p className="font-display text-sm tracking-widest text-muted-foreground">© {new Date().getFullYear()} CARD HUB</p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Data sourced via Firecrawl · Read-only market tracker</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="border border-border p-4">
      <div className="font-display text-4xl text-[var(--gold)]">{n}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: React.ReactNode }) {
  return (
    <div className="bg-background p-8">
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border border-[var(--gold)]/40 text-[var(--gold)]">{icon}</div>
      <h3 className="font-display text-2xl tracking-wide">{title}</h3>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5">
      <span className="font-display text-2xl text-[var(--gold)]">{n}</span>
      <div>
        <p className="font-display text-lg tracking-wide">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
