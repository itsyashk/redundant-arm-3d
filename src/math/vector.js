export function dot(a, b) {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

export function cross(a, b) {
  return [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ];
}

export function add(a, b) {
  return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}

export function sub(a, b) {
  return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}

export function scale(a, s) {
  return [a[0]*s, a[1]*s, a[2]*s];
}

export function norm(a) {
  return Math.sqrt(dot(a, a));
}

export function normalize(a) {
  const n = norm(a);
  if (n < 1e-10) return [0, 0, 0];
  return scale(a, 1/n);
}

export function distance(a, b) {
  return norm(sub(a, b));
}

export function clampScalar(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
