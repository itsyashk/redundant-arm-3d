// 3x3 symmetric matrix eigendecomposition using the Jacobi eigenvalue algorithm.

export function eigendecompose3x3_symmetric(A) {
  // Copy A into a working matrix (3x3 stored as flat array of length 9)
  const M = [
    A[0], A[1], A[2],
    A[3], A[4], A[5],
    A[6], A[7], A[8]
  ];

  // Accumulate eigenvectors — start as identity
  const V = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ];

  const MAX_ITER = 50;
  const EPSILON = 1e-10;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    // Find the largest off-diagonal element
    let maxVal = 0;
    let p = 0, q = 1;
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        const val = Math.abs(M[i*3 + j]);
        if (val > maxVal) {
          maxVal = val;
          p = i;
          q = j;
        }
      }
    }

    // Converged?
    if (maxVal < EPSILON) break;

    // Compute Givens rotation angle
    const Mpp = M[p*3 + p];
    const Mqq = M[q*3 + q];
    const Mpq = M[p*3 + q];

    const theta = 0.5 * Math.atan2(2 * Mpq, Mpp - Mqq);
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    // Apply Givens rotation: M' = G^T * M * G
    // and accumulate: V' = V * G

    // Compute new M values
    const newMpp = c*c*Mpp - 2*s*c*Mpq + s*s*Mqq;
    const newMqq = s*s*Mpp + 2*s*c*Mpq + c*c*Mqq;
    const newMpq = 0; // by construction

    // Update off-diagonal rows/cols for the third index r
    const r = 3 - p - q; // the index that is neither p nor q (works for 0,1,2)
    const Mpr = M[p*3 + r];
    const Mqr = M[q*3 + r];
    const newMpr =  c*Mpr - s*Mqr;
    const newMqr =  s*Mpr + c*Mqr;

    M[p*3 + p] = newMpp;
    M[q*3 + q] = newMqq;
    M[p*3 + q] = newMpq;
    M[q*3 + p] = newMpq;
    M[p*3 + r] = newMpr;
    M[r*3 + p] = newMpr;
    M[q*3 + r] = newMqr;
    M[r*3 + q] = newMqr;

    // Update eigenvector matrix V (columns are eigenvectors)
    for (let i = 0; i < 3; i++) {
      const Vip = V[i*3 + p];
      const Viq = V[i*3 + q];
      V[i*3 + p] =  c*Vip - s*Viq;
      V[i*3 + q] =  s*Vip + c*Viq;
    }
  }

  // Extract eigenvalues from diagonal, clamp to >= 0
  let values = [
    Math.max(M[0], 0),
    Math.max(M[4], 0),
    Math.max(M[8], 0)
  ];

  // Extract eigenvectors as columns of V
  let vectors = [
    [V[0], V[3], V[6]],
    [V[1], V[4], V[7]],
    [V[2], V[5], V[8]]
  ];

  // Sort descending by eigenvalue
  const indices = [0, 1, 2].sort((a, b) => values[b] - values[a]);

  const sortedValues = indices.map(i => values[i]);
  const sortedVectors = indices.map(i => vectors[i]);

  return {
    values: sortedValues,
    vectors: sortedVectors
  };
}
