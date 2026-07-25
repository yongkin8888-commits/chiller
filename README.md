# Chilly - Desktop Fridge

A frameless, transparent Electron refrigerator toy for the Windows desktop.

## Requirements

Install Node.js 22.12 or newer from [nodejs.org](https://nodejs.org/).

## Install

Open PowerShell in the project folder:

```powershell
npm install
```

## Start

```powershell
npm start
```

## Build the Windows EXE

```powershell
npx @electron/packager . "Chilly Fridge" --platform=win32 --arch=x64 --out=release --overwrite --prune
```

The finished app will be created at:

```text
release\Chilly Fridge-win32-x64\Chilly Fridge.exe
```

Keep and distribute the complete `Chilly Fridge-win32-x64` folder because the
EXE requires the other files inside it.

## Saved Layout

Item positions, quantities, magnets, and notes are saved at:

```text
%APPDATA%\desktop-fridge\fridge-layout.json
```

Delete this file while the app is closed to reset the refrigerator.
