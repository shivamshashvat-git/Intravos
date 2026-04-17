/**
 * App.jsx — Root Application Entry Point
 *
 * This is the application shell. As features are built, set up:
 *   - React Router routes here
 *   - Global layout wrappers (AuthenticatedLayout, etc.)
 *   - Auth guards from features/system/auth
 *
 * Keep this file lean. All feature logic lives in src/features/[domain].
 */

function App() {
  return (
    <div id="app-root">
      {/* Temporary placeholder — replace with Router + feature routes */}
      <p style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#aaa' }}>
        Intravos Studio — Ready for Development
      </p>
    </div>
  )
}

export default App
