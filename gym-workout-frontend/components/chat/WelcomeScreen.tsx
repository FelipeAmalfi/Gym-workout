const SUGGESTIONS = [
  "Create a chest workout for me",
  "List all my workouts",
  "Show me a beginner leg routine",
  "Create a full body workout",
];

interface WelcomeScreenProps {
  onSuggest: (text: string) => void;
}

export function WelcomeScreen({ onSuggest }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4 py-12 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
          🏋️
        </div>
        <h1 className="text-2xl font-bold text-foreground">Gym Workout AI</h1>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          Your personal workout assistant. Ask me to create, list, or manage your workouts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/40 transition-colors text-sm text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
