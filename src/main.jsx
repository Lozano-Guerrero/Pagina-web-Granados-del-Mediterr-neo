// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
// Importamos BrowserRouter para habilitar el ruteo en toda la app
import { BrowserRouter } from 'react-router-dom';
// Importaciones de FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faHome, 
  faPalette, 
  faTree, 
  faHandshake,
  faMapLocation,
  faLeaf 
} from '@fortawesome/free-solid-svg-icons';

// Añadimos los íconos a la biblioteca de FontAwesome
library.add(faHome, faPalette, faTree, faHandshake, faMapLocation, faLeaf);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envolvemos <App /> para que todos los componentes hijos
        puedan usar las funcionalidades de React Router */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);