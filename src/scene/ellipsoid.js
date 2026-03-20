import * as THREE from 'three';
import { eigendecompose3x3_symmetric } from '../math/eigen.js';
import { matMN_multiply, matMN_transpose } from '../math/matrix.js';

const VISUAL_SCALE = 0.4;

export function createEllipsoid(scene) {
  const geo = new THREE.SphereGeometry(1, 20, 14);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00ff88, transparent: true, opacity: 0.15, wireframe: true
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  scene.add(mesh);
  return mesh;
}

export function updateEllipsoid(mesh, J, numJoints, eePosition) {
  const Jt = matMN_transpose(J, 3, numJoints);
  const JJt = matMN_multiply(J, Jt, 3, numJoints, 3);

  const { values, vectors } = eigendecompose3x3_symmetric(JJt);

  const s0 = Math.sqrt(Math.max(values[0], 0)) * VISUAL_SCALE;
  const s1 = Math.sqrt(Math.max(values[1], 0)) * VISUAL_SCALE;
  const s2 = Math.sqrt(Math.max(values[2], 0)) * VISUAL_SCALE;
  mesh.scale.set(
    Math.max(s0, 0.01),
    Math.max(s1, 0.01),
    Math.max(s2, 0.01)
  );

  const v1 = vectors[0];
  const v2 = vectors[1];
  const v3 = vectors[2];
  const m = new THREE.Matrix4();
  m.makeBasis(
    new THREE.Vector3(v1[0], v1[1], v1[2]),
    new THREE.Vector3(v2[0], v2[1], v2[2]),
    new THREE.Vector3(v3[0], v3[1], v3[2])
  );
  mesh.quaternion.setFromRotationMatrix(m);
  mesh.position.set(eePosition[0], eePosition[1], eePosition[2]);
}
