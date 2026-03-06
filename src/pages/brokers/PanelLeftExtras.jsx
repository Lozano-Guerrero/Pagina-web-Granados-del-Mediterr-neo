import React, { useState } from 'react';
import VideoPlayerModal from '../../components/VideoPlayerModal.jsx';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/Ehfbf2S0e8KHThsbIFLxsq';

export default function PanelLeftExtras({ role = 'broker' }) {
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');

    const tutorialCopy = role === 'inmobiliaria'
        ? 'Tutorial para Inmobiliarias'
        : (role === 'linked-broker'
            ? 'Tutorial para Brokers ligados a Inmobiliaria'
            : 'Tutorial para Brokers');

    const handleOpenTutorial = () => {
        const videoMap = {
            'inmobiliaria': 'inmobiliarias.mp4',
            'linked-broker': 'brokerjr.mp4',
            'broker': 'broker.mp4'
        };
        const fileName = videoMap[role] || 'broker.mp4';
        setVideoUrl(`/video/${fileName}`);
        setIsPlayerOpen(true);
    };

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
                <div className="brokers-helper" style={{ marginBottom: '12px' }}>{tutorialCopy}</div>

                <button
                    className="brokers-inline-btn brokers-inline-btn-full"
                    type="button"
                    onClick={handleOpenTutorial}
                >
                    <span className="brokers-play-icon" aria-hidden="true">▶</span>
                    Reproducir tutorial
                </button>
            </div>

            <VideoPlayerModal
                isOpen={isPlayerOpen}
                onClose={() => setIsPlayerOpen(false)}
                videoUrl={videoUrl}
                title={tutorialCopy}
            />
        </>
    );
}
