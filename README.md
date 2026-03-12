# Bézier 2.0

A high-performance, reactive vector path editor built with **Angular 16** and **TailwindCSS**. This tool enables precise Bézier curve creation, multi-segment manipulation, and a "Smart-Crop" SVG export system for seamless integration with parent projects.

**Live Demo:** [quarkbezier2.vercel.app](https://www.google.com/search?q=https://quarkbezier2.vercel.app)

---

## Introduction

Bézier 2.0 is a specialized micro-frontend designed for professional-grade vector illustration within an iframe-based architecture. It moves beyond simple path drawing by implementing a custom interaction engine that supports:

- **Complex Path Geometries:** Linear, Quadratic, and Cubic Bézier segments.
- **Intelligent Interaction:** Rotation-aware dragging, anchor snapping, and automated handle synchronization.
- **Smart Export:** An automated bounding-box calculation system that crops white space and normalizes coordinates for high-fidelity SVG exports.

---

## Architecture

Bézier 2.0 utilizes a **Service-Oriented Reactive Architecture**. By decoupling state, logic, and rendering, the application maintains a high frame rate (60fps) even during complex manipulations.

### The Component Hierarchy & Data Flow

1. **State Layer (`LineService`):** The "Single Source of Truth." It manages all `BezierLine` objects and interaction states (e.g., `activePointIndex`) using RxJS `BehaviorSubjects`.
2. **Interaction Layer (`MainComponent`):** Acts as the primary controller. It captures global mouse events, applies coordinate transformations (zoom and de-rotation math), and updates the State Layer.
3. **Presentation Layer (`ContainerComponent`):** A "dumb" component that purely renders the SVG based on the streams provided by the service.
4. **Export Layer (`ProjectExportService`):** An orchestrator that captures the current state, runs bounding calculations, and interfaces with the `QlIframeMessageService` to communicate with the parent window.

## Detailed System Diagram

     USER INTERACTION
              │
              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  MainComponent   │          │ ToolbarComponent │
    │ (Event Listener) │          │ (Style Controls) │
    └────────┬─────────┘          └────────┬─────────┘
             │                             │
       [Update State]                [Update State]
             │                             │
             ▼                             ▼
    ╔════════════════════════════════════════════════╗
    ║                 LINE SERVICE                   ║
    ║        (BehaviorSubjects / RxJS State)         ║
    ╚════════╦══════════════════════════════╦════════╝
             ║                              ║
      [Stream State]                  [Read State]
             ║                              ║
             ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ContainerComponent│          │  ProjectExport   │
    │  (SVG Renderer)  │          │     Service      │
    └────────┬─────────┘          └────────┬─────────┘
             │                             │
      [Request Path]                [Request Bounds]
             │                             │
             ▼                             ▼
    ┌────────────────────────────────────────────────┐
    │             CORE UTILS (Math Engine)           │
    │   (getPath, getBounds, getDashArray, etc.)     │
    └──────────────────────────────┬─────────────────┘
                                   │
                           [Base64 Payload]
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │    QlIframeMessageService     │
                   │      (Parent Comms Port)      │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                         (( PARENT PROJECT ))

## Project Structure

The project follows a modular directory structure to separate concerns and improve maintainability:

```text
src/app/
├── core/
│   ├── models/        # Interfaces: BezierLine, Point, IframeMessage
│   ├── services/      # Singletons: LineService, ProjectExportService
│   └── utils/         # Pure Math: getPath, getBounds, moveHandles
├── features/
│   ├── main/          # Interaction & Global event listeners
│   ├── container/     # SVG Rendering logic
│   ├── toolbar/       # Customization UI (Stroke, Color, Cap)
│   └── add-to-project/# Export triggers
├── shared/            # Reusable components: Toasts, Modals
└── assets/            # Shape templates (JSON)

```

---

## Technical Highlights

### Smart-Crop Export Logic

Unlike standard canvas exports, Bézier 2.0 identifies the absolute `minX/minY` and `maxX/maxY` of your drawing.

- **Coordinate Shifting:** Before export, every point is shifted by `-minX` and `-minY`.
- **ViewBox Optimization:** The resulting SVG is perfectly fitted to the drawing, eliminating unnecessary empty space.

### Advanced Stroke Handling

The engine dynamically calculates dash arrays and line caps based on SVG specifications:

- **Dotted Lines:** Implemented using `0` length dashes with `round` caps to create perfect circles.
- **Dash Arrays:** Proportional scaling relative to the `stroke-width`.

---

## Development

### Getting Started

1. Clone the repo.
2. Install dependencies: `npm install`.
3. Run the development server: `ng serve`.
4. Navigate to `http://localhost:4200/`.

### Deployment

The project is optimized for Vercel deployment. Use the following build command:
`ng build --configuration production`
