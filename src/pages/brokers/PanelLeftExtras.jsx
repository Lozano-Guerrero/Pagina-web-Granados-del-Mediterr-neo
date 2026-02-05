import React from 'react';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/Ehfbf2S0e8KHThsbIFLxsq';

export default function PanelLeftExtras({ role = 'broker' }) {
    const tutorialCopy = role === 'inmobiliaria'
        ? 'Tutorial para Inmobiliarias'
        : (role === 'linked-broker'
            ? 'Tutorial para Brokers ligados a Inmobiliaria'
            : 'Tutorial para Brokers');

    return (
        <>
            <div className="brokers-subcard brokers-subcard-whatsapp">
                <h2 className="brokers-section-title">Grupo de WhatsApp</h2>
                <div className="brokers-subtitle" style={{ textAlign: 'left' }}>
                    Únete al grupo de WhatsApp de brokers para no perderte de actualizaciones, avisos, material y precios.
                </div>
                <a
                    className="brokers-inline-btn brokers-inline-btn-whatsapp brokers-inline-btn-full"
                    href={WHATSAPP_GROUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Unirme al grupo
                </a>
            </div>

            <div className="brokers-subcard">
                <h2 className="brokers-section-title">Ver tutorial del panel</h2>
                <div className="brokers-helper">Próximamente</div>
                <div className="brokers-helper">{tutorialCopy}</div>
                <button className="brokers-inline-btn brokers-inline-btn-full" type="button" disabled>
                    <span className="brokers-play-icon" aria-hidden="true">▶</span>
                    Ver tutorial
                </button>
            </div>
        </>
    );
}
