import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { TanStackDevtools } from '@tanstack/react-devtools'
// import { tableDevtoolsPlugin } from '@tanstack/react-table-devtools'
import { AuthProvider } from './contexts/AuthContext/AuthContext'
import './index.css'
import App from './pages/App'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      {/* <TanStackDevtools plugins={[tableDevtoolsPlugin()]} /> */}
    </QueryClientProvider>
  </StrictMode>,
)
