export const DEFAULT_NUM_JOINTS = 7;
export const MIN_JOINTS = 4;
export const MAX_JOINTS = 10;
export const LINK_LENGTH = 0.4;

export function createRobotState(numJoints) {
  const angles = new Float64Array(numJoints);
  // CRITICAL: Initialize with random perturbations [-0.15, 0.15] to break singularity
  for (let i = 0; i < numJoints; i++) {
    angles[i] = (Math.random() - 0.5) * 0.3;
  }
  const jointAxes = [];
  for (let i = 0; i < numJoints; i++) {
    jointAxes.push(i % 2 === 0 ? 'z' : 'y'); // even=z, odd=y
  }
  return {
    numJoints,
    angles,
    linkLength: LINK_LENGTH,
    jointAxes,
    localLinkVector: [0, LINK_LENGTH, 0]
  };
}

export function resetAngles(state) {
  for (let i = 0; i < state.numJoints; i++) {
    state.angles[i] = (Math.random() - 0.5) * 0.3; // NOT zero - random perturbation
  }
}
