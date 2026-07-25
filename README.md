# Chilly - Desktop Fridge

Chilly is a playful, frameless Electron refrigerator that lives on the Windows
desktop. Open the door, move food and drinks, arrange magnets, check the time,
and pull out the vegetable drawer. Your arrangement is restored the next time
the application starts.

## Requirements

- Windows 10 or Windows 11
- Node.js 22.12 or newer
- npm (included with Node.js)

Download the current Node.js LTS installer from:

https://nodejs.org/

After installing Node.js, open PowerShell and verify the installation:

```powershell
node --version
npm --version
```

## Install the project

Open PowerShell in the project folder. For example:

```powershell
cd path\to\electron1
```

Install Electron and the other development dependencies:

```powershell
npm install
```

Electron is installed locally for this project. A global Electron installation
is not required.

## Start the application

```powershell
npm start
```

To stop the app, click the small `X` button at the top-right of the
refrigerator.

## Controls

- Double-click the main door to open or close it.
- Drag the `CHILLY` top bar to move the whole window around the desktop.
- Drag food and drinks to arrange them around the open refrigerator.
- Drag magnets and the time/date display around the closed door.
- Click the settings button beside `X` to configure the fridge contents.
- Choose quantities from 0 to 15 for dairy, breakfast food, meals, treats,
  fruit, and door-rack drinks, then select **Save stock**.
- The main shelves and door racks are empty by default; vegetables remain in
  the vegetable drawer.
- Changing a quantity preserves the positions of existing items. Increasing a
  quantity adds only new items; decreasing it removes only the extra items.
- Click or pull the vegetable drawer to open it.
- Close the vegetable drawer before closing the main door.
- Food and drinks are hidden while the main door is closed.

## Saved arrangement

Moved food, drinks, door magnets, and configured stock quantities are saved
automatically. The layout is restored after completely closing and reopening
the application.

On Windows, the layout is stored in:

```text
%APPDATA%\desktop-fridge\fridge-layout.json
```

Deleting this file resets the arrangement to its original layout the next time
the app starts.

## Build a Windows application

The project includes Electron Packager. Create a production Windows x64 build
with:

```powershell
npm install
npx @electron/packager . "Chilly Fridge" --platform=win32 --arch=x64 --out=release --overwrite --prune
```

The finished executable will be located at:

```text
release\Chilly Fridge-win32-x64\Chilly Fridge.exe
```

The generated folder contains the executable and all required runtime files.
Distribute the entire `Chilly Fridge-win32-x64` folder, not only the `.exe`.
You may zip that folder before sharing it.

To rebuild after changing the source code, run the same packaging command
again. The `--overwrite` option replaces the previous build.

## Optional application icon

Create a Windows `.ico` file, place it in the project (for example,
`assets\chilly.ico`), and package with:

```powershell
npx @electron/packager . "Chilly Fridge" --platform=win32 --arch=x64 --out=release --overwrite --prune --icon=assets\chilly.ico
```

## Troubleshooting

### PowerShell cannot find `npm`

Close and reopen PowerShell after installing Node.js. If it still fails,
restart Windows and run:

```powershell
node --version
npm --version
```

### Electron failed to install correctly

Antivirus software may have blocked or removed Electron's executable. Allow the
project folder in Windows Security, then run:

```powershell
npm rebuild electron
npm install
```

### Windows SmartScreen warning

An unsigned personal build may show a SmartScreen warning. Production apps
distributed publicly should use a Windows code-signing certificate.

### Reset the saved layout

Exit Chilly, remove the following file, and start the app again:

```text
%APPDATA%\desktop-fridge\fridge-layout.json
```
