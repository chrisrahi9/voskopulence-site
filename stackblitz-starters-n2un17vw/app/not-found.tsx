export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Page not found</h1>
        <p>
          The page you’re looking for doesn’t exist.{" "}
          <a href="/" style={{ textDecoration: 'underline' }}>Go home</a>.
        </p>
      </div>
    </main>
  );
}
