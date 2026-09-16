
interface PlaceholderViewProps {
  title: string;
}

export function PlaceholderView({ title }: PlaceholderViewProps) {
  return (
    <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-main)', marginBottom: 'var(--spacing-4)' }}>
        {title}
      </h2>
      <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
        This is a placeholder screen for the <strong>{title}</strong> feature. 
        You can build out this page later. For now, it serves as a live preview target for the Theme Studio.
      </p>
      <div style={{ marginTop: 'var(--spacing-6)' }}>
        <button style={{
          backgroundColor: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-3) var(--spacing-5)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          Primary Action
        </button>
      </div>
    </div>
  );
}
