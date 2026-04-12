import { createClient } from "@/lib/supabase/server";

export default async function SpendPage() {
  const supabase = await createClient();

  const { data: spendData } = await supabase
    .from("monthly_spend")
    .select("*")
    .order("month_year", { ascending: false })
    .limit(6);

  const currentMonth = spendData?.[0];
  const capPercentage = currentMonth
    ? Math.round((currentMonth.total_cost_cents / currentMonth.cap_cents) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">API Spend Dashboard</h1>

      {capPercentage >= 80 && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-300 p-4 dark:bg-amber-900/30 dark:border-amber-700">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Warning: Monthly spend is at {capPercentage}% of the cap.
            {capPercentage >= 100 && " AI generation is currently disabled."}
          </p>
        </div>
      )}

      {/* Current Month */}
      {currentMonth ? (
        <div className="au-card mb-8 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Current Month ({currentMonth.month_year})
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm au-text-muted">Tokens Used</p>
              <p className="text-2xl font-bold">
                {currentMonth.total_tokens.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm au-text-muted">Cost</p>
              <p className="text-2xl font-bold">
                ${(currentMonth.total_cost_cents / 100).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm au-text-muted">Cap</p>
              <p className="text-2xl font-bold">
                ${(currentMonth.cap_cents / 100).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 w-full rounded-full" style={{ background: "var(--muted-bg)" }}>
            <div
              className={`h-3 rounded-full transition-all ${
                capPercentage >= 80
                  ? "bg-amber-500"
                  : capPercentage >= 100
                    ? "bg-red-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${Math.min(100, capPercentage)}%` }}
            />
          </div>
          <p className="mt-1 text-xs au-text-muted text-right">
            {capPercentage}% used
          </p>
        </div>
      ) : (
        <div className="au-card mb-8 p-6 text-center">
          <p className="au-text-muted">No spend data yet.</p>
        </div>
      )}

      {/* History */}
      {spendData && spendData.length > 1 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">History</h2>
          <div className="space-y-2">
            {spendData.slice(1).map((month) => (
              <div
                key={month.month_year}
                className="au-card flex items-center justify-between p-3"
              >
                <span className="text-sm font-medium">{month.month_year}</span>
                <div className="flex gap-6 text-sm au-text-muted">
                  <span>{month.total_tokens.toLocaleString()} tokens</span>
                  <span>
                    ${(month.total_cost_cents / 100).toFixed(2)} / $
                    {(month.cap_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
