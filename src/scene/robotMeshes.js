import * as THREE from 'three';

// UR-robot style color palette
const COLOR_BODY = 0x2a2d35;
const COLOR_JOINT = 0x3a3d45;
const COLOR_ACCENT = 0x3b82f6;
const COLOR_METAL = 0x8a8d95;
const COLOR_BASE = 0x1e2028;
const COLOR_EE = 0x00ffcc;

// Shared geometries (created once, reused)
let _sharedGeo = null;
function getSharedGeo() {
  if (_sharedGeo) return _sharedGeo;
  _sharedGeo = {
    // Link: thick cylinder, unit height centered at origin (y=-0.5 to y=0.5)
    link: new THREE.CylinderGeometry(0.038, 0.038, 1, 12),
    // Shoulder pieces that flare out at each end of a link
    shoulder: new THREE.CylinderGeometry(0.055, 0.042, 0.06, 16),
    // Joint motor housing
    motor: new THREE.CylinderGeometry(0.065, 0.065, 0.10, 24),
    // Accent ring
    ring: new THREE.TorusGeometry(0.068, 0.007, 8, 24),
    // Button cone
    btnCone: new THREE.ConeGeometry(0.022, 0.04, 3),
  };
  return _sharedGeo;
}

export function createRobotMeshes(scene, numJoints) {
  const geo = getSharedGeo();
  const linkMeshes = [];
  const jointGroups = [];
  const allMeshes = [];   // flat list for dispose
  const allMaterials = [];

  const jointAxes = [];
  for (let i = 0; i < numJoints; i++) {
    jointAxes.push(i % 2 === 0 ? 'z' : 'y');
  }

  // --- Materials ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: COLOR_BODY, roughness: 0.4, metalness: 0.6
  });
  const jointMat = new THREE.MeshStandardMaterial({
    color: COLOR_JOINT, roughness: 0.35, metalness: 0.7
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: COLOR_ACCENT, emissive: COLOR_ACCENT, emissiveIntensity: 0.15,
    roughness: 0.3, metalness: 0.8
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: COLOR_METAL, roughness: 0.2, metalness: 0.9
  });
  allMaterials.push(bodyMat, jointMat, accentMat, metalMat);

  for (let i = 0; i < numJoints; i++) {
    // --- Link: thick cylinder (positioned/scaled in update) ---
    const link = new THREE.Mesh(geo.link, bodyMat);
    link.castShadow = true;
    scene.add(link);
    linkMeshes.push(link);
    allMeshes.push(link);

    // --- Joint housing group ---
    const jGroup = new THREE.Group();

    // Motor cylinder — orient along joint axis
    const motor = new THREE.Mesh(geo.motor, jointMat);
    motor.castShadow = true;
    if (jointAxes[i] === 'z') {
      motor.rotation.x = Math.PI / 2;
    }
    jGroup.add(motor);

    // Accent ring
    const ring = new THREE.Mesh(geo.ring, accentMat);
    if (jointAxes[i] === 'z') {
      // Torus default is in XZ plane; for Z-axis joint we want it in XY plane
      // Actually torus default lies in XY plane, so rotate to XZ for Z joints
      ring.rotation.x = Math.PI / 2;
    }
    jGroup.add(ring);

    // Shoulder flares on each side of the joint (bridge into adjacent links)
    const shoulderIn = new THREE.Mesh(geo.shoulder, metalMat);
    shoulderIn.position.y = -0.05;
    jGroup.add(shoulderIn);

    const shoulderOut = new THREE.Mesh(geo.shoulder, metalMat);
    shoulderOut.rotation.x = Math.PI; // flip so flare faces outward
    shoulderOut.position.y = 0.05;
    jGroup.add(shoulderOut);

    scene.add(jGroup);
    jointGroups.push(jGroup);
    allMeshes.push(motor, ring, shoulderIn, shoulderOut);
  }

  // --- End effector ---
  const eeGroup = new THREE.Group();

  const wristGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.04, 20);
  const wristMat = new THREE.MeshStandardMaterial({
    color: COLOR_METAL, roughness: 0.25, metalness: 0.85
  });
  const wrist = new THREE.Mesh(wristGeo, wristMat);
  eeGroup.add(wrist);

  const fingerGeo = new THREE.BoxGeometry(0.012, 0.08, 0.025);
  const fingerMat = new THREE.MeshStandardMaterial({
    color: COLOR_EE, emissive: 0x00aa88, emissiveIntensity: 0.4,
    roughness: 0.2, metalness: 0.8
  });
  const f1 = new THREE.Mesh(fingerGeo, fingerMat);
  f1.position.set(-0.025, -0.055, 0);
  f1.rotation.z = 0.1;
  const f2 = new THREE.Mesh(fingerGeo, fingerMat);
  f2.position.set(0.025, -0.055, 0);
  f2.rotation.z = -0.1;
  eeGroup.add(f1, f2);

  const glowGeo = new THREE.SphereGeometry(0.025, 16, 12);
  const glowMat = new THREE.MeshStandardMaterial({
    color: COLOR_EE, emissive: COLOR_EE, emissiveIntensity: 0.8,
    roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.9
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = -0.04;
  eeGroup.add(glow);

  const eeLight = new THREE.PointLight(COLOR_EE, 1.0, 3);
  eeLight.position.y = -0.04;
  eeGroup.add(eeLight);

  allMaterials.push(wristMat, fingerMat, glowMat);
  allMeshes.push(wrist, f1, f2, glow);

  // Invisible hit sphere for dragging (eeMesh is the draggable handle)
  const eeHitGeo = new THREE.SphereGeometry(0.1, 8, 6);
  const eeHitMat = new THREE.MeshBasicMaterial({ visible: false });
  const eeMesh = new THREE.Mesh(eeHitGeo, eeHitMat);
  eeMesh.add(eeGroup);
  scene.add(eeMesh);
  allMaterials.push(eeHitMat);

  // --- Base pedestal ---
  const baseGroup = new THREE.Group();
  const baseLowerGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.05, 32);
  const baseLowerMat = new THREE.MeshStandardMaterial({
    color: COLOR_BASE, roughness: 0.5, metalness: 0.8
  });
  const baseLower = new THREE.Mesh(baseLowerGeo, baseLowerMat);
  baseLower.position.y = 0.025;
  baseLower.receiveShadow = true;
  baseGroup.add(baseLower);

  const baseUpperGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.06, 32);
  const baseUpper = new THREE.Mesh(baseUpperGeo, jointMat);
  baseUpper.position.y = 0.08;
  baseGroup.add(baseUpper);

  const baseRingGeo = new THREE.TorusGeometry(0.145, 0.006, 8, 32);
  const baseRing = new THREE.Mesh(baseRingGeo, accentMat);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.05;
  baseGroup.add(baseRing);

  scene.add(baseGroup);
  allMaterials.push(baseLowerMat);
  allMeshes.push(baseLower, baseUpper, baseRing);

  // --- Joint control buttons ---
  const plusMat = new THREE.MeshStandardMaterial({
    color: 0x22dd66, emissive: 0x11aa44, emissiveIntensity: 0.3,
    roughness: 0.3, metalness: 0.5
  });
  const minusMat = new THREE.MeshStandardMaterial({
    color: 0xdd4444, emissive: 0xaa2222, emissiveIntensity: 0.3,
    roughness: 0.3, metalness: 0.5
  });
  allMaterials.push(plusMat, minusMat);

  const buttons = [];
  const buttonMeshes = [];
  for (let i = 0; i < numJoints; i++) {
    const plus = new THREE.Mesh(geo.btnCone, plusMat);
    scene.add(plus);
    buttonMeshes.push(plus);
    buttons.push({ mesh: plus, jointIndex: i, direction: 1 });

    const minus = new THREE.Mesh(geo.btnCone, minusMat);
    scene.add(minus);
    buttonMeshes.push(minus);
    buttons.push({ mesh: minus, jointIndex: i, direction: -1 });
  }

  // --- Dispose ---
  function dispose() {
    for (const m of linkMeshes) scene.remove(m);
    for (const g of jointGroups) scene.remove(g);
    scene.remove(eeMesh);
    scene.remove(baseGroup);
    for (const b of buttonMeshes) scene.remove(b);
    // Dispose unique geos (not shared)
    for (const g of [wristGeo, fingerGeo, glowGeo, eeHitGeo, baseLowerGeo, baseUpperGeo, baseRingGeo]) {
      g.dispose();
    }
    for (const m of allMaterials) m.dispose();
    eeLight.dispose();
  }

  return {
    linkMeshes, jointMeshes: jointGroups, eeMesh, eeLight,
    baseMesh: baseGroup, eeGroup, buttons, buttonMeshes, dispose
  };
}

export function updateRobotMeshes(meshes, positions) {
  const { linkMeshes, jointMeshes, eeMesh, buttons } = meshes;
  const numJoints = linkMeshes.length;
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < numJoints; i++) {
    const p1 = new THREE.Vector3(...positions[i]);
    const p2 = new THREE.Vector3(...positions[i + 1]);
    const dir = p2.clone().sub(p1);
    const len = dir.length();

    // --- Position joint at start of this link ---
    jointMeshes[i].position.copy(p1);
    // Orient joint group so its local Y aligns with the link direction
    if (len > 1e-6) {
      const q = new THREE.Quaternion();
      q.setFromUnitVectors(up, dir.clone().normalize());
      jointMeshes[i].quaternion.copy(q);
    }

    // --- Link cylinder spans from p1 to p2 ---
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    linkMeshes[i].position.copy(mid);
    linkMeshes[i].scale.set(1, len, 1);
    const quat = new THREE.Quaternion();
    if (len > 1e-6) {
      quat.setFromUnitVectors(up, dir.clone().normalize());
    }
    linkMeshes[i].quaternion.copy(quat);
  }

  // End effector
  eeMesh.position.set(...positions[numJoints]);
  // Orient ee along the last link direction
  if (numJoints > 0) {
    const pPrev = new THREE.Vector3(...positions[numJoints - 1]);
    const pEE = new THREE.Vector3(...positions[numJoints]);
    const eeDir = pEE.clone().sub(pPrev);
    if (eeDir.length() > 1e-6) {
      const q = new THREE.Quaternion();
      q.setFromUnitVectors(up, eeDir.normalize());
      eeMesh.quaternion.copy(q);
    }
  }

  // --- Joint buttons: offset perpendicular to link direction ---
  if (buttons && buttons.length > 0) {
    for (let b = 0; b < buttons.length; b++) {
      const { mesh, jointIndex, direction } = buttons[b];
      const jp = new THREE.Vector3(...positions[jointIndex]);
      // Get link direction to compute a perpendicular offset
      const nextP = new THREE.Vector3(...positions[jointIndex + 1]);
      const linkDir = nextP.clone().sub(jp);
      if (linkDir.length() < 1e-6) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      linkDir.normalize();
      // Find a perpendicular vector (cross with world Z, fallback to X)
      let perp = new THREE.Vector3().crossVectors(linkDir, new THREE.Vector3(0, 0, 1));
      if (perp.length() < 0.1) {
        perp.crossVectors(linkDir, new THREE.Vector3(1, 0, 0));
      }
      perp.normalize();

      const offset = 0.11;
      const along = direction > 0 ? 0.03 : -0.03;
      mesh.position.copy(jp)
        .addScaledVector(perp, offset)
        .addScaledVector(linkDir, along);

      // Orient cone: + points along link, - points opposite
      const q = new THREE.Quaternion();
      if (direction > 0) {
        q.setFromUnitVectors(up, linkDir);
      } else {
        q.setFromUnitVectors(up, linkDir.clone().negate());
      }
      mesh.quaternion.copy(q);
    }
  }
}
