# Salon Management

Salon Management is a standalone Windows desktop application for running salon operations offline. It uses Electron for the desktop shell, React/Vite for the interface, and local JSON files for all business data.

## Development

```bash
npm install
npm run electron:dev
```

`npm run electron:dev` starts Vite and launches the Electron desktop app.

## Build

```bash
npm run build
```

## Windows installer

```bash
npm run dist
```

The installer is written to `release/` as a Windows x64 executable.

## Local data location

All changing salon data is stored in Electron's application data folder, not in the install directory. On Windows this is:

```text
C:\Users\<USER>\AppData\Roaming\Salon Management\
```

The app creates these JSON collections on first launch: `customers.json`, `staff.json`, `services.json`, `products.json`, `appointments.json`, `invoices.json`, `expenses.json`, `settings.json`, and `users.json`.

## Authentication

On first launch, create a local administrator account. Passwords are salted and hashed with Node's crypto `scrypt`; plaintext passwords are never stored or sent online. Sessions are stored locally and can be ended from the sidebar sign-out button.

## Backup, restore, and moving PCs

The Settings screen includes backup actions to create a local backup, restore a backup, export a complete salon backup package, import a package, and open the data/backup folders. To move data to another PC, export a backup on the old PC and import it on the new PC.

## Offline operation

Normal salon management features run without internet access: dashboard, appointments, customers, staff, inventory, invoices, expenses, reports, settings, printing, and backups.
