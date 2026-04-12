import AuthButton from "./AuthButton";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <a href="/" className="text-xl font-bold tracking-tight">
            Word Factory
          </a>
          <div className="hidden items-center gap-4 sm:flex">
            <a
              href="/words"
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-[#8A8F98] dark:hover:text-white"
            >
              Browse
            </a>
            <a
              href="/words/new"
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-[#8A8F98] dark:hover:text-white"
            >
              Submit
            </a>
            <a
              href="/leaderboard"
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-[#8A8F98] dark:hover:text-white"
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
