import './style.css';
import typescriptLogo from './typescript.svg';
import { setupCounter } from './counter.ts';
import '@ui5/webcomponents/dist/Button.js';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
    <ui5-button>Hello UI5 Web Components</ui5-button>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
