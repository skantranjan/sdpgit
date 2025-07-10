import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';

const msalConfig = {
  auth: {
    clientId: '5855622d-af7e-43ca-9266-67919b68fe4a',
    authority: 'https://login.microsoftonline.com/d1e23d19-ded6-4d66-850c-0d4f35bf2edc',
    redirectUri: 'http://localhost:3000', // TODO: Change to your deployed URL if needed
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <MsalProvider instance={msalInstance}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </MsalProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
