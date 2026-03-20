import * as THREE from 'three';

export function createDragSystem(camera, renderer, controls, getEEMesh, onDragStart, onDrag, onDragEnd) {
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

  function updateHitSphere() {
    const ee = getEEMesh();
    if (ee) hitSphere.position.copy(ee.position);
  }

  function onPointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

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

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
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
    }
  };
}
