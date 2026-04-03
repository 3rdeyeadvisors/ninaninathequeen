export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div
        className="w-10 h-10 rounded-full"
        style={{
          border: '1.5px solid hsl(var(--gold-muted))',
          borderTopColor: 'hsl(var(--gold-light))',
          animation: 'spin 0.9s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
