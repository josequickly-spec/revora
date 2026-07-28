"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#020617",
          color: "#f8fafc",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: 520, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>
            No pudimos cargar esta página
          </h1>
          <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
            Ocurrió un error inesperado. Puedes volver a intentarlo sin perder
            la información que ya se haya guardado.
          </p>
          {error.digest && (
            <p style={{ color: "#64748b", fontSize: 12 }}>
              Referencia: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              border: 0,
              borderRadius: 10,
              padding: "12px 20px",
              background: "#059669",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Intentar nuevamente
          </button>
        </main>
      </body>
    </html>
  );
}
