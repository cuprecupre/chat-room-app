
import ReactGA from 'react-ga4';

const MEASUREMENT_ID = 'G-PXH204ZK33'; // ID encontrado en firebase.js

export const initGA = () => {
    if (MEASUREMENT_ID) {
        ReactGA.initialize(MEASUREMENT_ID);
        console.log('📊 Google Analytics inicializado:', MEASUREMENT_ID);
    } else {
        console.warn('⚠️ Google Analytics no pudo inicializarse: Falta Measurement ID');
    }
};

export const logPageView = () => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });
};

export const logEvent = (category, action, label) => {
    ReactGA.event({
        category,
        action,
        label
    });
};
