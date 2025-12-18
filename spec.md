# Service Map Visualization System Specification (service-map-viz)

**Status:** Draft / Proof of Concept  
**Owner:** Architecture Team  
**Environment:** Google Cloud Platform (GCP) / Cloud Run  
**Target Scale:** 150+ Nodes (Services)

---

## 1. Executive Summary
This repository contains the source code for the Organization's Service Dependency Graph. The system is designed as a Modern Web App (MWA) deployed as a containerized service on Google Cloud Run, rendering an interactive, force-directed graph derived from a static CSV registry.

### Problem Statement
With a service mesh exceeding 150 nodes, maintaining accurate mental models of the system architecture has become increasingly difficult. Furthermore, static documentation methods are prone to immediate obsolescence.

### Proposed Solution
The objective is to establish a "Living Document" that visualizes the current state of the service mesh. This visualization is derived automatically from a machine-readable CSV source, ensuring accuracy and reducing the maintenance burden of manual documentation.

---

## 2. Technical Architecture

### Core Constraints
- **Cloud-Native Deployment**: The system is packaged as a Docker container and deployed to Google Cloud Run for high availability and serverless scaling.
- **Self-Contained Artifact**: The container includes both the built SPA and a lightweight production web server (Nginx), ensuring all dependencies are bundled at build time.
- **Client-Side Processing**: To minimize backend complexity, all CSV parsing and data transformation operations are executed within the client browser.

### Technology Stack
- **Build Tool**: Vite
- **Containerization**: Docker (Multi-stage build)
- **Runtime**: Google Cloud Run
- **Graph Engine**: Cytoscape.js
- **Layout Extension**: `cytoscape-fcose`
- **Data Parsing**: PapaParse
- **Styling**: Tailwind CSS

---

## 3. Repository Structure
```text
service-map-viz/
├── .gitignore
├── Dockerfile                   # Container definition for Cloud Run
├── package.json                 # Project dependencies
├── vite.config.js               # Build configuration
├── public/
│   └── data/
│       └── services.csv         # Primary Data Source
├── src/
│   ├── assets/                  # Static Assets
│   ├── logic/
│   │   ├── parser.js            # Transformation logic: CSV -> Cytoscape Elements JSON
│   │   └── graphConfig.js       # Layout configuration & Visual style definitions
│   ├── styles/
│   │   └── main.css             # Tailwind directives
│   └── main.js                  # Application Entry Point
└── index.html
```

---

## 4. Data Contract (services.csv)
The application ingests a flat CSV file located at `./public/data/services.csv`.

**Formatting Standards:**
- **Delimiter:** Comma (`,`)
- **Multi-value Delimiter:** Semicolon (`;`) for dependency lists.

| Column | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | Yes | Unique Service Identifier | `user-auth-svc` |
| `label` | String | Yes | Display Name | `User Authentication` |
| `domain` | String | Yes | Domain/Bounded Context | `Identity` |
| `tier` | Integer | No | Criticality Level (1-3) | `1` |
| `depends_on` | String | No | Semicolon-separated list of dependencies | `user-db; redis-cache` |
| `repo_url` | String | No | Hyperlink to Repository | `https://github.com/...` |
| `owner` | String | No | Responsible Team | `Team Security` |

---

## 5. Implementation Details

### A. CSV Parsing Logic (`src/logic/parser.js`)
Standard transformation logic remains focused on browser-side execution for zero-latency interactivity.

### B. Layout Configuration (`cytoscape-fcose`)
Physics-based simulation approach remains the standard for scale.

---

## 6. Deployment Strategy (GCP Cloud Run)
The deployment is automated via Google Cloud Build or GitHub/Bitbucket Actions targeting GCP.

**Deployment Steps:**
1. **Build**: Build the Docker image using the provided `Dockerfile`.
2. **Push**: Push the image to GCP Artifact Registry.
3. **Deploy**: Deploy to Cloud Run:
   ```bash
   gcloud run deploy service-map-viz \
     --image gcr.io/your-project/service-map-viz \
     --platform managed \
     --allow-unauthenticated
   ```

---

## 7. Roadmap & Features
- **Phase 1**: Containerization & Cloud Run Deployment.
- **Phase 2**: Interactivity & Search Enhancements.
- **Phase 3**: Automated Data Sync (via Cloud Functions or Cron jobs).