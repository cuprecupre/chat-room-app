import "@testing-library/jest-dom";

// Mock for window.matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
    }),
});

// Mock for ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock for scrollTo
window.scrollTo = () => {};

// Silence console.log during tests (optional)
// global.console = {
//     ...console,
//     log: () => {},
// };
