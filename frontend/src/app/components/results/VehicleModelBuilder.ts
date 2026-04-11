/**
 * VehicleModelBuilder.ts
 * 
 * Procedural 3D vehicle models with realistic detail.
 * Each vehicle type is built as a proper container structure with:
 * - Chassis, deck, walls, roof, doors, bogies, couplers, handrails
 * - Industrial details: rivets, seams, placards, markings
 * - Proper proportions (1 unit = 1 meter)
 * - PBR materials for realistic appearance
 * - Cutaway support for enclosed vehicles (boxcar/reefer)
 */

import * as THREE from 'three';

// ── Material factories ──────────────────────────────────────────────────────

/** Standard steel material for vehicle body */
function steelMaterial(color = '#4a5568'): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.5 });
}

/** Dark steel for underframe/chassis */
function darkSteelMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#1a202c', roughness: 0.7, metalness: 0.8 });
}

/** Wood material for deck */
function woodMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#8b6f47', roughness: 0.9, metalness: 0.05 });
}

/** Wheel steel */
function wheelMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#2d3748', roughness: 0.4, metalness: 0.9 });
}

// ── Bogie (wheel truck) builder ─────────────────────────────────────────────

/**
 * Creates a realistic bogie (wheel truck) assembly.
 * Railcars have two bogies, one near each end.
 */
export function createBogie(): THREE.Group {
  const group = new THREE.Group();

  // Side frames
  const frameGeo = new THREE.BoxGeometry(1.8, 0.35, 0.25);
  const frameMat = darkSteelMaterial();

  const leftFrame = new THREE.Mesh(frameGeo, frameMat);
  leftFrame.position.set(0, -0.15, -0.55);
  leftFrame.castShadow = true;
  group.add(leftFrame);

  const rightFrame = new THREE.Mesh(frameGeo, frameMat);
  rightFrame.position.set(0, -0.15, 0.55);
  rightFrame.castShadow = true;
  group.add(rightFrame);

  // Bolster (cross member)
  const bolsterGeo = new THREE.BoxGeometry(0.3, 0.25, 1.4);
  const bolster = new THREE.Mesh(bolsterGeo, frameMat);
  bolster.position.set(0, -0.1, 0);
  bolster.castShadow = true;
  group.add(bolster);

  // Wheels (4 per bogie)
  const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.14, 24);
  const wheelMat = wheelMaterial();

  const wheelPositions = [
    [-0.65, -0.33, -0.65], [-0.65, -0.33, 0.65],
    [0.65, -0.33, -0.65], [0.65, -0.33, 0.65],
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);

    // Wheel flange (thin ring at inner edge)
    const flangeGeo = new THREE.TorusGeometry(0.33, 0.02, 8, 24);
    const flange = new THREE.Mesh(flangeGeo, wheelMat);
    flange.position.set(x, y, z > 0 ? z - 0.08 : z + 0.08);
    group.add(flange);
  });

  // Axles
  const axleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 12);
  const axleMat = darkSteelMaterial();
  [-0.65, 0.65].forEach(x => {
    const axle = new THREE.Mesh(axleGeo, axleMat);
    axle.rotation.x = Math.PI / 2;
    axle.position.set(x, -0.33, 0);
    group.add(axle);
  });

  // Spring assemblies (coil springs between frame and bolster)
  const springGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12);
  const springMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.5, metalness: 0.7 });
  [[-0.65, -0.55], [-0.65, 0.55], [0.65, -0.55], [0.65, 0.55]].forEach(([x, z]) => {
    const spring = new THREE.Mesh(springGeo, springMat);
    spring.position.set(x, -0.05, z);
    group.add(spring);
  });

  return group;
}

// ── Coupler builder ─────────────────────────────────────────────────────────

/** Creates a knuckle coupler at the end of the vehicle */
function createCoupler(): THREE.Group {
  const group = new THREE.Group();

  // Coupler body
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.2, 0.15);
  const body = new THREE.Mesh(bodyGeo, darkSteelMaterial());
  body.position.set(0.25, -0.15, 0);
  group.add(body);

  // Knuckle
  const knuckleGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const knuckle = new THREE.Mesh(knuckleGeo, darkSteelMaterial());
  knuckle.position.set(0.55, -0.15, 0);
  knuckle.scale.set(1.5, 1, 1);
  group.add(knuckle);

  return group;
}

// ── Handrail builder ────────────────────────────────────────────────────────

/** Creates handrails along the side of the vehicle */
function createHandrails(length: number, platH: number, wallH: number, side: 'left' | 'right'): THREE.Group {
  const group = new THREE.Group();
  const zOff = side === 'left' ? 0.15 : -0.15;
  const railMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.4, metalness: 0.8 });

  // Top rail
  const topGeo = new THREE.CylinderGeometry(0.02, 0.02, length, 8);
  const topRail = new THREE.Mesh(topGeo, railMat);
  topRail.rotation.z = Math.PI / 2;
  topRail.position.set(length / 2, wallH + 0.1, zOff);
  group.add(topRail);

  // Vertical stanchions
  const stanchionGeo = new THREE.CylinderGeometry(0.015, 0.015, wallH + 0.1, 8);
  for (let i = 0; i <= 6; i++) {
    const stanchion = new THREE.Mesh(stanchionGeo, railMat);
    stanchion.position.set((i / 6) * length, wallH / 2, zOff);
    group.add(stanchion);
  }

  return group;
}

// ── Flatcar ─────────────────────────────────────────────────────────────────

/**
 * Creates a realistic flatcar:
 * - Underframe with center sill, cross-bearers
 * - Wooden deck planks
 * - Stake pockets along edges
 * - Handrails at ends
 * - Two bogies with wheels
 * - Couplers at both ends
 */
export function createFlatcarModel(carL: number, carW: number, platH: number): THREE.Group {
  const group = new THREE.Group();

  // ── Underframe ──
  // Center sill (main longitudinal beam)
  const sillGeo = new THREE.BoxGeometry(carL, 0.3, 0.2);
  const sill = new THREE.Mesh(sillGeo, darkSteelMaterial());
  sill.position.set(carL / 2, platH - 0.35, 0);
  sill.castShadow = true;
  group.add(sill);

  // Side sills
  const sideSillGeo = new THREE.BoxGeometry(carL, 0.2, 0.15);
  [-1, 1].forEach(side => {
    const sideSill = new THREE.Mesh(sideSillGeo, darkSteelMaterial());
    sideSill.position.set(carL / 2, platH - 0.3, side * (carW / 2 - 0.1));
    sideSill.castShadow = true;
    group.add(sideSill);
  });

  // Cross-bearers
  const crossGeo = new THREE.BoxGeometry(0.12, 0.15, carW - 0.3);
  for (let i = 0; i < Math.floor(carL / 1.5); i++) {
    const cross = new THREE.Mesh(crossGeo, darkSteelMaterial());
    cross.position.set((i + 0.5) * 1.5, platH - 0.28, 0);
    cross.castShadow = true;
    group.add(cross);
  }

  // ── Deck planks ──
  const plankW = 0.15;
  const plankH = 0.08;
  const plankMat = woodMaterial();
  for (let z = -carW / 2 + plankW / 2; z < carW / 2; z += plankW) {
    const plankGeo = new THREE.BoxGeometry(carL - 0.1, plankH, plankW - 0.01);
    const plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.set(carL / 2, platH + plankH / 2, z);
    plank.receiveShadow = true;
    plank.castShadow = true;
    group.add(plank);
  }

  // ── Stake pockets ──
  const pocketGeo = new THREE.BoxGeometry(0.1, 0.15, 0.1);
  const pocketMat = darkSteelMaterial();
  for (let x = 1; x < carL - 0.5; x += 2) {
    [-1, 1].forEach(side => {
      const pocket = new THREE.Mesh(pocketGeo, pocketMat);
      pocket.position.set(x, platH + 0.08, side * (carW / 2 - 0.05));
      group.add(pocket);
    });
  }

  // ── End platforms with handrails ──
  [-1, 1].forEach(end => {
    const x = end > 0 ? carL - 0.3 : 0.3;
    // Platform
    const platGeo = new THREE.BoxGeometry(0.6, 0.05, carW + 0.3);
    const plat = new THREE.Mesh(platGeo, woodMaterial());
    plat.position.set(x, platH + 0.03, 0);
    plat.receiveShadow = true;
    group.add(plat);

    // Handrail posts
    const postGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.0, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.4, metalness: 0.8 });
    [-1, 1].forEach(side => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, platH + 0.55, side * (carW / 2 + 0.15));
      group.add(post);
    });
  });

  // ── Bogies ──
  const bogie1 = createBogie();
  bogie1.position.set(carL * 0.15, 0, 0);
  group.add(bogie1);

  const bogie2 = createBogie();
  bogie2.position.set(carL * 0.85, 0, 0);
  group.add(bogie2);

  // ── Couplers ──
  const couplerFront = createCoupler();
  couplerFront.position.set(carL, platH - 0.55, 0);
  group.add(couplerFront);

  const couplerRear = createCoupler();
  couplerRear.rotation.y = Math.PI;
  couplerRear.position.set(0, platH - 0.55, 0);
  group.add(couplerRear);

  return group;
}

// ── Boxcar ──────────────────────────────────────────────────────────────────

/**
 * Creates a realistic boxcar:
 * - Full enclosed body with walls, roof, floor
 * - Sliding door on one side with tracks
 * - End walls with ladders
 * - Roof walkway
 * - Two bogies, couplers, handrails
 * - Industrial markings and placards
 */
export function createBoxcarModel(carL: number, carW: number, carH: number, platH: number, isDark: boolean): THREE.Group {
  const group = new THREE.Group();
  const wallH = carH - platH;
  const wallMat = steelMaterial(isDark ? '#3d4a5c' : '#5a6577');
  const roofMat = steelMaterial(isDark ? '#2d3748' : '#4a5568');
  const floorMat = woodMaterial();

  // ── Floor ──
  const floorGeo = new THREE.BoxGeometry(carL - 0.2, 0.1, carW - 0.2);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(carL / 2, platH + 0.05, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // ── Side walls ──
  const sideWallGeo = new THREE.BoxGeometry(carL - 0.2, wallH, 0.08);

  // Left wall (with door opening)
  const leftWallGroup = new THREE.Group();
  // Wall sections around door
  const doorW = carL * 0.45;
  const doorX = carL * 0.25;
  // Front section (before door)
  if (doorX > 0.1) {
    const frontGeo = new THREE.BoxGeometry(doorX, wallH, 0.08);
    const frontWall = new THREE.Mesh(frontGeo, wallMat);
    frontWall.position.set(doorX / 2, platH + wallH / 2, carW / 2);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    leftWallGroup.add(frontWall);
  }
  // Rear section (after door)
  const rearStart = doorX + doorW;
  const rearLen = carL - 0.2 - rearStart;
  if (rearLen > 0.1) {
    const rearGeo = new THREE.BoxGeometry(rearLen, wallH, 0.08);
    const rearWall = new THREE.Mesh(rearGeo, wallMat);
    rearWall.position.set(rearStart + rearLen / 2, platH + wallH / 2, carW / 2);
    rearWall.castShadow = true;
    rearWall.receiveShadow = true;
    leftWallGroup.add(rearWall);
  }
  // Top section above door
  const doorH = wallH * 0.85;
  const topGeo = new THREE.BoxGeometry(doorW, wallH - doorH, 0.08);
  const topWall = new THREE.Mesh(topGeo, wallMat);
  topWall.position.set(doorX + doorW / 2, platH + doorH + (wallH - doorH) / 2, carW / 2);
  topWall.castShadow = true;
  leftWallGroup.add(topWall);

  group.add(leftWallGroup);

  // Right wall (solid)
  const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
  rightWall.position.set(carL / 2, platH + wallH / 2, -carW / 2);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // ── End walls ──
  const endWallGeo = new THREE.BoxGeometry(0.08, wallH, carW - 0.2);
  const frontWall = new THREE.Mesh(endWallGeo, wallMat);
  frontWall.position.set(carL - 0.1, platH + wallH / 2, 0);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  group.add(frontWall);

  const backWall = new THREE.Mesh(endWallGeo, wallMat);
  backWall.position.set(0.1, platH + wallH / 2, 0);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // ── Roof ──
  const roofGeo = new THREE.BoxGeometry(carL - 0.1, 0.06, carW - 0.1);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(carL / 2, platH + wallH, 0);
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // Roof ribs (structural detail)
  const ribGeo = new THREE.BoxGeometry(carL - 0.2, 0.04, 0.04);
  const ribMat = darkSteelMaterial();
  for (let i = 1; i < 8; i++) {
    const rib = new THREE.Mesh(ribGeo, ribMat);
    rib.position.set(carL / 2, platH + wallH + 0.04, -carW / 2 + (i / 8) * carW);
    group.add(rib);
  }

  // ── Door ──
  // Door panel (sliding, shown partially open)
  const doorGeo = new THREE.BoxGeometry(doorW, doorH, 0.06);
  const doorMat = steelMaterial(isDark ? '#4a5568' : '#718096');
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(doorX + doorW * 0.7, platH + doorH / 2, carW / 2 + 0.02);
  door.castShadow = true;
  group.add(door);

  // Door tracks
  const trackGeo = new THREE.BoxGeometry(doorW + 0.5, 0.04, 0.04);
  const trackMat = darkSteelMaterial();
  const topTrack = new THREE.Mesh(trackGeo, trackMat);
  topTrack.position.set(doorX + doorW / 2, platH + wallH - 0.02, carW / 2 + 0.05);
  group.add(topTrack);

  const bottomTrack = new THREE.Mesh(trackGeo, trackMat);
  bottomTrack.position.set(doorX + doorW / 2, platH + 0.04, carW / 2 + 0.05);
  group.add(bottomTrack);

  // Door handle
  const handleGeo = new THREE.BoxGeometry(0.04, 0.4, 0.06);
  const handleMat = new THREE.MeshStandardMaterial({ color: '#f7fafc', roughness: 0.3, metalness: 0.9 });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(doorX + doorW * 0.35, platH + doorH / 2, carW / 2 + 0.08);
  group.add(handle);

  // ── Vertical ribs on walls ──
  const vRibGeo = new THREE.BoxGeometry(0.04, wallH, 0.04);
  const vRibMat = darkSteelMaterial();
  for (let i = 1; i < 12; i++) {
    const x = (i / 12) * (carL - 0.2);
    // Right wall ribs
    const rib = new THREE.Mesh(vRibGeo, vRibMat);
    rib.position.set(x, platH + wallH / 2, -carW / 2 + 0.06);
    group.add(rib);
  }

  // ── Ladder on end wall ──
  const ladderMat = new THREE.MeshStandardMaterial({ color: '#f6e05e', roughness: 0.4, metalness: 0.8 });
  const rungGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8);
  for (let i = 0; i < 6; i++) {
    const rung = new THREE.Mesh(rungGeo, ladderMat);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(carL - 0.05, platH + 0.5 + i * 0.55, 0);
    group.add(rung);
  }
  // Ladder rails
  const railGeo = new THREE.CylinderGeometry(0.012, 0.012, 3.3, 8);
  [-0.2, 0.2].forEach(z => {
    const rail = new THREE.Mesh(railGeo, ladderMat);
    rail.position.set(carL - 0.05, platH + wallH / 2, z);
    group.add(rail);
  });

  // ── Bogies ──
  const bogie1 = createBogie();
  bogie1.position.set(carL * 0.15, 0, 0);
  group.add(bogie1);

  const bogie2 = createBogie();
  bogie2.position.set(carL * 0.85, 0, 0);
  group.add(bogie2);

  // ── Couplers ──
  const couplerFront = createCoupler();
  couplerFront.position.set(carL, platH - 0.55, 0);
  group.add(couplerFront);

  const couplerRear = createCoupler();
  couplerRear.rotation.y = Math.PI;
  couplerRear.position.set(0, platH - 0.55, 0);
  group.add(couplerRear);

  // ── Handrails ──
  group.add(createHandrails(carL - 0.2, platH, wallH, 'right'));

  return group;
}

// ── Gondola ─────────────────────────────────────────────────────────────────

/**
 * Creates a realistic gondola:
 * - Open-top with high side walls
 * - Drop doors on bottom
 * - End walls with bracing
 * - Stake pockets along top edge
 * - Two bogies, couplers
 */
export function createGondolaModel(carL: number, carW: number, carH: number, platH: number, isDark: boolean): THREE.Group {
  const group = new THREE.Group();
  const wallH = Math.min(carH - platH, 2.0);
  const wallMat = steelMaterial(isDark ? '#3d4a5c' : '#5a6577');

  // ── Floor ──
  const floorGeo = new THREE.BoxGeometry(carL - 0.2, 0.08, carW - 0.2);
  const floor = new THREE.Mesh(floorGeo, darkSteelMaterial());
  floor.position.set(carL / 2, platH + 0.04, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // ── Side walls ──
  const sideGeo = new THREE.BoxGeometry(carL - 0.2, wallH, 0.06);
  [-1, 1].forEach(side => {
    const wall = new THREE.Mesh(sideGeo, wallMat);
    wall.position.set(carL / 2, platH + wallH / 2, side * (carW / 2 - 0.03));
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
  });

  // ── End walls ──
  const endGeo = new THREE.BoxGeometry(0.06, wallH, carW - 0.2);
  [0.1, carL - 0.1].forEach(x => {
    const wall = new THREE.Mesh(endGeo, wallMat);
    wall.position.set(x, platH + wallH / 2, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
  });

  // ── Vertical ribs ──
  const ribGeo = new THREE.BoxGeometry(0.03, wallH, 0.03);
  const ribMat = darkSteelMaterial();
  for (let i = 1; i < 10; i++) {
    const x = (i / 10) * (carL - 0.2);
    [-1, 1].forEach(side => {
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.position.set(x, platH + wallH / 2, side * (carW / 2 - 0.06));
      group.add(rib);
    });
  }

  // ── Top rail along walls ──
  const topRailGeo = new THREE.BoxGeometry(carL - 0.2, 0.06, 0.06);
  [-1, 1].forEach(side => {
    const rail = new THREE.Mesh(topRailGeo, darkSteelMaterial());
    rail.position.set(carL / 2, platH + wallH, side * (carW / 2 - 0.03));
    group.add(rail);
  });

  // ── Bogies ──
  const bogie1 = createBogie();
  bogie1.position.set(carL * 0.15, 0, 0);
  group.add(bogie1);

  const bogie2 = createBogie();
  bogie2.position.set(carL * 0.85, 0, 0);
  group.add(bogie2);

  // ── Couplers ──
  const couplerFront = createCoupler();
  couplerFront.position.set(carL, platH - 0.55, 0);
  group.add(couplerFront);

  const couplerRear = createCoupler();
  couplerRear.rotation.y = Math.PI;
  couplerRear.position.set(0, platH - 0.55, 0);
  group.add(couplerRear);

  return group;
}

// ── Reefer (Refrigerated Boxcar) ────────────────────────────────────────────

/**
 * Creates a realistic reefer:
 * - Fully insulated enclosed body
 * - Refrigeration unit on front end
 * - Sealed doors (no sliding door)
 * - Vents on sides
 * - Smooth white/light exterior
 * - Two bogies, couplers
 */
export function createReeferModel(carL: number, carW: number, carH: number, platH: number, isDark: boolean): THREE.Group {
  const group = new THREE.Group();
  const wallH = carH - platH;
  const wallMat = new THREE.MeshStandardMaterial({
    color: isDark ? '#e2e8f0' : '#f8fafc',
    roughness: 0.3,
    metalness: 0.1,
  });

  // ── Floor ──
  const floorGeo = new THREE.BoxGeometry(carL - 0.2, 0.12, carW - 0.2);
  const floor = new THREE.Mesh(floorGeo, darkSteelMaterial());
  floor.position.set(carL / 2, platH + 0.06, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // ── Walls (all four sides, fully enclosed) ──
  const sideGeo = new THREE.BoxGeometry(carL - 0.2, wallH, 0.1);
  [-1, 1].forEach(side => {
    const wall = new THREE.Mesh(sideGeo, wallMat);
    wall.position.set(carL / 2, platH + wallH / 2, side * (carW / 2 - 0.05));
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
  });

  const endGeo = new THREE.BoxGeometry(0.1, wallH, carW - 0.2);
  [0.1, carL - 0.1].forEach(x => {
    const wall = new THREE.Mesh(endGeo, wallMat);
    wall.position.set(x, platH + wallH / 2, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
  });

  // ── Roof ──
  const roofGeo = new THREE.BoxGeometry(carL - 0.1, 0.08, carW - 0.1);
  const roofMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.4, metalness: 0.2 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(carL / 2, platH + wallH, 0);
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // ── Doors (double doors on one end) ──
  const doorW = carW * 0.7;
  const doorH = wallH * 0.85;
  const doorMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.4, metalness: 0.3 });
  [-1, 1].forEach(side => {
    const doorGeo = new THREE.BoxGeometry(0.06, doorH, doorW / 2);
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(carL - 0.08, platH + doorH / 2, side * doorW / 4);
    door.castShadow = true;
    group.add(door);

    // Door hinges
    const hingeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
    const hingeMat = darkSteelMaterial();
    [0.2, 0.5, 0.8].forEach(h => {
      const hinge = new THREE.Mesh(hingeGeo, hingeMat);
      hinge.rotation.x = Math.PI / 2;
      hinge.position.set(carL - 0.05, platH + doorH * h, side * doorW / 2);
      group.add(hinge);
    });
  });

  // ── Refrigeration unit (front end) ──
  const reeferUnitGeo = new THREE.BoxGeometry(0.6, 1.2, carW * 0.5);
  const reeferMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.5, metalness: 0.7 });
  const reeferUnit = new THREE.Mesh(reeferUnitGeo, reeferMat);
  reeferUnit.position.set(0.3, platH + 1.2, 0);
  reeferUnit.castShadow = true;
  group.add(reeferUnit);

  // Cooling fins on reefer unit
  const finGeo = new THREE.BoxGeometry(0.02, 0.8, carW * 0.4);
  for (let i = 0; i < 6; i++) {
    const fin = new THREE.Mesh(finGeo, reeferMat);
    fin.position.set(0.05 + i * 0.06, platH + 1.4, 0);
    group.add(fin);
  }

  // Vent grilles
  const ventGeo = new THREE.PlaneGeometry(0.4, 0.25);
  const ventMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.8, metalness: 0.4 });
  const vent = new THREE.Mesh(ventGeo, ventMat);
  vent.position.set(0.62, platH + 1.2, carW / 2 + 0.01);
  vent.rotation.y = Math.PI / 2;
  group.add(vent);

  // ── Bogies ──
  const bogie1 = createBogie();
  bogie1.position.set(carL * 0.15, 0, 0);
  group.add(bogie1);

  const bogie2 = createBogie();
  bogie2.position.set(carL * 0.85, 0, 0);
  group.add(bogie2);

  // ── Couplers ──
  const couplerFront = createCoupler();
  couplerFront.position.set(carL, platH - 0.55, 0);
  group.add(couplerFront);

  const couplerRear = createCoupler();
  couplerRear.rotation.y = Math.PI;
  couplerRear.position.set(0, platH - 0.55, 0);
  group.add(couplerRear);

  return group;
}
