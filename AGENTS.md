# AGENTS.md

## Project Context

This is a standalone Electron + React/Vite salon management desktop application. Treat it as user-owned application code, keep changes focused, and preserve existing project conventions.

## Key Files

- `electron/`: Electron main process, preload bridge, local storage, authentication, and backup services.
- `src/`: React renderer application source.
- `src/api/localStorageClient.js`: renderer API abstraction over secure Electron IPC.
- `vite.config.js`: standard React Vite configuration for the renderer.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `npm run electron:dev` for desktop development.
- Use `npm run dev` only for renderer-only Vite development.
- Use `npm run dist` to package the Windows installer.
- Run the relevant checks from `package.json` before finishing code changes.
