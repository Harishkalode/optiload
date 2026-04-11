/**
 * SecurementRenderer.ts - 3D rendering for securements (airbags, straps, risers, etc.)
 */

import * as THREE from 'three';

export interface Securement {
  id: number;
  type: string;
  position: [number, number, number];
  load_id: number;
  reason?: string;
  [key: string]: any;
}

export function createAirbagMesh(position: [number, number, number], level: number): THREE.Mesh {
  /**
   * Create airbag visualization (colored box by level)
   * Level 1-5 maps to color spectrum: blue → red
   */
  const colors = [
    0x0066ff, // Level 1: blue
    0x00ccff, // Level 2: cyan
    0x00ff00, // Level 3: green
    0xffcc00, // Level 4: yellow
    0xff6600, // Level 5: orange-red
  ];
  const color = colors[Math.min(Math.max(level - 1, 0), 4)];

  const geometry = new THREE.BoxGeometry(0.4, 0.3, 0.4);
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.6,
    transparent: true,
    opacity: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.userData.type = 'airbag';
  mesh.userData.level = level;
  return mesh;
}

export function createStrapMesh(
  fromPos: [number, number, number],
  toPos: [number, number, number],
  type: string
): THREE.Line {
  /**
   * Create strap visualization (line between two points)
   * Steel = silver, Nonmetallic = tan
   */
  const color = type.includes('steel') ? 0xcccccc : 0xd2b48c;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array([fromPos[0], fromPos[1], fromPos[2], toPos[0], toPos[1], toPos[2]]),
      3
    )
  );

  const material = new THREE.LineBasicMaterial({
    color,
    linewidth: 3,
    transparent: true,
    opacity: 0.8,
  });
  const line = new THREE.Line(geometry, material);
  line.userData.type = 'strap';
  return line;
}

export function createRiserMesh(position: [number, number, number], size: number = 0.3): THREE.Mesh {
  /**
   * Create riser/pad visualization (small tan box)
   */
  const geometry = new THREE.BoxGeometry(size, 0.05, size);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b7355, // Saddle brown
    metalness: 0.1,
    roughness: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.userData.type = 'riser';
  return mesh;
}

export function createRubberMatMesh(position: [number, number, number], width: number = 0.5): THREE.Mesh {
  /**
   * Create rubber mat visualization (thin black rectangle)
   */
  const geometry = new THREE.BoxGeometry(width, 0.02, 0.3);
  const material = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, // Black
    metalness: 0,
    roughness: 0.8,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.userData.type = 'rubber_mat';
  return mesh;
}

export function createSecurementGroup(securements: Securement[]): THREE.Group {
  /**
   * Create a group containing all securement visualizations
   */
  const group = new THREE.Group();

  securements.forEach(sec => {
    let mesh: THREE.Object3D | null = null;

    if (sec.type.startsWith('airbag')) {
      const levelMatch = sec.type.match(/level_(\d+)/);
      const level = levelMatch ? parseInt(levelMatch[1]) : 2;
      mesh = createAirbagMesh(sec.position, level);
    } else if (sec.type.includes('strap')) {
      // For straps, create a visual line from position to position + 0.5m upward
      const toPos: [number, number, number] = [
        sec.position[0],
        sec.position[1] + 0.5,
        sec.position[2],
      ];
      mesh = createStrapMesh(sec.position, toPos, sec.type);
    } else if (sec.type === 'riser') {
      mesh = createRiserMesh(sec.position);
    } else if (sec.type === 'rubber_mat') {
      mesh = createRubberMatMesh(sec.position);
    }

    if (mesh) {
      mesh.userData.securementId = sec.id;
      mesh.userData.loadId = sec.load_id;
      group.add(mesh);
    }
  });

  group.userData.type = 'securements';
  return group;
}

export function updateSecurementGroup(
  group: THREE.Group,
  securements: Securement[]
): THREE.Group {
  /**
   * Update securement group (remove old, add new)
   */
  // Remove all children
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  }

  // Add new securements
  securements.forEach(sec => {
    let mesh: THREE.Object3D | null = null;

    if (sec.type.startsWith('airbag')) {
      const levelMatch = sec.type.match(/level_(\d+)/);
      const level = levelMatch ? parseInt(levelMatch[1]) : 2;
      mesh = createAirbagMesh(sec.position, level);
    } else if (sec.type.includes('strap')) {
      const toPos: [number, number, number] = [
        sec.position[0],
        sec.position[1] + 0.5,
        sec.position[2],
      ];
      mesh = createStrapMesh(sec.position, toPos, sec.type);
    } else if (sec.type === 'riser') {
      mesh = createRiserMesh(sec.position);
    } else if (sec.type === 'rubber_mat') {
      mesh = createRubberMatMesh(sec.position);
    }

    if (mesh) {
      mesh.userData.securementId = sec.id;
      mesh.userData.loadId = sec.load_id;
      group.add(mesh);
    }
  });

  return group;
}
