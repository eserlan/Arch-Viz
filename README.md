# Service Map Visualization Kit

Interactive service dependency map for 150+ services. The app is a static, client-side SPA built with Vite that renders a Cytoscape force-directed graph from a CSV registry.

## Tech Stack
- Vite (bundling for static hosting)
- Cytoscape.js with the `fcose` layout extension
- PapaParse for CSV ingestion
- Tailwind CSS for styling

## Getting Started
1. Install dependencies
   ```bash
   npm install
   ```
2. Run the dev server
   ```bash
   npm run dev
   ```
   The app serves at the printed local URL.
3. Build a static bundle
   ```bash
   npm run build
   ```
   Artifacts output to `dist/` for any static web server.

## Data Contract
Update the CSV in `public/data/services.csv`. The graph is generated at build/runtime entirely in the browser.

| Column     | Required | Description                                      | Example                         |
| ---------- | -------- | ------------------------------------------------ | ------------------------------- |
| `id`       | Yes      | Unique service ID (kebab-case preferred)        | `user-auth-svc`                |
| `label`    | Yes      | Display name                                     | `User Authentication`          |
| `domain`   | Yes      | Domain/bounded context                           | `Identity`                     |
| `tier`     | No       | Criticality (1=Critical, 3=Internal Tool)        | `1`                            |
| `depends_on` | No     | Semicolon-separated downstream service IDs       | `user-db;redis-cache`          |
| `repo_url` | No       | Link to Bitbucket repo                           | `https://bitbucket/...`        |
| `owner`    | No       | Owning team                                      | `Team Security`                |

### Example
```
id,label,domain,tier,depends_on,owner
payment-api,Payment Gateway,Finance,1,fraud-check;ledger-db,Team Money
fraud-check,Fraud Detection,Security,1,,Team Sec
```

## Notes
- No external CDNs are used; all assets bundle locally for air-gapped environments.
- Cytoscape layout is configured for large graphs (fcose). Adjust in `src/logic/graphConfig.js` if needed.
