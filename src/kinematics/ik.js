import { forwardKinematics } from './fk.js';
import { computeJacobian, computeManipulability } from './jacobian.js';
import { sub, norm, normalize, scale, clampScalar } from '../math/vector.js';
import {
  mat3_inverse,
  mat3_add_scaled_identity,
  matMN_multiply,
  matMN_transpose,
  matMN_vec_multiply
} from '../math/matrix.js';

const BASE_LAMBDA = 0.5;
const MAX_DELTA_Q = 0.05;
const MAX_ERROR = 0.5;

export function solveIK(state, target, iterations = 5) {
  const N = state.numJoints;

  for (let iter = 0; iter < iterations; iter++) {
    const fk = forwardKinematics(state);
    const ee = fk.positions[N];
    let error = sub(target, ee);

    // Early exit if close enough
    if (norm(error) < 0.001) break;

    // Clamp error vector magnitude
    if (norm(error) > MAX_ERROR) {
      error = scale(normalize(error), MAX_ERROR);
    }

    const J = computeJacobian(fk.positions, fk.axes, N);

    // Adaptive damping based on manipulability
    const w = computeManipulability(J, N);
    let lambda = BASE_LAMBDA + (w < 0.01 ? 0.5 / (w + 0.001) : 0);
    lambda = Math.min(lambda, 5.0);

    const J_pinv = computePseudoinverse(J, N, lambda);

    // delta_q = J_pinv * error
    const delta_q = matMN_vec_multiply(J_pinv, error, N, 3);

    // Clamp per joint and apply
    for (let i = 0; i < N; i++) {
      const dq = clampScalar(delta_q[i], -MAX_DELTA_Q, MAX_DELTA_Q);
      state.angles[i] += dq;
    }
  }
}

export function computePseudoinverse(J, numJoints, lambda) {
  const N = numJoints;

  // Jt: NxN^T = Nx3
  const Jt = matMN_transpose(J, 3, N);             // Nx3

  // JJt: 3x3
  const JJt = matMN_multiply(J, Jt, 3, N, 3);      // 3x3

  // Damped: JJt + lambda^2 * I
  const JJt_damped = mat3_add_scaled_identity(JJt, lambda * lambda); // 3x3

  // Inverse of damped JJt
  const JJt_inv = mat3_inverse(JJt_damped);         // 3x3

  // J_pinv = Jt * JJt_inv: (Nx3) * (3x3) = Nx3
  const J_pinv = matMN_multiply(Jt, JJt_inv, N, 3, 3); // Nx3

  return J_pinv;
}
