import { forwardKinematics } from './fk.js';
import { computeJacobian } from './jacobian.js';
import { computePseudoinverse, solveIK } from './ik.js';
import { distance, clampScalar } from '../math/vector.js';
import {
  matMN_multiply,
  matN_identity,
  matMN_subtract,
  matMN_vec_multiply
} from '../math/matrix.js';

const NULLSPACE_GAIN = 0.1;
const MAX_NULL_DELTA = 0.03;
const DRIFT_THRESHOLD = 0.002;

export function applyNullSpace(state, sliderValue) {
  // Do nothing if slider is essentially zero or arm is not redundant
  if (Math.abs(sliderValue) < 0.001 || state.numJoints <= 3) return;

  const N = state.numJoints;

  // Step 1: Compute FK and COPY ee position before modification
  const fk = forwardKinematics(state);
  const ee_before = [...fk.positions[N]]; // COPY, not reference

  // Step 2: Compute Jacobian and pseudoinverse
  const J = computeJacobian(fk.positions, fk.axes, N);
  const J_pinv = computePseudoinverse(J, N, 0.5); // Nx3

  // Step 3: Secondary objective — bias toward zero config
  const z = new Array(N);
  for (let i = 0; i < N; i++) {
    z[i] = -sliderValue * NULLSPACE_GAIN * state.angles[i];
  }

  // Step 4: Null space projector: N_proj = I_NxN - J_pinv * J
  // J_pinv is Nx3, J is 3xN, product is NxN
  const JpJ = matMN_multiply(J_pinv, J, N, 3, N); // NxN
  const I_N = matN_identity(N);                     // NxN
  const N_proj = matMN_subtract(I_N, JpJ, N * N);  // NxN

  // Step 5: Project secondary objective into null space
  const dq = matMN_vec_multiply(N_proj, z, N, N);

  // Step 6: Clamp and apply
  for (let i = 0; i < N; i++) {
    const clamped = clampScalar(dq[i], -MAX_NULL_DELTA, MAX_NULL_DELTA);
    state.angles[i] += clamped;
  }

  // Step 7: DRIFT CORRECTION — if ee moved, snap it back
  const fk_after = forwardKinematics(state);
  const ee_after = fk_after.positions[N];
  if (distance(ee_before, ee_after) > DRIFT_THRESHOLD) {
    solveIK(state, ee_before, 3);
  }
}
