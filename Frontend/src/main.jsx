import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@radix-ui/themes/styles.css'
import './index.css'
import Vault from './pages/Vault.jsx'
import { createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import { Route, RouterProvider } from 'react-router'
import Layout from './Layout'
import LandingPage from './pages/LandingPage'
import { ClerkProvider } from '@clerk/clerk-react'
import Home from './pages/Home'
import ProtectedRoute from './utils/Protected'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}
const Protected = (Component) => (
  <ProtectedRoute>
    {Component}
  </ProtectedRoute>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} >
      <Route path='' element= {<LandingPage />} />
      <Route path="home" element={Protected(<Home />)} />
      ž<Route path="vault/:vaultID?" element={<Vault />} />
    </Route>
  )
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <RouterProvider router={router} />
      </ClerkProvider>
  </StrictMode>,
)
