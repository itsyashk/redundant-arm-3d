import { mat3_multiply, mat3_vec_multiply, mat3_identity } from '../math/matrix.js';
import { add } from '../math/vector.js';
import { Rz, Ry } from '../math/rotations.js';

export function forwardKinematics(state) {
  const { angles, numJoints, linkLength, jointAxes } = state;
  let R = mat3_identity();
  let currentPos = [0, 0, 0];
  const positions = [currentPos];
  const axes = [];

  for (let i = 0; i < numJoints; i++) {
    // Local axis in joint frame
    const localAxis = jointAxes[i] === 'z' ? [0, 0, 1] : [0, 1, 0];

    // World axis for Jacobian (rotate local axis into world frame)
    const worldAxis = mat3_vec_multiply(R, localAxis);
    axes.push(worldAxis);

    // Joint rotation matrix
    const Rjoint = jointAxes[i] === 'z' ? Rz(angles[i]) : Ry(angles[i]);

    // Accumulate rotation
    R = mat3_multiply(R, Rjoint);

    // Link vector in world frame
    const worldLink = mat3_vec_multiply(R, [0, linkLength, 0]);

    // Next joint position
    currentPos = add(currentPos, worldLink);
    positions.push(currentPos);
  }

  return { positions, axes };
}
