import React from 'react';
import { Link } from 'react-router-dom';
import './Brokers.css';

export default function BrokerPlaceholder({ title }) {
    return (
        <div className="brokers-placeholder">
            <div>
                <h1>{title}</h1>
                <p>En construcción</p>
                <Link className="brokers-back-link" to="/brokers/dashboard">Volver al panel</Link>
            </div>
        </div>
    );
}
