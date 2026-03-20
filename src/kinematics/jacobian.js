import { cross, sub } from '../math/vector.js';
import { mat3_determinant, matMN_multiply, matMN_transpose } from '../math/matrix.js';

export function computeJacobian(positions, axes, numJoints) {
  // Returns Float64Array(3 * numJoints) -- 3xN matrix in row-major order
  const J = new Float64Array(3 * numJoints);

  for (let i = 0; i < numJoints; i++) {
    // Vector from joint i to end effector
    const r = sub(positions[numJoints], positions[i]);
    // Linear velocity contribution: axis x r
    const col = cross(axes[i], r);

    J[0 * numJoints + i] = col[0]; // row 0 (x)
    J[1 * numJoints + i] = col[1]; // row 1 (y)
    J[2 * numJoints + i] = col[2]; // row 2 (z)
  }

  return J;
}

export function computeManipulability(J, numJoints) {
  // Compute JJt (3x3) then return sqrt(max(det(JJt), 0))
  const Jt = matMN_transpose(J, 3, numJoints);       // Nx3
  const JJt = matMN_multiply(J, Jt, 3, numJoints, 3); // 3x3
  const det = mat3_determinant(JJt);
  return Math.sqrt(Math.max(det, 0));
}
