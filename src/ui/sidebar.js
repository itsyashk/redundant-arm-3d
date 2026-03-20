export function createSidebar() {
  const el = document.createElement('div');
  el.id = 'sidebar';
  Object.assign(el.style, {
    position: 'fixed', top: '0', right: '0',
    width: '300px', height: '100vh',
    background: 'rgba(10, 10, 30, 0.88)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    padding: '28px',
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    color: '#c0c0d0',
    overflowY: 'auto',
    zIndex: '10',
    boxSizing: 'border-box'
  });

  // Inject slider/toggle styles
  const style = document.createElement('style');
  style.textContent = `
    .arm-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px;
      background: #2a2a4a; border-radius: 2px; outline: none; margin: 8px 0 16px 0; }
    .arm-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
      width: 16px; height: 16px; border-radius: 50%; background: #00ffcc; cursor: pointer; }
    .arm-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%;
      background: #00ffcc; cursor: pointer; border: none; }
    .arm-toggle { position: relative; display: inline-block; width: 44px; height: 22px; }
    .arm-toggle input { opacity: 0; width: 0; height: 0; }
    .arm-toggle .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background: #2a2a4a; border-radius: 11px; transition: 0.3s; }
    .arm-toggle .slider:before { position: absolute; content: ""; height: 16px; width: 16px;
      left: 3px; bottom: 3px; background: #888; border-radius: 50%; transition: 0.3s; }
    .arm-toggle input:checked + .slider { background: #00ffcc; }
    .arm-toggle input:checked + .slider:before { transform: translateX(22px); background: #fff; }
  `;
  document.head.appendChild(style);

  function makeSection(title) {
    const h = document.createElement('h3');
    h.textContent = title;
    Object.assign(h.style, { fontSize: '0.7em', color: '#666680', textTransform: 'uppercase',
      letterSpacing: '1.5px', marginTop: '24px', marginBottom: '12px' });
    el.appendChild(h);
    return h;
  }

  function makeSliderRow(label, min, max, step, value) {
    const row = document.createElement('div');
    row.style.marginBottom = '4px';
    const lbl = document.createElement('div');
    lbl.style.display = 'flex';
    lbl.style.justifyContent = 'space-between';
    lbl.style.fontSize = '0.8em';
    lbl.style.marginBottom = '2px';
    const name = document.createElement('span');
    name.textContent = label;
    const val = document.createElement('span');
    val.textContent = value;
    val.style.color = '#00ffcc';
    lbl.appendChild(name);
    lbl.appendChild(val);
    row.appendChild(lbl);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.className = 'arm-slider';
    row.appendChild(input);
    el.appendChild(row);
    return { input, valueDisplay: val };
  }

  function makeToggle(label) {
    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: '12px', fontSize: '0.8em' });
    const name = document.createElement('span');
    name.textContent = label;
    row.appendChild(name);
    const toggle = document.createElement('label');
    toggle.className = 'arm-toggle';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    const slider = document.createElement('span');
    slider.className = 'slider';
    toggle.appendChild(cb);
    toggle.appendChild(slider);
    row.appendChild(toggle);
    el.appendChild(row);
    return cb;
  }

  // Title
  const title = document.createElement('h1');
  title.textContent = 'Redundant Arm 3D';
  Object.assign(title.style, { fontSize: '1.3em', color: '#00ffcc', marginBottom: '4px' });
  el.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.textContent = 'Null Space Explorer';
  Object.assign(subtitle.style, { fontSize: '0.75em', color: '#666680', marginBottom: '28px' });
  el.appendChild(subtitle);

  // Configuration
  makeSection('Configuration');
  const joint = makeSliderRow('Degrees of Freedom', 4, 10, 1, 7);

  // Null Space
  makeSection('Null Space');
  const ns = makeSliderRow('Null Space Bias', -1, 1, 0.01, 0);

  // Visualization
  makeSection('Visualization');
  const manipulabilityToggle = makeToggle('Manipulability Ellipsoid');
  const trailToggle = makeToggle('End Effector Trail');

  // Reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Pose';
  Object.assign(resetButton.style, {
    background: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc',
    padding: '10px', borderRadius: '6px', cursor: 'pointer', width: '100%',
    fontFamily: 'inherit', fontSize: '0.85em', marginTop: '16px'
  });
  resetButton.addEventListener('mouseenter', () => { resetButton.style.background = '#00ffcc22'; });
  resetButton.addEventListener('mouseleave', () => { resetButton.style.background = 'transparent'; });
  el.appendChild(resetButton);

  // Stats container
  makeSection('Stats');
  const statsContainer = document.createElement('div');
  statsContainer.id = 'stats-container';
  el.appendChild(statsContainer);

  // Controls info
  makeSection('Controls');
  const info = document.createElement('div');
  info.style.fontSize = '0.7em';
  info.style.color = '#555570';
  info.style.lineHeight = '1.8';
  info.innerHTML = 'Drag the green sphere to move<br>Adjust slider to explore null space<br>Right-click drag to orbit camera<br><br><span style="color:#ffaa00">Tip:</span> Reset pose after changing null space bias to avoid residual swinging';
  el.appendChild(info);

  return {
    element: el,
    jointSlider: joint.input,
    nullSpaceSlider: ns.input,
    manipulabilityToggle,
    trailToggle,
    resetButton,
    jointValueDisplay: joint.valueDisplay,
    nullSpaceValueDisplay: ns.valueDisplay
  };
}
