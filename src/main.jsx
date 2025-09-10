import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import App2 from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'




createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <StrictMode>
    
    <App />
   
  </StrictMode>,
  </BrowserRouter>
)
