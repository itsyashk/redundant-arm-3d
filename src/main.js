import './styles/main.css';
import { createScene } from './scene/setup.js';
import { createGround } from './scene/ground.js';
import { createRobotMeshes, updateRobotMeshes } from './scene/robotMeshes.js';
import { createEllipsoid, updateEllipsoid } from './scene/ellipsoid.js';
import { createTrail, updateTrail } from './scene/trail.js';
import { createDragSystem } from './interaction/drag.js';
import { createSidebar } from './ui/sidebar.js';
import { createStats } from './ui/stats.js';
import { createRobotState, resetAngles } from './kinematics/robot.js';
import { forwardKinematics } from './kinematics/fk.js';
import { computeJacobian, computeManipulability } from './kinematics/jacobian.js';
import { solveIK } from './kinematics/ik.js';
import { applyNullSpace } from './kinematics/nullspace.js';

// --- State ---
let robotState = createRobotState(7);
let ikTarget = null;
let isDraggingActive = false;

// --- DOM Setup ---
const canvasContainer = document.getElementById('canvas-container');
const { scene, camera, renderer, controls } = createScene(canvasContainer);

// --- Scene Objects ---
createGround(scene);
let robotMeshes = createRobotMeshes(scene, robotState.numJoints);
const ellipsoidMesh = createEllipsoid(scene);
const trail = createTrail(scene);

// --- UI ---
const sidebar = createSidebar();
document.body.appendChild(sidebar.element);
const stats = createStats(document.getElementById('stats-container'));

// --- Drag System ---
const drag = createDragSystem(
  camera, renderer, controls,
  () => robotMeshes.eeMesh,
  () => { isDraggingActive = true; },
  (target) => { ikTarget = target; },
  () => { isDraggingActive = false; ikTarget = null; },
  () => robotMeshes.buttons || [],
  (jointIndex, delta) => { robotState.angles[jointIndex] += delta; }
);
scene.add(drag.targetMesh);
scene.add(drag.hitSphere);

// --- UI Event Binding ---
sidebar.jointSlider.addEventListener('input', (e) => {
  const n = parseInt(e.target.value);
  sidebar.jointValueDisplay.textContent = n;
  robotMeshes.dispose();
  robotState = createRobotState(n);
  robotMeshes = createRobotMeshes(scene, n);
  trail.reset();
});

sidebar.nullSpaceSlider.addEventListener('input', (e) => {
  sidebar.nullSpaceValueDisplay.textContent = parseFloat(e.target.value).toFixed(2);
});

sidebar.resetButton.addEventListener('click', () => {
  resetAngles(robotState);
  trail.reset();
});

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  // 1. IK if dragging
  if (isDraggingActive && ikTarget) {
    solveIK(robotState, ikTarget, 5);
  }

  // 2. Null space
  const nullValue = parseFloat(sidebar.nullSpaceSlider.value);
  if (Math.abs(nullValue) > 0.001 && robotState.numJoints > 3) {
    applyNullSpace(robotState, nullValue);
  }

  // 3. Ground enforcement — keep end effector above floor
  {
    const fkCheck = forwardKinematics(robotState);
    const eeY = fkCheck.positions[robotState.numJoints][1];
    if (eeY < 0.05) {
      const eePos = fkCheck.positions[robotState.numJoints];
      solveIK(robotState, [eePos[0], 0.05, eePos[2]], 3);
    }
  }

  // 4. FK for rendering
  const fk = forwardKinematics(robotState);

  // 4. Update meshes
  updateRobotMeshes(robotMeshes, fk.positions);

  // 5. Update hit sphere position for drag detection
  drag.hitSphere.position.copy(robotMeshes.eeMesh.position);

  // 6. Ellipsoid
  const J = computeJacobian(fk.positions, fk.axes, robotState.numJoints);
  if (sidebar.manipulabilityToggle.checked) {
    updateEllipsoid(ellipsoidMesh, J, robotState.numJoints, fk.positions[robotState.numJoints]);
    ellipsoidMesh.visible = true;
  } else {
    ellipsoidMesh.visible = false;
  }

  // 7. Trail
  if (sidebar.trailToggle.checked) {
    updateTrail(trail, fk.positions[robotState.numJoints]);
  }

  // 8. Stats
  const w = computeManipulability(J, robotState.numJoints);
  stats.update(w, fk.positions[robotState.numJoints], robotState.angles);

  // 9. Render
  controls.update();
  renderer.render(scene, camera);
}

animate();
