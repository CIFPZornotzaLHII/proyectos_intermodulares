// Entorno de pruebas (jsdom): sin WebGL ni observadores, los componentes visuales de React Bits se sustituyen
// por versiones vacías o planas. La lógica de la web (páginas, API, sesión, textos) se prueba de verdad.
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

class ObservadorVacio { observe() {} unobserve() {} disconnect() {} }
globalThis.IntersectionObserver = ObservadorVacio;
globalThis.ResizeObserver = ObservadorVacio;
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
HTMLCanvasElement.prototype.getContext = () => null;

vi.mock('../src/reactbits/LiquidEther.jsx', () => ({ default: () => null }));
vi.mock('../src/reactbits/DotGrid.jsx', () => ({ default: () => null }));
vi.mock('../src/reactbits/Orb.jsx', () => ({ default: () => null }));
vi.mock('../src/reactbits/AnimatedContent.jsx', () => ({ default: ({ children, className }) => React.createElement('div', { className }, children) }));
vi.mock('../src/reactbits/BlurText.jsx', () => ({ default: ({ text, className }) => React.createElement('p', { className }, text) }));
vi.mock('../src/reactbits/CountUp.jsx', () => ({ default: ({ to }) => React.createElement('span', null, String(to)) }));
