/**
 * Static content and constants for the UI
 */

export const HELP_CONTENT_HTML: string = `
  <div>
    <h3 class="text-lg font-semibold mb-2 text-white">How it Works</h3>
    <p class="text-sm text-slate-300 leading-relaxed">Drag and drop your <code>services.csv</code> file onto the
      canvas to visualize your architecture. The graph automatically updates and layout readjusts based on the new
      data.</p>
  </div>

  <div>
    <h3 class="text-lg font-semibold mb-2 text-white">CSV Format</h3>
    <p class="text-sm text-slate-300 mb-2">Your CSV must have the following headers:</p>
    <div class="bg-slate-800 rounded p-3 overflow-x-auto border border-slate-700">
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="text-slate-400 border-b border-slate-600">
            <th class="py-2 px-2">Column</th>
            <th class="py-2 px-2">Req</th>
            <th class="py-2 px-2">Description</th>
          </tr>
        </thead>
        <tbody class="text-slate-300 font-mono">
          <tr class="border-b border-slate-700/50">
            <td class="py-2 px-2 text-emerald-300">id</td>
            <td class="py-2 px-2 text-emerald-500">Yes</td>
            <td class="py-2 px-2 font-sans text-slate-400">Unique identifier (no spaces).</td>
          </tr>
          <tr class="border-b border-slate-700/50">
            <td class="py-2 px-2 text-emerald-300">name</td>
            <td class="py-2 px-2 text-emerald-500">Yes</td>
            <td class="py-2 px-2 font-sans text-slate-400">Display name of the service.</td>
          </tr>
          <tr class="border-b border-slate-700/50">
            <td class="py-2 px-2 text-emerald-300">labels</td>
            <td class="py-2 px-2 text-slate-500">No</td>
            <td class="py-2 px-2 font-sans text-slate-400">Values separated by <code>;</code></td>
          </tr>
          <tr class="border-b border-slate-700/50">
            <td class="py-2 px-2 text-emerald-300">tier</td>
            <td class="py-2 px-2 text-slate-500">No</td>
            <td class="py-2 px-2 font-sans text-slate-400">Number 1-3 for visual hierarchy.</td>
          </tr>
          <tr class="border-b border-slate-700/50">
            <td class="py-2 px-2 text-emerald-300">owner</td>
            <td class="py-2 px-2 text-slate-500">No</td>
            <td class="py-2 px-2 font-sans text-slate-400">Team or person responsible.</td>
          </tr>
          <tr class="border-b border-slate-700/50">
            <td class="py-2 px-2 text-emerald-300">repoUrl</td>
            <td class="py-2 px-2 text-slate-500">No</td>
            <td class="py-2 px-2 font-sans text-slate-400">Link to source code.</td>
          </tr>
          <tr>
            <td class="py-2 px-2 text-emerald-300">depends_on</td>
            <td class="py-2 px-2 text-slate-500">No</td>
            <td class="py-2 px-2 font-sans text-slate-400">Semicolon-sep list of target <code>id</code>s.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div>
    <h3 class="text-lg font-semibold mb-2 text-white">Interactive Features</h3>
    <ul class="list-disc list-inside text-sm text-slate-300 space-y-1 ml-1">
      <li><strong class="text-emerald-400">Click</strong> a node to see details and highlight neighbors.</li>
      <li><strong class="text-emerald-400">Edit / Delete</strong>: Buttons in selected service panel.</li>
      <li><strong class="text-emerald-400">Add Service</strong>: Button in sidebar to create new nodes.</li>
      <li><strong class="text-emerald-400">Edit Connections</strong>: Toggle mode to drag new connections.</li>
      <li><strong class="text-emerald-400">Filters</strong>: Use the floating panels to isolate specific teams or labels.</li>
      <li><strong class="text-emerald-400">Trace Depth</strong>: Expand connection highlighting distance.</li>
      <li><strong class="text-emerald-400">Export</strong>: Save your graph as an image or clipboard.</li>
    </ul>
  </div>

  <div>
    <h3 class="text-lg font-semibold mb-2 text-white">Keyboard Shortcuts</h3>
    <div class="bg-slate-800 rounded p-3 border border-slate-700">
      <table class="w-full text-left text-xs">
        <tbody class="text-slate-300">
          <tr class="border-b border-slate-700/50">
            <td class="py-2 px-2 font-mono text-emerald-300">E</td>
            <td class="py-2 px-2">Toggle edit mode for selected service</td>
          </tr>
          <tr class="border-b border-slate-700/50">
            <td class="py-2 px-2 font-mono text-emerald-300">M</td>
            <td class="py-2 px-2">Toggle map/connections edit mode</td>
          </tr>
          <tr class="border-b border-slate-700/50">
            <td class="py-2 px-2 font-mono text-emerald-300">Ctrl+Z</td>
            <td class="py-2 px-2">Undo last change</td>
          </tr>
          <tr>
            <td class="py-2 px-2 font-mono text-emerald-300">Ctrl+Y / Ctrl+Shift+Z</td>
            <td class="py-2 px-2">Redo last undone change</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
`;
