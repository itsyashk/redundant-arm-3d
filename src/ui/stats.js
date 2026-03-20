export function createStats(container) {
  const manipEl = document.createElement('div');
  manipEl.style.fontSize = '0.75em';
  manipEl.style.marginBottom = '6px';
  manipEl.style.fontFamily = 'inherit';

  const posEl = document.createElement('div');
  posEl.style.fontSize = '0.75em';
  posEl.style.marginBottom = '6px';

  const anglesEl = document.createElement('div');
  anglesEl.style.fontSize = '0.75em';
  anglesEl.style.wordBreak = 'break-all';

  container.appendChild(manipEl);
  container.appendChild(posEl);
  container.appendChild(anglesEl);

  return {
    update(manipulability, eePosition, angles) {
      manipEl.textContent = `Manipulability: ${manipulability.toFixed(3)}`;
      posEl.textContent = `EE Position: (${eePosition[0].toFixed(2)}, ${eePosition[1].toFixed(2)}, ${eePosition[2].toFixed(2)})`;
      const degs = [];
      for (let i = 0; i < angles.length; i++) {
        degs.push((angles[i] * 180 / Math.PI).toFixed(1));
      }
      anglesEl.textContent = `Joint Angles: ${degs.join(' ')}`;
    }
  };
}
