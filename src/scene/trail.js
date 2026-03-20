import * as THREE from 'three';
import { distance } from '../math/vector.js';

const POOL_SIZE = 400;
const MIN_DISTANCE = 0.005;
const FRAME_SKIP = 3;

export function createTrail(scene) {
  const sharedGeo = new THREE.SphereGeometry(0.015, 6, 4);
  const pool = [];

  for (let i = 0; i < POOL_SIZE; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc, transparent: true, opacity: 1.0
    });
    const sphere = new THREE.Mesh(sharedGeo, mat);
    sphere.visible = false;
    scene.add(sphere);
    pool.push(sphere);
  }

  const trail = {
    pool,
    index: 0,
    frameCounter: 0,
    lastPosition: null,
    setVisible(visible) {
      for (let i = 0; i < POOL_SIZE; i++) {
        if (pool[i].visible && !visible) pool[i].visible = false;
      }
    },
    reset() {
      for (let i = 0; i < POOL_SIZE; i++) {
        pool[i].visible = false;
      }
      trail.index = 0;
      trail.frameCounter = 0;
      trail.lastPosition = null;
    }
  };

  return trail;
}

export function updateTrail(trail, eePosition) {
  trail.frameCounter++;
  if (trail.frameCounter % FRAME_SKIP !== 0) return;

  if (trail.lastPosition === null || distance(eePosition, trail.lastPosition) > MIN_DISTANCE) {
    const idx = trail.index % POOL_SIZE;
    const sphere = trail.pool[idx];
    sphere.position.set(eePosition[0], eePosition[1], eePosition[2]);
    sphere.visible = true;
    sphere.material.opacity = 1.0;
    trail.index++;
    trail.lastPosition = [eePosition[0], eePosition[1], eePosition[2]];
  }

  // Fade older spheres
  for (let i = 0; i < POOL_SIZE; i++) {
    if (trail.pool[i].visible) {
      const age = (trail.index - i) / POOL_SIZE;
      const opacity = Math.max(0.05, 1.0 - age);
      trail.pool[i].material.opacity = opacity;
      if (opacity <= 0.05) trail.pool[i].visible = false;
    }
  }
}
