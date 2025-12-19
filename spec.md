# Service Map Visualization System Specification (service-map-viz)

**Status:** Draft / Proof of Concept  
**Owner:** Architecture Team  
**Environment:** GitHub Pages  
**Target Scale:** 150+ Nodes (Services)

---

## 1. Executive Summary
This repository contains the source code for the Organization's Service Dependency Graph. The system is designed as a static Single Page Application (SPA) hosted on GitHub Pages, rendering an interactive, force-directed graph derived from a static CSV registry.

### Problem Statement
With a service mesh exceeding 150 nodes, maintaining accurate mental models of the system architecture has become increasingly difficult. Furthermore, static documentation methods are prone to immediate obsolescence.

### Proposed Solution
The objective is to establish a "Living Document" that visualizes the current state of the service mesh. This visualization is derived automatically from a machine-readable CSV source, ensuring accuracy and reducing the maintenance burden of manual documentation.

---

## 2. Technical Architecture

### Core Constraints
- **Static Hosting**: The system is hosted as a static site on GitHub Pages, requiring no backend runtime or server-side logic.
- **Automated Deployment**: Deployment is handled via GitHub Actions, which builds the project and updates the live site on every push to the main branch.
- **Client-Side Processing**: All CSV parsing and data transformation operations are executed within the client browser to minimize infrastructure complexity.

### Technology Stack
- **Build Tool**: Vite
- **Hosting**: GitHub Pages
- **Automation**: GitHub Actions
- **Graph Engine**: Cytoscape.js
- **Layout Extension**: `cytoscape-fcose`
- **Data Parsing**: PapaParse
- **Styling**: Tailwind CSS

---

## 3. Repository Structure
```text
service-map-viz/
├── .github/
│   └── workflows/
│       └── deploy.yml           # Automated deployment to GH Pages
├── .gitignore
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
Standard transformation logic runs entirely in the browser.

### B. Deployment Automation (`.github/workflows/deploy.yml`)
Uses the `peaceiris/actions-gh-pages` action to deploy the `dist/` folder.

---

## 6. Deployment Strategy (GitHub Pages)
The deployment is fully automated via GitHub Actions.

**Deployment Steps:**
1. **Push**: Commit and push changes to the `main` branch.
2. **Build**: GitHub Actions automatically triggers a build using `npm run build`.
3. **Deploy**: The built artifacts are pushed to the `gh-pages` branch and served live.

---

## 7. Roadmap & Features
- **Phase 1**: GitHub Pages Integration & Automation.
- **Phase 2**: Interactivity & Search Enhancements.
- **Phase 3**: Automated Data Sync (via scheduled GitHub Actions).