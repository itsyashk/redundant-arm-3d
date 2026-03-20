// All matrices stored as flat Float64Array in ROW-MAJOR order.
// Element (i,j) of an MxN matrix is at index i*N + j.

// --- Creation ---

export function mat3_identity() {
  return new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
}

export function matN_identity(n) {
  const result = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    result[i * n + i] = 1;
  }
  return result;
}

export function mat_zeros(rows, cols) {
  return new Float64Array(rows * cols);
}


// --- 3x3 Operations ---

export function mat3_multiply(A, B) {
  const C = new Float64Array(9);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum += A[i*3 + k] * B[k*3 + j];
      }
      C[i*3 + j] = sum;
    }
  }
  return C;
}

export function mat3_transpose(A) {
  return new Float64Array([
    A[0], A[3], A[6],
    A[1], A[4], A[7],
    A[2], A[5], A[8]
  ]);
}

export function mat3_vec_multiply(A, v) {
  return [
    A[0]*v[0] + A[1]*v[1] + A[2]*v[2],
    A[3]*v[0] + A[4]*v[1] + A[5]*v[2],
    A[6]*v[0] + A[7]*v[1] + A[8]*v[2]
  ];
}

export function mat3_determinant(A) {
  return (
    A[0] * (A[4]*A[8] - A[5]*A[7]) -
    A[1] * (A[3]*A[8] - A[5]*A[6]) +
    A[2] * (A[3]*A[7] - A[4]*A[6])
  );
}

export function mat3_inverse(A) {
  const det = mat3_determinant(A);
  if (Math.abs(det) < 1e-10) return mat3_identity();

  const invDet = 1 / det;
  const result = new Float64Array(9);

  // Cofactor matrix (transposed = adjugate)
  result[0] =  (A[4]*A[8] - A[5]*A[7]) * invDet;
  result[1] = -(A[1]*A[8] - A[2]*A[7]) * invDet;
  result[2] =  (A[1]*A[5] - A[2]*A[4]) * invDet;
  result[3] = -(A[3]*A[8] - A[5]*A[6]) * invDet;
  result[4] =  (A[0]*A[8] - A[2]*A[6]) * invDet;
  result[5] = -(A[0]*A[5] - A[2]*A[3]) * invDet;
  result[6] =  (A[3]*A[7] - A[4]*A[6]) * invDet;
  result[7] = -(A[0]*A[7] - A[1]*A[6]) * invDet;
  result[8] =  (A[0]*A[4] - A[1]*A[3]) * invDet;

  return result;
}

export function mat3_add_scaled_identity(A, s) {
  // Returns A + s*I as a NEW Float64Array — does NOT mutate input
  const result = new Float64Array(A);
  result[0] += s;
  result[4] += s;
  result[8] += s;
  return result;
}


// --- General MxN Operations ---

export function matMN_multiply(A, B, rowsA, colsA, colsB) {
  const C = new Float64Array(rowsA * colsB);
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i*colsA + k] * B[k*colsB + j];
      }
      C[i*colsB + j] = sum;
    }
  }
  return C;
}

export function matMN_transpose(A, rows, cols) {
  const result = new Float64Array(cols * rows);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j*rows + i] = A[i*cols + j];
    }
  }
  return result;
}

export function matMN_vec_multiply(A, v, rows, cols) {
  const result = new Array(rows);
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i*cols + j] * v[j];
    }
    result[i] = sum;
  }
  return result;
}

export function matMN_subtract(A, B, len) {
  const result = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = A[i] - B[i];
  }
  return result;
}
