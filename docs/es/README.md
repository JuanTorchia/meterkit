# Documentación de MeterKit en español

MeterKit permite cobrar USDC de devnet por APIs y herramientas MCP sin custodiar
fondos ni claves privadas. Este es el punto de entrada mantenido para builders de
Latinoamérica.

## Primeros pasos

1. Consulte la [guía principal y entorno local](../../README.md#guía-detallada-en-español).
2. Revise la [arquitectura](../architecture.md) y el
   [modelo de amenazas](../security.md).
3. Use el [quickstart del SDK](../sdk-quickstart.md) para obtener el primer HTTP 402. Actualmente sus instrucciones operativas están en inglés; los comandos
   son independientes del idioma.
4. Para una integración externa real, siga el
   [quickstart de pilotos](../pilot-quickstart.md), que actualmente se mantiene en
   inglés para conservar un único formulario global de evidencia.
5. Lea [CONTRIBUTING.md](../../CONTRIBUTING.md) antes de modificar el proyecto.

Los documentos técnicos en español permanecen directamente bajo `docs/`. Las
traducciones inglesas completas de documentos originalmente españoles viven en
`docs/en/` con el mismo nombre base. Un cambio de comportamiento o seguridad debe
actualizar ambos idiomas en el mismo pull request.

Si dos documentos se contradicen, la implementación y las pruebas automatizadas
definen el comportamiento. Abra un issue de documentación en vez de depender de
la descripción más permisiva.
