import { DashboardClient } from "./dashboard-client";

export default function Home() {
  return (
    <main>
      <nav>
        <a className="brand" href="#"><span className="mark">M</span> MeterKit</a>
        <div className="navlinks"><a href="#products">Productos</a><a href="#payments">Pagos</a><a href="#docs">Docs</a></div>
        <a className="wallet" href="#products"><span className="dot" /> Abrir dashboard</a>
      </nav>

      <section className="hero">
        <div className="eyebrow">OPEN SOURCE · SOLANA DEVNET</div>
        <h1>Tu API merece<br /><em>cobrar por sí sola.</em></h1>
        <p>Conecta una wallet, fija un precio y acepta USDC por solicitud o suscripción. Sin cuentas, tarjetas ni custodia.</p>
        <div className="actions"><a className="primary" href="#products">Crear un producto →</a><a className="secondary" href="#docs">Ver integración</a></div>
        <div className="proof"><span>✓ Liquidación directa</span><span>✓ Recibos verificables</span><span>✓ x402 nativo</span></div>
      </section>

      <DashboardClient />

      <section className="codeSection" id="docs">
        <div><span className="kicker">TRES LÍNEAS</span><h2>Protege tu endpoint.<br />Sigue construyendo.</h2><p>MeterKit responde 402, valida el pago y entrega el contenido. Tú conservas el control y recibes USDC directamente.</p></div>
        <pre><span>import</span> {"{ createX402Middleware }"} <span>from</span> <b>&quot;@meterkit/sdk&quot;</b>;{"\n\n"}app.get(<b>&quot;/premium&quot;</b>, createX402Middleware({"{\n  "}product, store,{"\n  "}facilitatorUrl: <b>&quot;https://x402.org/facilitator&quot;</b>{"\n}"}), handler);</pre>
      </section>
      <footer><a className="brand" href="#"><span className="mark">M</span> MeterKit</a><span>USDC payments for the agentic web.</span><span>Apache-2.0 · No custody · No token</span></footer>
    </main>
  );
}
