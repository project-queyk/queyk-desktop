# Queyk Desktop: Earthquake Safety and Emergency Response Client

[![Status: Initial Scaffolding](https://img.shields.io/badge/Status-Initial_Scaffolding-orange.svg)](<>)
[![Go](https://img.shields.io/badge/Go-1.25-00ADD8.svg?logo=go)](https://go.dev/)
[![Wails](https://img.shields.io/badge/Wails-v3_Beta-DF0000.svg?logo=wails)](https://v3.wails.io/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?logo=vite)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Queyk Desktop is the cross-platform desktop client for the Queyk earthquake safety and emergency response ecosystem, built with Go, Wails v3, React, and TypeScript.

> [!NOTE]
> This project is currently in early development and initial scaffolding.

---

## 🛠 Tech Stack

- **Backend / Desktop Runtime:** [Go 1.25+](https://go.dev/), [Wails v3](https://v3.wails.io/)
- **Frontend:** [React 18](https://react.dev/), [TypeScript 5.2](https://www.typescriptlang.org/)
- **Build Tooling & Bundler:** [Vite 8](https://vite.dev/), [Taskfile](https://taskfile.dev/)

---

## 📁 Project Structure

```
queyk-desktop/
├── build/             # Build configurations, app icons, and platform scripts
├── frontend/          # React + TypeScript frontend source
│   ├── bindings/      # Auto-generated Go-to-TypeScript bindings
│   ├── src/           # React components and styling
│   ├── package.json   # Frontend dependencies and scripts
│   └── vite.config.ts # Vite configuration
├── greetservice.go    # Sample backend service
├── main.go            # Application entrypoint & window configuration
├── Taskfile.yml       # Task runner definitions
├── go.mod             # Go module definition
└── README.md          # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Go** (1.21 or newer, recommended 1.25+)
- **Node.js** (v18 or newer) & **npm**
- **Task** runner (`task`): [Installation Guide](https://taskfile.dev/installation/)
- **Wails v3 CLI**:
  ```bash
  go install github.com/wailsapp/wails/v3/cmd/wails3@latest
  ```
- **Platform Dependencies**:
  - **Linux**: `libgtk-3-dev`, `libwebkit2gtk-4.1-dev` (or distro equivalent)
  - **macOS**: Xcode Command Line Tools
  - **Windows**: WebView2 Runtime

### Installation

1. Clone or navigate to the project directory:

   ```bash
   cd queyk-desktop
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running in Development

Start the application with live hot-reloading:

```bash
wails3 dev
```

_(Or via Taskfile)_:

```bash
task dev
```

### Building for Production

Compile a native production binary:

```bash
wails3 build
```

Or package for your platform:

```bash
task package
```

Output binaries will be placed in the `bin/` directory.

---

## License

This project is licensed under the [MIT License](LICENSE).
