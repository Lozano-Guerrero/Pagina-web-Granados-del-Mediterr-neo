
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './FeatureCardV2.css';

const FeatureCardV2 = ({ icon, title, description, index }) => {
    return (
        <article className="feature-card-v2" style={{ transitionDelay: `${index * 0.1}s` }}>
            <div className="card-inner-v2">
                <div className="feature-icon-box-v2">
                    <FontAwesomeIcon icon={icon} />
                </div>
                <div className="feature-content-v2">
                    <h3 className="feature-title-v2">{title}</h3>
                    <div className="title-underline-v2"></div>
                    <p className="feature-desc-v2">{description}</p>
                </div>
            </div>
        </article>
    );
};

export default FeatureCardV2;
