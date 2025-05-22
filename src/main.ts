import { init } from './canvas';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = (`
  <canvas id="canvas"></canvas>
  <button id="start-btn" type="button">Find Location</button>
`);

document.getElementById('start-btn')!.addEventListener('click', () => {
  init();
});
