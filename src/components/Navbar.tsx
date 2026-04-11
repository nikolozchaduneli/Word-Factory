import AuthButton from "./AuthButton";

export default function Navbar() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <a href="/" className="text-xl font-bold tracking-tight">
            Word Factory
          </a>
          <div className="hidden items-center gap-4 sm:flex">
            <a
              href="/words"
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Browse
            </a>
            <a
              href="/words/new"
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Submit
            </a>
            <a
              href="/leaderboard"
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Leaderboard
            </a>
          </div>
        </div>
        <AuthButton />
      </nav>
    </header>
  );
}
