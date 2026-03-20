import * as THREE from 'three';

export function createRobotMeshes(scene, numJoints) {
  const linkMeshes = [];
  const jointMeshes = [];

  // Shared joint geometry
  const jointGeo = new THREE.SphereGeometry(0.06, 16, 12);
  const jointMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0, emissive: 0x222233, roughness: 0.3, metalness: 0.6
  });

  // Link geometry (unit height, scaled per frame)
  const linkGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 8);

  for (let i = 0; i < numJoints; i++) {
    // Link
    const hue = (i / numJoints) * 0.8;
    const linkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.7, 0.55)
    });
    const link = new THREE.Mesh(linkGeo, linkMat);
    link.castShadow = true;
    scene.add(link);
    linkMeshes.push(link);

    // Joint
    const joint = new THREE.Mesh(jointGeo, jointMat.clone());
    joint.castShadow = true;
    scene.add(joint);
    jointMeshes.push(joint);
  }

  // End effector
  const eeGeo = new THREE.SphereGeometry(0.1, 24, 18);
  const eeMat = new THREE.MeshStandardMaterial({
    color: 0x00ffcc, emissive: 0x00aa88, emissiveIntensity: 0.5,
    roughness: 0.2, metalness: 0.8
  });
  const eeMesh = new THREE.Mesh(eeGeo, eeMat);
  scene.add(eeMesh);

  const eeLight = new THREE.PointLight(0x00ffcc, 1.0, 3);
  eeMesh.add(eeLight);

  // Base
  const baseGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.08, 24);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x444466, roughness: 0.5, metalness: 0.7
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.04;
  scene.add(baseMesh);

  function dispose() {
    for (const mesh of linkMeshes) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    for (const mesh of jointMeshes) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    eeMesh.remove(eeLight);
    eeLight.dispose();
    scene.remove(eeMesh);
    eeGeo.dispose();
    eeMat.dispose();
    scene.remove(baseMesh);
    baseGeo.dispose();
    baseMat.dispose();
  }

  return { linkMeshes, jointMeshes, eeMesh, eeLight, baseMesh, dispose };
}

export function updateRobotMeshes(meshes, positions) {
  const { linkMeshes, jointMeshes, eeMesh } = meshes;
  const numJoints = linkMeshes.length;

  for (let i = 0; i < numJoints; i++) {
    jointMeshes[i].position.set(...positions[i]);
  }

  eeMesh.position.set(...positions[numJoints]);

  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < numJoints; i++) {
    const p1 = new THREE.Vector3(...positions[i]);
    const p2 = new THREE.Vector3(...positions[i + 1]);
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    const dir = p2.clone().sub(p1);
    const len = dir.length();

    linkMeshes[i].position.copy(mid);
    linkMeshes[i].scale.set(1, len, 1);

    const quat = new THREE.Quaternion();
    if (len > 1e-6) {
      quat.setFromUnitVectors(up, dir.normalize());
    }
    linkMeshes[i].quaternion.copy(quat);
  }
}
