# Publicar MeterKit 0.1.0

La publicación utiliza GitHub Actions y npm trusted publishing. No requiere ni
acepta guardar un token npm de larga duración en el repositorio.

## Preparación única

1. Crear o confirmar el scope público `@meterkit` en npm.
2. En npm, agregar un trusted publisher para este repositorio, workflow
   `.github/workflows/release.yml` y environment `npm`.
3. En GitHub, crear el environment `npm`; opcionalmente exigir un reviewer.
4. Confirmar que `@meterkit/core` y `@meterkit/sdk` continúan en la misma versión.

## Verificación y publicación

```bash
pnpm install --frozen-lockfile
pnpm release:verify
node scripts/verify-release-version.mjs v0.1.0
```

Después de que el PR esté fusionado y CI verde, crear el tag anotado `v0.1.0` y
una GitHub Release no prerelease. El workflow valida el tag, reconstruye ambos
paquetes y publica primero core y luego SDK con provenance.

Confirmar la publicación desde un directorio vacío:

```bash
npm view @meterkit/core@0.1.0 version
npm view @meterkit/sdk@0.1.0 version
```

Si falla la publicación, no reutilizar ni mover el tag. Corregir la configuración,
mantener la release sin anunciar y reejecutar el job fallido. No publicar el SDK
si core no está públicamente disponible.
