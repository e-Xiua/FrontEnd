# Refactoring Strategy: `mapa-empresas` Component

## 1. Problem Statement

The `mapa-empresas.component` has become a "god component," managing multiple concerns:
-   Fetching all providers.
-   Displaying a general map.
-   Handling the selection of a "pre-made" route.
-   Managing the state of multiple, simultaneous route optimization jobs (submission, polling, progress tracking, completion, cancellation).
-   Displaying optimization results.

This violates the Single Responsibility Principle, making the component difficult to test, maintain, and reuse. The state is managed locally, preventing other parts of the application from observing or reacting to optimization events.

## 2. Goal

Refactor the entire feature into a collection of smaller, single-purpose components orchestrated by a central state management service. This will improve modularity, testability, and align with reactive programming best practices in Angular.

We will also replace the concept of selecting a "pre-made" route with a dynamic **Route Builder UI**, as requested.

## 3. New Architecture

The new architecture will consist of three main parts:

1.  **`RouteBuilderStateService` (The Brains)**: A central, injectable service responsible for all state management and business logic.
2.  **Container Component (`mapa-empresas.component`)**: The main view that hosts and arranges the new, smaller UI components.
3.  **Presentational Components (The UI)**: A set of standalone components, each with a single responsibility.

---

### A. `RouteBuilderStateService`

This service will manage all application state using RxJS `BehaviorSubject`s, exposing public observables for components to consume.

**Responsibilities:**
-   Fetch and store the list of all available providers/POIs.
-   Manage the state of the route being built in the new Route Builder UI (the list of selected POIs).
-   Handle the entire lifecycle of an optimization job:
    -   Submit the job to the backend.
    -   Receive the initial `JobSubmissionResponse`.
    -   Manage the polling mechanism to check for status updates.
    -   Update the job's progress, status, and messages.
    -   Store the final `OptimizationResult` or any errors.
-   Provide methods for components to call (e.g., `addPoiToRoute()`, `startOptimization()`, `cancelJob()`).

### B. New Presentational Components

#### 1. `poi-route-builder.component`
This new component will implement the dynamic table UI for creating a route, based on the provided React example at the message.

-   **`@Input()`**: Receives the list of all available POIs from the state service (via the container component).
-   **`@Output()`**: Emits events when the user wants to change the state (e.g., `(poiAdded)`, `(poiRemoved)`, `(optimizeClicked)`).
-   **UI Logic**:
    -   Displays a table where each row represents a stop.
    -   Allows users to add or remove rows.
    -   Each row contains a dropdown to select a POI.
    -   Displays details of the selected POI in the corresponding row.
    -   Calculates and displays averages (cost, duration, rating) for the selected POIs.

#### 2. `optimization-status-tracker.component`
This component will display the status of all active and completed optimization jobs.

-   **`@Input()`**: Receives an array or map of active optimization jobs from the state service.
-   **`@Output()`**: Emits events for user actions like `(cancelJob)` or `(clearJob)`.
-   **UI Logic**:
    -   Renders a card for each optimization job.
    -   Displays the job's name, progress bar, and status message.
    -   Shows the final results (distance, time, score) when a job is complete.
    -   Provides "Cancel" or "Remove" buttons.

#### 3. `optimized-route-map.component`
A specialized map component for displaying a single, optimized route.

-   **`@Input()`**: Receives a single `OptimizationResult` object.
-   **UI Logic**:
    -   Displays only the POIs included in the optimized route.
    -   Draws the polyline connecting the POIs in the correct, optimized order.
    -   Displays key metrics of the optimized route.

### C. Refactored `mapa-empresas.component` (The Container)

The `mapa-empresas.component` will be simplified into a container component.

**Responsibilities:**
-   Inject `RouteBuilderStateService`.
-   Subscribe to observables from the service to get the latest state.
-   Pass data down to the new presentational components using `@Input()` bindings.
-   Listen for events from presentational components (via `@Output()`) and call the appropriate methods on the state service.
-   Arrange the layout of the page:
    1.  General map of all providers.
    2.  The new `poi-route-builder` component.
    3.  The `optimization-status-tracker` component.
    4.  A section to display the `optimized-route-map` for each completed result.

---

## 4. Refactoring Plan

**Phase 1: Create the State Management Service**
1.  Create `route-builder-state.service.ts`.
2.  Define the necessary `BehaviorSubject`s for `providers`, `selectedPois`, `activeOptimizations`, etc.
3.  Implement the public methods: `loadProviders()`, `addPoiToRoute()`, `removePoiFromRoute()`, `startOptimization()`, and the private polling logic.

**Phase 2: Build the `poi-route-builder` Component**
1.  Generate a new standalone component: I have generated a new component at `shared/ui/components/route-generation/poi-route-builder` check If it is standalone.
2.  Implement the HTML and CSS to create the dynamic table UI.
3.  Write the component logic to handle adding/removing rows and selecting POIs, using `@Input` and `@Output` for data flow.

**Phase 3: Build the `optimization-status-tracker` Component**
1.  Generate a new standalone component: `shared/ui/components/route-generation/optimization-status-tracker` check If it is standalone.
2.  Implement the UI to display optimization cards based on the input data.
3.  Connect the "Cancel" and "Remove" buttons to `@Output` event emitters.

**Phase 4: Refactor `mapa-empresas.component`**
1.  Delete almost all of the existing logic from `mapa-empresas.component.ts`.
2.  Inject `RouteBuilderStateService` and subscribe to its observables in the template using the `async` pipe.
3.  Update `mapa-empresas.component.html`:
    -   Remove the old "Selected Route" and "Multiple Active Optimizations" sections.
    -   Add the new `<app-poi-route-builder>` component.
    -   Add the new `<app-optimization-status-tracker>` component.
    -   Bind the component inputs and outputs to the state service observables and methods.
4.  Create and integrate the `optimized-route-map` component to display final results.

**Phase 5: Cleanup**
1.  Delete the now-unused `route-optimization.service.ts` if its logic has been fully migrated to the new state service.
2.  Remove any legacy properties (`isOptimizing`, `optimizationProgress`, etc.) from `mapa-empresas.component.ts`.
3.  Ensure all communication between components happens through the central state service.
