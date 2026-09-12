# Queyk Desktop: Earthquake Monitoring and Operations Workstation Client

[![Go](https://img.shields.io/badge/Go-1.25-00ADD8.svg?logo=go)](https://go.dev/)
[![Wails](https://img.shields.io/badge/Wails-v3_Beta-DF0000.svg?logo=wails)](https://v3.wails.io/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![TanStack Router](https://img.shields.io/badge/TanStack_Router-1.170-teal.svg?logo=react-query)](https://tanstack.com/router)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?logo=vite)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Queyk Desktop** is the desktop client for the Queyk earthquake safety and monitoring system. Built with Go, Wails v3, React 18, and TypeScript, it serves as a monitoring interface and admin panel that queries PostgreSQL directly for local readings while connecting to the central backend API for AI summaries, PDF reports, and IoT device resets.

---

## 1. Overview & Features

Queyk Desktop provides security officers, safety coordinators, and administrators with a dedicated desktop interface for monitoring seismic activity and viewing emergency protocols.

### Key Features

- **Direct Database Telemetry Queries (Go + pgxpool + sqlc)**:
  - Queries PostgreSQL directly using sqlc-generated Go functions.
  - Retrieves seismic readings (Spectral Intensity averages, minimums, maximums, and battery levels).
  - Fetches earthquake logs with magnitude, duration, and risk levels.
- **Backend API Integration**:
  - Fetches AI summaries from the central backend.
  - Downloads and saves PDF reports locally using native file dialogs (`Dialogs.SaveFile`) with a browser download fallback.
  - Sends IoT device reboot commands (`/v1/api/iot/device/reset`) with cooldown protection.
- **Seismic Activity & Earthquake Monitor**:
  - Line charts built with Recharts displaying seismic readings over time.
  - Overview cards with sparklines showing Peak SI Maximum, Average SI Reading, Significant Activity Count (> 1.0 SI), and Peak Activity Time.
  - Date range picker with persistent date bounds and loading skeletons.
- **Evacuation Plan Viewer**:
  - Multi-floor layout viewer with desktop and mobile-responsive views.
  - Downloadable PDF evacuation guidelines and campus assembly plans.
- **Safety Protocols**:
  - Emergency instructions for before, during, and after an earthquake based on NDRRMC and PHIVOLCS guidelines.
  - Reference guide for the PHIVOLCS Earthquake Intensity Scale (PEIS).
- **Google OAuth Authentication**:
  - Opens Google sign-in in a native popup window managed by Wails (`app.Window.NewWithOptions`).
  - Passes tokens back to the main window via `BroadcastChannel` and Wails events (`auth-window-closed`).
  - Verifies sessions through Better Auth and stores bearer tokens in `localStorage`.
- **User Management**:
  - Paginated user list with search, role selection (`admin` / `user`), and phone number editing.

---

## 2. Architecture

Queyk Desktop uses Wails v3 to expose Go services directly to the React frontend as typed TypeScript functions.

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React 18 + TanStack Router + Tailwind CSS 4)"]
        UI[User Interface]
        TR[TanStack Router]
        TQ[TanStack React Query]
        AuthC[Better Auth Client]
        WSDK["@wailsio/runtime (Window, Dialogs, Events)"]
    end

    subgraph WailsBridge ["Wails v3 Bindings"]
        Bindings["bindings/queyk/internal/*"]
    end

    subgraph GoBackend ["Go Backend (Wails v3 Runtime)"]
        Main["main.go (App & Window Setup)"]
        AuthSvc["internal/auth (OAuth Popup Window)"]
        UserSvc["internal/users (User Service)"]
        DashSvc["internal/dashboard (Readings, Earthquakes, PDF Save)"]
        SQLC["internal/adapters/postgresql/sqlc (Generated Queries)"]
        Pool["pgxpool.Pool"]
    end

    subgraph RemoteBackend ["Queyk Backend API"]
        RemoteAPI["/v1/api/readings (AI Summary & PDF)"]
        IoTReset["/v1/api/iot/device/reset (Reboot Device)"]
        OAuthEP["/api/auth/sign-in/social (Google OAuth)"]
    end

    subgraph Database ["PostgreSQL Database"]
        DB[(Tables: readings, earthquakes, user, session)]
    end

    UI --> TR
    UI --> TQ
    TQ --> Bindings
    TQ --> RemoteAPI
    TQ --> IoTReset
    Bindings --> UserSvc & DashSvc
    UserSvc & DashSvc --> SQLC --> Pool --> DB
    AuthC --> OAuthEP
    AuthSvc --> Main
    WSDK --> Main
```

---

## 3. Tech Stack

- **Desktop Runtime & Backend**:
  - [Go 1.25](https://go.dev/)
  - [Wails v3 (Beta)](https://v3.wails.io/) — Window management, system dialogs, event handling, and asset serving
  - [pgx v5](https://github.com/jackc/pgx) — PostgreSQL driver and connection pooling (`pgxpool`)
  - [sqlc](https://sqlc.dev/) — Type-safe Go code generation from SQL queries
  - [godotenv](https://github.com/joho/godotenv) — `.env` file loader
- **Frontend**:
  - [React 18.2](https://react.dev/)
  - [TypeScript 5.2](https://www.typescriptlang.org/)
  - [Vite 8.0](https://vite.dev/)
- **Routing & State**:
  - [TanStack Router 1.170](https://tanstack.com/router) — File-based routing with route protection (`beforeLoad`)
  - [TanStack React Query v5](https://tanstack.com/query) — Data fetching and caching
  - [TanStack React Table v8](https://tanstack.com/table) — Table logic for user management
- **UI & Styling**:
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Base UI](https://base-ui.com/) / [shadcn/ui](https://ui.shadcn.com/) primitives
  - [Recharts 3.8](https://recharts.org/) — Charts and sparklines
  - [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/)
- **Authentication**:
  - [Better Auth Client](https://www.better-auth.com/)

---

## 4. Project Structure

```
queyk-desktop/
├── build/                                # App icons and platform build assets
├── cmd/                                  # CLI utilities
├── frontend/                             # React + TypeScript frontend
│   ├── bindings/                         # Auto-generated Go-to-TypeScript bindings
│   │   └── queyk/internal/
│   │       ├── auth/                     # Auth service bindings
│   │       ├── dashboard/                # Dashboard & seismic overview bindings
│   │       └── users/                    # User management bindings
│   ├── src/
│   │   ├── components/                   # UI components (dashboard, evacuation, shared, ui)
│   │   ├── constants/                    # Safety guidelines & campus protocols
│   │   ├── hooks/                        # Custom React hooks
│   │   ├── lib/                          # Auth client, chart configs, and utilities
│   │   ├── routes/                       # TanStack file-based routes
│   │   │   ├── __root.tsx                # Root layout & OAuth message receiver
│   │   │   ├── _main.tsx                 # Authenticated layout with sidebar & header
│   │   │   ├── _main/
│   │   │   │   ├── index.tsx             # Seismic monitor & overview dashboard
│   │   │   │   ├── evacuation-plan.tsx   # Interactive floor plan viewer
│   │   │   │   ├── user-management.tsx   # Admin user table & role controls
│   │   │   │   ├── profile.tsx           # User settings & phone management
│   │   │   │   └── protocols.tsx         # Disaster safety protocols
│   │   │   ├── sign-in.tsx               # Google OAuth login screen
│   │   │   ├── error.tsx                 # Access denied & error boundaries
│   │   │   └── privacy.tsx               # Privacy policy
│   │   └── main.tsx                      # Frontend entrypoint & router provider
│   ├── package.json                      # Frontend dependencies & scripts
│   └── vite.config.ts                    # Vite configuration
├── internal/                             # Go backend packages
│   ├── adapters/
│   │   └── postgresql/
│   │       ├── migrations/               # Database migrations
│   │       └── sqlc/                     # sqlc-generated queries and models
│   ├── auth/                             # OAuth popup window service
│   ├── dashboard/                        # Telemetry, earthquake data, and PDF export service
│   ├── envutil/                          # Environment variable helpers
│   ├── users/                            # User profile and admin operations service
│   ├── uuid/                             # UUID conversion utilities
│   └── validator/                        # Phone and input validators
├── go.mod                                # Go module definition & dependencies
├── go.sum                                # Go checksums
├── main.go                               # Application entrypoint and window setup
├── Taskfile.yml                          # Taskfile build recipes
└── README.md                             # Project documentation
```

---

## 5. Getting Started

### Prerequisites

- **Go**: `1.22+` (recommended `1.25+`)
- **Node.js**: `v18+` & **npm**
- **PostgreSQL**: Running instance with the Queyk database schema
- **Task**: [Taskfile runner](https://taskfile.dev/installation/)
- **Wails v3 CLI**:
  ```bash
  go install github.com/wailsapp/wails/v3/cmd/wails3@latest
  ```
- **Platform Development Libraries**:
  - **Linux (Debian/Ubuntu)**:
    ```bash
    sudo apt-get install libgtk-3-dev libwebkit2gtk-4.1-dev
    ```
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Edge WebView2 Runtime

### Environment Configuration

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/queyk?sslmode=disable
VITE_AUTH_BASE_URL=http://localhost:8080
```

### Installation

1. Clone or navigate to the repository:

   ```bash
   cd queyk-desktop
   ```

2. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. Download Go dependencies:
   ```bash
   go mod download
   ```

---

## 6. Development & Build Scripts

### Running in Development

Start the app with live hot-reloading:

```bash
wails3 dev
```

_(Or via Taskfile)_:

```bash
task dev
```

### Building for Production

Compile a production binary:

```bash
wails3 build
```

_(Or via Taskfile)_:

```bash
task build
```

Package a native installer or bundle for your platform:

```bash
task package
```

Compiled binaries are output to the `bin/` directory.

---

## 7. Related Repositories

| Subsystem           | Stack                                  | Description                                                                            | Link                              |
| :------------------ | :------------------------------------- | :------------------------------------------------------------------------------------- | :-------------------------------- |
| **`queyk-iot`**     | C++, ESP32, Omron D7S                  | On-site seismic sensing hardware and telemetry transmitter.                            | [queyk-iot](https://github.com/project-queyk/queyk-iot)         |
| **`queyk-backend`** | Node.js, Express 5, Go, PostgreSQL     | Central API gateway, WebSocket telemetry stream, push notifications, and AI summaries. | [queyk-backend](https://github.com/project-queyk/queyk-backend) |
| **`queyk-web`**     | Next.js 15, React 19, Better Auth, PWA | Public safety portal, mobile-friendly PWA, and web monitoring dashboard.               | [queyk-web](https://github.com/project-queyk/queyk-web)         |
| **`queyk-mobile`**  | React Native, Expo SDK 54              | Early warning mobile app with background evacuation tracking.                          | [queyk-mobile](https://github.com/project-queyk/queyk-mobile)   |
| **`queyk-desktop`** | Go 1.25, Wails v3, React 18            | Desktop monitoring and admin client for security desks and operations offices.         | [queyk-desktop](https://github.com/project-queyk/queyk-desktop)               |

---

## License

This project is licensed under the [MIT License](LICENSE).
