# Project Instructions: Cicero (SpeechMaster)

## Stack & Tooling
- **Package Manager:** Always use `pnpm`.
- **Monorepo:** Planned with Next.js and React Native Expo using Turborepo.
- **Frontend:** Next.js (Web), Expo (Mobile).
- **State Management:** Zustand.
- **Testing:** Jest.
- **Documentation:** Docusaurus.

## Architectural Mandates
- **Pattern:** Vertical Slicing with Hexagonal Architecture (Ports & Adapters).
- **Persistence:** Supabase.
- **Flow:** Local audio recording -> Mock IA Analysis -> Score & Text Persistence.
