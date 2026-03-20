import * as THREE from 'three';

const JOINT_STEP = 0.08; // radians per click on a joint button

export function createDragSystem(camera, renderer, controls, getEEMesh, onDragStart, onDrag, onDragEnd, getButtons, onJointStep) {
  let isDragging = false;
  const dragPlane = new THREE.Plane();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const intersection = new THREE.Vector3();

  // Larger invisible sphere for easier grabbing
  const hitGeo = new THREE.SphereGeometry(0.2, 8, 6);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitSphere = new THREE.Mesh(hitGeo, hitMat);

  // Target indicator
  const targetGeo = new THREE.SphereGeometry(0.05, 12, 8);
  const targetMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00, transparent: true, opacity: 0.6
  });
  const targetMesh = new THREE.Mesh(targetGeo, targetMat);
  targetMesh.visible = false;

  // Joint button hold state
  let heldButton = null;
  let holdInterval = null;

  function updateHitSphere() {
    const ee = getEEMesh();
    if (ee) hitSphere.position.copy(ee.position);
  }

  function getMouse(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onPointerDown(event) {
    getMouse(event);
    raycaster.setFromCamera(mouse, camera);

    // Check joint buttons first
    const buttons = getButtons ? getButtons() : [];
    if (buttons.length > 0) {
      const btnMeshes = buttons.map(b => b.mesh);
      const btnHits = raycaster.intersectObjects(btnMeshes);
      if (btnHits.length > 0) {
        const hitMesh = btnHits[0].object;
        const btn = buttons.find(b => b.mesh === hitMesh);
        if (btn && onJointStep) {
          onJointStep(btn.jointIndex, btn.direction * JOINT_STEP);
          heldButton = btn;
          // Repeat while held
          holdInterval = setInterval(() => {
            if (heldButton) onJointStep(heldButton.jointIndex, heldButton.direction * JOINT_STEP);
          }, 100);
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
    }

    // Check end effector
    updateHitSphere();
    const intersects = raycaster.intersectObjects([getEEMesh(), hitSphere]);

    if (intersects.length > 0) {
      isDragging = true;
      controls.enabled = false;

      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const eePos = getEEMesh().position.clone();
      dragPlane.setFromNormalAndCoplanarPoint(camDir, eePos);

      onDragStart();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function onPointerMove(event) {
    if (!isDragging) return;

    getMouse(event);
    raycaster.setFromCamera(mouse, camera);

    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
      // Clamp above ground
      if (intersection.y < 0.05) intersection.y = 0.05;

      if (intersection.distanceTo(getEEMesh().position) < 5) {
        targetMesh.position.copy(intersection);
        targetMesh.visible = true;
        onDrag([intersection.x, intersection.y, intersection.z]);
      }
    }
    event.preventDefault();
  }

  function onPointerUp() {
    if (isDragging) {
      isDragging = false;
      controls.enabled = true;
      targetMesh.visible = false;
      onDragEnd();
    }
    // Release joint button hold
    if (heldButton) {
      heldButton = null;
      clearInterval(holdInterval);
      holdInterval = null;
    }
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  return {
    isDragging: () => isDragging,
    targetMesh,
    hitSphere,
    dispose() {
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (holdInterval) clearInterval(holdInterval);
    }
  };
}
