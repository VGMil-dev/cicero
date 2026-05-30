# Project Instructions: Cicero

## Current Repository State
- **Package Manager:** Always use `pnpm`.
- **Documentation:** The live workspace in this repository is the Docusaurus site under `docs/`.
- **Repository Scope:** Treat this repository as a documentation-first project today. Do not assume a root monorepo, app workspace, or mobile app already exists unless the files are present.

## Product Vision (Target Direction)
- **Primary Frontend Direction:** Web-first with Next.js and PWA capabilities.
- **Mobile Direction:** Expo may exist as a future line of work, but it is not an active workspace in the current repository.
- **Persistence Direction:** Supabase.
- **Flow Direction:** Local audio recording -> local analysis -> score and text persistence.

## Architectural Mandates
- **Pattern:** Vertical Slicing with Hexagonal Architecture (Ports & Adapters).
- **Language Discipline:** Distinguish clearly between the current repository state and the target product architecture when editing docs or instructions.
- **Reality Check:** Do not describe Turborepo, Expo, Zustand, or Jest as active parts of the stack unless they are actually present in the repository.
