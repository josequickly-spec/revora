import React from "react";

interface LandingPageData {
  businessName: string;
  headline: string;
  subheadline: string;
  painPoint: string;
  solution: string;
  proofCopy: string;
  ctaText: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  offerBadge: string;
  bonusOffer: string;
  businessEmail: string;
  businessPhone?: string;
}

export function buildLandingPageHTML(data: LandingPageData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.businessName} - ${data.headline}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* HEADER */
    header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 16px 0;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-weight: 700;
      font-size: 18px;
      color: ${data.colors.primary};
    }
    .nav-buttons {
      display: flex;
      gap: 12px;
    }

    /* HERO */
    .hero {
      background: linear-gradient(135deg, ${data.colors.primary}22 0%, ${data.colors.secondary}22 100%);
      padding: 80px 0;
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: ${data.colors.accent};
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .hero h1 {
      font-size: 48px;
      font-weight: 900;
      margin-bottom: 16px;
      color: ${data.colors.primary};
      line-height: 1.2;
    }
    .hero p {
      font-size: 20px;
      color: #6b7280;
      margin-bottom: 32px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    /* AGITATION & SOLUTION */
    .section {
      padding: 60px 0;
      background: white;
      margin: 40px 0;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    }
    .section h2 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 24px;
      color: #111827;
    }
    .section p {
      font-size: 16px;
      line-height: 1.8;
      color: #4b5563;
      margin-bottom: 16px;
    }

    /* PROOF SECTION */
    .proof-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      margin-top: 32px;
    }
    .proof-card {
      text-align: center;
      padding: 20px;
      background: ${data.colors.primary}11;
      border-radius: 8px;
      border: 1px solid ${data.colors.primary}33;
    }
    .proof-card .number {
      font-size: 32px;
      font-weight: 900;
      color: ${data.colors.primary};
    }
    .proof-card .label {
      font-size: 13px;
      color: #6b7280;
      margin-top: 8px;
    }

    /* CTA SECTION */
    .cta-section {
      background: linear-gradient(135deg, ${data.colors.primary} 0%, ${data.colors.accent} 100%);
      color: white;
      padding: 60px 0;
      text-align: center;
      border-radius: 16px;
      margin: 60px 0;
    }
    .cta-section h2 {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 24px;
      color: white;
    }
    .cta-section p {
      font-size: 18px;
      margin-bottom: 32px;
      color: rgba(255,255,255,0.9);
    }

    /* FORM */
    .form-wrapper {
      max-width: 400px;
      margin: 0 auto;
    }
    .form-group {
      margin-bottom: 16px;
    }
    input[type="text"],
    input[type="email"],
    input[type="tel"] {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: ${data.colors.primary};
      box-shadow: 0 0 0 3px ${data.colors.primary}22;
    }
    .cta-button {
      width: 100%;
      padding: 14px 32px;
      background: white;
      color: ${data.colors.primary};
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.15);
    }

    /* FOOTER */
    footer {
      background: #1f2937;
      color: #9ca3af;
      padding: 40px 0;
      text-align: center;
      font-size: 14px;
      margin-top: 60px;
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 32px;
      }
      .hero p {
        font-size: 16px;
      }
      .section h2 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <header>
    <div class="container">
      <div class="header-content">
        <div class="logo">${data.businessName}</div>
        <div class="nav-buttons">
          <a href="#cta" style="color: #6b7280; text-decoration: none; font-size: 14px;">Información</a>
          <a href="#cta" style="color: ${data.colors.primary}; text-decoration: none; font-weight: 600;">Acceso</a>
        </div>
      </div>
    </div>
  </header>

  <!-- HERO -->
  <section class="hero">
    <div class="container">
      <div class="badge">${data.offerBadge}</div>
      <h1>${data.headline}</h1>
      <p>${data.subheadline}</p>
    </div>
  </section>

  <!-- MAIN CONTENT -->
  <main class="container">
    <!-- AGITATION -->
    <section class="section">
      <h2>El Problema</h2>
      <p>${data.painPoint}</p>
    </section>

    <!-- SOLUTION -->
    <section class="section">
      <h2>La Solución</h2>
      <p>${data.solution}</p>
      <p style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb; color: #10b981; font-weight: 600;">
        ${data.bonusOffer}
      </p>
    </section>

    <!-- PROOF -->
    <section class="section">
      <h2>Por Qué Funciona</h2>
      <p>${data.proofCopy}</p>
      <div class="proof-grid">
        <div class="proof-card">
          <div class="number">500+</div>
          <div class="label">Clientes Satisfechos</div>
        </div>
        <div class="proof-card">
          <div class="number">$50M</div>
          <div class="label">Generado para clientes</div>
        </div>
        <div class="proof-card">
          <div class="number">98%</div>
          <div class="label">Tasa de Satisfacción</div>
        </div>
      </div>
    </section>

    <!-- CTA SECTION -->
    <section class="cta-section" id="cta">
      <div class="container">
        <h2>¿Listo para Comenzar?</h2>
        <p>Acceso inmediato. Sin tarjeta de crédito. Garantía de satisfacción.</p>
        <form class="form-wrapper" onsubmit="handleSubmit(event)">
          <div class="form-group">
            <input type="text" placeholder="Tu Nombre" required>
          </div>
          <div class="form-group">
            <input type="email" placeholder="Tu Email" required>
          </div>
          <div class="form-group">
            <input type="tel" placeholder="Tu Teléfono (Opcional)">
          </div>
          <button type="submit" class="cta-button">${data.ctaText}</button>
        </form>
        <p style="margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.7);">
          Tratamos tu privacidad con seriedad. ${data.businessEmail}
        </p>
      </div>
    </section>
  </main>

  <!-- FOOTER -->
  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${data.businessName}. Todos los derechos reservados.</p>
    </div>
  </footer>

  <script>
    function handleSubmit(event) {
      event.preventDefault();
      const data = new FormData(event.target);
      console.log('Form submitted:', Object.fromEntries(data));
      // Aquí iría la integración real con Resend/email
      alert('¡Gracias! Te contactaremos pronto.');
    }
  </script>
</body>
</html>
  `;
}

export function LandingPagePreview({ data }: { data: LandingPageData }) {
  const html = buildLandingPageHTML(data);
  return (
    <iframe
      srcDoc={html}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        borderRadius: "12px",
      }}
    />
  );
}
