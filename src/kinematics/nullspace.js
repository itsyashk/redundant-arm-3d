import { forwardKinematics } from './fk.js';
import { computeJacobian } from './jacobian.js';
import { computePseudoinverse } from './ik.js';
import { distance, clampScalar, sub, norm, scale, normalize } from '../math/vector.js';
import {
  matMN_multiply,
  matN_identity,
  matMN_subtract,
  matMN_vec_multiply
} from '../math/matrix.js';

const NULLSPACE_GAIN = 0.1;
const MAX_NULL_DELTA = 0.03;

// Low-damping IK specifically for drift correction (tiny errors, need precision)
function correctDrift(state, target, iterations) {
  const N = state.numJoints;
  const LAMBDA = 0.05; // much lower than the main IK solver
  const MAX_DQ = 0.05;

  for (let iter = 0; iter < iterations; iter++) {
    const fk = forwardKinematics(state);
    const ee = fk.positions[N];
    let error = sub(target, ee);
    const errNorm = norm(error);

    if (errNorm < 0.0001) break;

    if (errNorm > 0.1) {
      error = scale(normalize(error), 0.1);
    }

    const J = computeJacobian(fk.positions, fk.axes, N);
    const J_pinv = computePseudoinverse(J, N, LAMBDA);
    const delta_q = matMN_vec_multiply(J_pinv, error, N, 3);

    for (let i = 0; i < N; i++) {
      state.angles[i] += clampScalar(delta_q[i], -MAX_DQ, MAX_DQ);
    }
  }
}

export function applyNullSpace(state, sliderValue) {
  if (Math.abs(sliderValue) < 0.001 || state.numJoints <= 3) return;

  const N = state.numJoints;

  // Save ee position BEFORE any modification
  const fk = forwardKinematics(state);
  const ee_before = [...fk.positions[N]];

  // Compute Jacobian and pseudoinverse
  const J = computeJacobian(fk.positions, fk.axes, N);
  const J_pinv = computePseudoinverse(J, N, 0.5);

  // Secondary objective — bias toward zero config
  const z = new Array(N);
  for (let i = 0; i < N; i++) {
    z[i] = -sliderValue * NULLSPACE_GAIN * state.angles[i];
  }

  // Null space projector: N_proj = I - J_pinv * J
  const JpJ = matMN_multiply(J_pinv, J, N, 3, N);
  const I_N = matN_identity(N);
  const N_proj = matMN_subtract(I_N, JpJ, N * N);

  // Project and apply
  const dq = matMN_vec_multiply(N_proj, z, N, N);
  for (let i = 0; i < N; i++) {
    state.angles[i] += clampScalar(dq[i], -MAX_NULL_DELTA, MAX_NULL_DELTA);
  }

  // Drift correction — use low-damping solver for precise snap-back
  correctDrift(state, ee_before, 8);
}
