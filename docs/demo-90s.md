# Guion de demo — 90 segundos

**0–10 s.** “Monetizar una API suele empezar con cuentas, tarjetas y facturación. MeterKit lo reduce a una wallet y un precio.”

**10–22 s.** Conectar wallet en devnet. Mostrar “Premium Weather API”, precio 0,01 USDC y endpoint generado.

**22–35 s.** Ejecutar el cliente sin recibo. Mostrar `402 Payment Required` y el header `PAYMENT-REQUIRED`: red devnet, mint USDC, monto y destinatario.

**35–50 s.** Aprobar en la wallet local. El cliente reintenta automáticamente con `PAYMENT-SIGNATURE`. Mostrar respuesta meteorológica protegida.

**50–62 s.** Abrir el recibo y la transacción en Solana Explorer. Señalar que USDC fue directamente de cliente a proveedor y MeterKit nunca tomó custodia.

**62–70 s.** Repetir exactamente el recibo: `409 payment_replayed`.

**70–80 s.** Dashboard: nueva venta, monto, estado finalized y enlace Explorer.

**80–87 s.** Abrir Solana Project Scout: primera consulta gratis; segunda devuelve 402; pagar y mostrar reporte con fuentes/fecha.

**87–90 s.** “MeterKit: tres líneas para empezar a cobrar software en USDC.”

Plan de contingencia: video/capturas de una transacción devnet ya finalizada y recibo redactado; nunca cambiar a mainnet durante la demo.

