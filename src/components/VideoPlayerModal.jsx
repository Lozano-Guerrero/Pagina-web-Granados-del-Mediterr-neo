import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './VideoPlayerModal.css';

const VideoPlayerModal = ({ isOpen, onClose, videoUrl, title }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div className="vplayer-overlay" onClick={onClose}>
            <div className="vplayer-content" onClick={(e) => e.stopPropagation()}>
                <div className="vplayer-header">
                    <h3 className="vplayer-title">{title || 'Tutorial'}</h3>
                    <button className="vplayer-close" onClick={onClose}>&times;</button>
                </div>
                <div className="vplayer-body">
                    <video
                        className="vplayer-video"
                        controls
                        autoPlay
                        playsInline
                        src={videoUrl}
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        Tu navegador no soporta el elemento de video.
                    </video>
                </div>
                <div className="vplayer-footer">
                    <button className="vplayer-btn-close" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default VideoPlayerModal;
