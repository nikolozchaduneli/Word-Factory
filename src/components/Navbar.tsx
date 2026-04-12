import AuthButton from "./AuthButton";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <header className="au-navbar relative z-10">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <a href="/" className="text-xl font-bold tracking-tight">
            Word Factory
          </a>
          <div className="hidden items-center gap-4 sm:flex">
            <a
              href="/words"
              className="text-sm au-text-secondary transition-colors hover:text-[var(--text)]"
            >
              Browse
            </a>
            <a
              href="/words/new"
              className="text-sm au-text-secondary transition-colors hover:text-[var(--text)]"
            >
              Submit
            </a>
            <a
              href="/leaderboard"
              className="text-sm au-text-secondary transition-colors hover:text-[var(--text)]"
            >
              Leaderboard
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthButton />
        </div>
      </nav>
    </header>
  );
}
