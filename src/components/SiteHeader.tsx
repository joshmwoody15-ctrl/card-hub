import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Logo />
        {user && (
          <nav className="hidden items-center gap-10 md:flex">
            <NavLink to="/search">Search</NavLink>
            <NavLink to="/watchlist">Watchlist</NavLink>
            <NavLink to="/collection">Collection</NavLink>
            <NavLink to="/alerts">Alerts</NavLink>
          </nav>
        )}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign in</Link></Button>
              <Button size="sm" asChild><Link to="/auth">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="font-display text-sm uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:text-foreground [&.active]:underline [&.active]:underline-offset-8 [&.active]:decoration-[var(--gold)] [&.active]:decoration-2"
      activeProps={{ className: "active" }}
    >
      {children}
    </Link>
  );
}

