// Returns 3x3 rotation matrices as Float64Array(9) in row-major order.

export function Rz(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return new Float64Array([c, -s, 0, s, c, 0, 0, 0, 1]);
}

export function Ry(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return new Float64Array([c, 0, s, 0, 1, 0, -s, 0, c]);
}

export function Rx(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return new Float64Array([1, 0, 0, 0, c, -s, 0, s, c]);
}

export function rotationAboutAxis(axis, theta) {
  if (axis === 'x') return Rx(theta);
  if (axis === 'y') return Ry(theta);
  return Rz(theta);
}
