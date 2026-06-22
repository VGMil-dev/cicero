<p align="center">
  <img src="../../assets/logo.png" alt="Cicero" width="140" />
</p>

<h1 align="center">Docs de Cicero</h1>

Este sitio esta construido con Docusaurus y concentra la documentacion tecnica del proyecto: vision objetivo, decisiones de arquitectura y estado actual en transicion.

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
pnpm dev:docs
```

O desde `apps\docs\`:

```bash
pnpm start
```

## Build

Desde la raiz del repositorio:

```bash
pnpm build:docs
```

O desde `apps\docs\`:

```bash
pnpm build
```

## Typecheck

Desde la raiz del repositorio:

```bash
pnpm typecheck:docs
```

O desde `apps\docs\`:

```bash
pnpm typecheck
```

## Notas

- Para `dev`, `build` y `typecheck`, prioriza los atajos del `package.json` raiz.
- Si prefieres entrar al workspace, ejecuta estos comandos dentro de `apps\docs\`.
- La configuracion del sitio vive en `docusaurus.config.ts`.
- La documentacion fuente vive en `apps\docs\docs\` y la bitacora en `apps\docs\bitacora\`.
