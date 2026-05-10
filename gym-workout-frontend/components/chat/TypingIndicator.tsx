interface TypingIndicatorProps {
  isServerWaking?: boolean;
}

export function TypingIndicator({ isServerWaking }: TypingIndicatorProps) {
  return (
    <div className="flex items-start gap-3 max-w-3xl">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm">
        🤖
      </div>
      <div className="flex flex-col gap-1">
        <div className="rounded-2xl rounded-tl-sm bg-assistant-bubble px-4 py-3 inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-muted-foreground dot-1" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground dot-2" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground dot-3" />
        </div>
        {isServerWaking && (
          <p className="text-xs text-muted-foreground ml-1">
            Server is waking up, this may take a moment…
          </p>
        )}
      </div>
    </div>
  );
}
