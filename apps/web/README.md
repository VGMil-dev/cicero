<p align="center">
  <img src="../../assets/logo.png" alt="Cicero" width="140" />
</p>

<h1 align="center">Web de Cicero</h1>

Aplicacion principal de Cicero construida con **Next.js 16** y enfoque **PWA**.

## Requisitos

- Node.js 20 o superior
- pnpm

## Instalacion

```bash
pnpm install
```

## Desarrollo local

Desde la raiz del repositorio:

```bash
pnpm dev:web
```

O desde `apps\web\`:

```bash
pnpm dev
```

## Build

Desde la raiz del repositorio:

```bash
pnpm build:web
```

O desde `apps\web\`:

```bash
pnpm build
```

## Test

Desde la raiz del repositorio:

```bash
pnpm test:web
```

O desde `apps\web\`:

```bash
pnpm test
```

## Typecheck

Desde la raiz del repositorio:

```bash
pnpm typecheck:web
```

O desde `apps\web\`:

```bash
pnpm typecheck
```

## Lint

Desde la raiz del repositorio:

```bash
pnpm lint
```

O desde `apps\web\`:

```bash
pnpm lint
```

## Notas

- Para `dev`, `build`, `test` y `typecheck`, prioriza los atajos del `package.json` raiz.
- Si prefieres entrar al workspace, ejecuta estos comandos dentro de `apps\web\`.
- Esta app usa `next dev --webpack` y `next build --webpack` para mantener compatibilidad con Serwist.
