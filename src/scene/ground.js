import * as THREE from 'three';

export function createGround(scene) {
  const planeGeo = new THREE.PlaneGeometry(20, 20);
  const planeMat = new THREE.MeshStandardMaterial({ color: 0x15152a, roughness: 0.9 });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);

  const grid = new THREE.GridHelper(20, 40, 0x333355, 0x222244);
  grid.position.y = 0.001;
  scene.add(grid);
}
