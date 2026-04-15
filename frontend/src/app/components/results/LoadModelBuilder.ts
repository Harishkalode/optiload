/**
 * LoadModelBuilder.ts
 * 
 * Procedural 3D load models that look like real products.
 * Each load type has realistic geometry, materials, and details:
 * - Paper Roll: Kraft paper cylinder with end caps, banding, label
 * - Pallet: Wooden base + stacked cartons + shrink wrap + straps
 * - Coil: Steel coil with protective wrapping, banding straps
 * - Carton: Corrugated box with tape, shipping labels, handling marks
 * - Drum: Metal barrel with chime rings, bung caps, hazard labels
 * - Bag: Flexible sack with tie-off top
 * - Pipe/Tube: Hollow cylinder with end caps, bundle straps
 * - Lumber: Stacked boards with banding, wood grain
 * 
 * All models use the load's actual dimensions (w, h, d) for proper scaling.
 * 1 unit = 1 meter.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ── Material factories ──────────────────────────────────────────────────────

/** Kraft paper material for rolls and bags */
function kraftMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#b8936b', roughness: 0.85, metalness: 0.0 });
}

/** Corrugated cardboard material */
function cardboardMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#c4a882', roughness: 0.9, metalness: 0.0 });
}

/** Steel material for coils, drums, pipes */
function steelMaterial(color = '#718096'): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.8 });
}

/** Wood material for pallets, lumber */
function woodMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#8b6f47', roughness: 0.9, metalness: 0.05 });
}

/** Plastic wrap material (transparent) */
function plasticWrapMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff', transparent: true, opacity: 0.12,
    roughness: 0.1, metalness: 0.0, transmission: 0.3,
  });
}

/** Dark steel for chimes, straps */
function darkSteelMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#1a202c', roughness: 0.7, metalness: 0.8 });
}

/** Banding strap material */
function strapMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.6, metalness: 0.4 });
}

// ── Paper Roll ──────────────────────────────────────────────────────────────

/**
 * Realistic paper roll:
 * - Main kraft paper cylinder
 * - End caps with paper texture
 * - Plastic shrink wrap overlay
 * - Steel banding straps
 * - Product label sticker
 * - Edge chamfer rings
 */
export function createPaperRollModel(w: number, h: number, d: number, color: string): THREE.Group {
  const group = new THREE.Group();
  // For a paper roll: w=d=diameter, h=length (lying on its side)
  const radius = w / 2;
  const length = h;

  // Main cylinder (kraft paper)
  const cylGeo = new THREE.CylinderGeometry(radius, radius, length, 32);
  const cyl = new THREE.Mesh(cylGeo, kraftMaterial());
  cyl.rotation.x = Math.PI / 2;
  cyl.castShadow = true;
  cyl.receiveShadow = true;
  group.add(cyl);

  // End caps (lighter paper)
  const capGeo = new THREE.CircleGeometry(radius * 0.95, 32);
  const capMat = new THREE.MeshStandardMaterial({ color: '#d4c5a9', roughness: 0.9 });
  [1, -1].forEach(dir => {
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.z = dir * length / 2;
    if (dir < 0) cap.rotation.y = Math.PI;
    group.add(cap);
  });

  // Plastic wrap (slightly larger, transparent)
  const wrapGeo = new THREE.CylinderGeometry(radius + 0.01, radius + 0.01, length * 0.85, 32);
  const wrap = new THREE.Mesh(wrapGeo, plasticWrapMaterial());
  wrap.rotation.x = Math.PI / 2;
  group.add(wrap);

  // Steel banding straps (2-3 around circumference)
  const bandGeo = new THREE.TorusGeometry(radius + 0.015, 0.012, 8, 32);
  const bandMat = strapMaterial();
  [-0.25, 0, 0.25].forEach(pos => {
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.z = pos * length;
    group.add(band);
  });

  // Product label on top
  const labelGeo = new THREE.PlaneGeometry(radius * 0.5, radius * 0.25);
  const labelMat = new THREE.MeshStandardMaterial({ color: '#f7fafc', roughness: 0.4 });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, radius + 0.02, 0);
  label.rotation.x = -Math.PI / 2;
  group.add(label);

  // Edge rings (darker paper at edges)
  const edgeGeo = new THREE.TorusGeometry(radius, 0.015, 8, 32);
  const edgeMat = new THREE.MeshStandardMaterial({ color: '#8b7355', roughness: 0.9 });
  [1, -1].forEach(dir => {
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.z = dir * (length / 2 - 0.03);
    group.add(edge);
  });

  return group;
}

// ── Pallet ──────────────────────────────────────────────────────────────────

/**
 * Realistic pallet:
 * - Wooden pallet base with slats and blocks
 * - Stacked cartons on top
 * - Clear shrink wrap around entire load
 * - Black plastic straps
 * - Corner protectors
 */
export function createPalletModel(w: number, h: number, d: number, color: string): THREE.Group {
  const group = new THREE.Group();
  const palletH = 0.15;
  const goodsH = h - palletH;

  // ── Pallet base ──
  // Top deck slats
  const slatMat = woodMaterial();
  for (let i = 0; i < 5; i++) {
    const z = (i - 2) * (d / 5);
    const slatGeo = new THREE.BoxGeometry(w, palletH * 0.6, d / 6);
    const slat = new THREE.Mesh(slatGeo, slatMat);
    slat.position.set(0, -h / 2 + palletH * 0.3, z);
    slat.castShadow = true;
    slat.receiveShadow = true;
    group.add(slat);
  }

  // Bottom deck slats
  for (let i = 0; i < 3; i++) {
    const z = (i - 1) * (d / 3);
    const slatGeo = new THREE.BoxGeometry(w, palletH * 0.4, d / 8);
    const slat = new THREE.Mesh(slatGeo, slatMat);
    slat.position.set(0, -h / 2 + palletH * 0.8, z);
    slat.castShadow = true;
    group.add(slat);
  }

  // Support blocks
  const blockGeo = new THREE.BoxGeometry(w / 4, palletH * 0.5, d / 6);
  for (let xi = 0; xi < 3; xi++) {
    for (let zi = 0; zi < 3; zi++) {
      const block = new THREE.Mesh(blockGeo, slatMat);
      block.position.set((xi - 1) * (w / 3), -h / 2 + palletH * 0.55, (zi - 1) * (d / 3));
      block.castShadow = true;
      group.add(block);
    }
  }

  // ── Goods on pallet ──
  const goodsGeo = new THREE.BoxGeometry(w * 0.92, goodsH * 0.95, d * 0.92);
  const goodsMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
  const goods = new THREE.Mesh(goodsGeo, goodsMat);
  goods.position.y = palletH / 2;
  goods.castShadow = true;
  goods.receiveShadow = true;
  group.add(goods);

  // ── Shrink wrap ──
  const wrapGeo = new THREE.BoxGeometry(w * 0.96, goodsH + 0.05, d * 0.96);
  const wrap = new THREE.Mesh(wrapGeo, plasticWrapMaterial());
  wrap.position.y = palletH / 2;
  group.add(wrap);

  // ── Straps ──
  const strapGeo1 = new THREE.BoxGeometry(w * 0.96, 0.02, 0.04);
  const strapMat = strapMaterial();
  [-0.25, 0.25].forEach(zOff => {
    const strap = new THREE.Mesh(strapGeo1, strapMat);
    strap.position.set(0, goodsH * 0.4, zOff);
    group.add(strap);
  });

  const strapGeo2 = new THREE.BoxGeometry(0.04, 0.02, d * 0.96);
  [-0.25, 0.25].forEach(xOff => {
    const strap = new THREE.Mesh(strapGeo2, strapMat);
    strap.position.set(xOff, goodsH * 0.4, 0);
    group.add(strap);
  });

  // ── Corner protectors ──
  const cornerGeo = new THREE.BoxGeometry(0.03, goodsH * 0.9, 0.03);
  const cornerMat = new THREE.MeshStandardMaterial({ color: '#a0a0a0', roughness: 0.5, metalness: 0.3 });
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
    const corner = new THREE.Mesh(cornerGeo, cornerMat);
    corner.position.set(sx * w * 0.46, palletH / 2, sz * d * 0.46);
    group.add(corner);
  });

  return group;
}

// ── Steel Coil ──────────────────────────────────────────────────────────────

/**
 * Realistic steel coil:
 * - Main steel cylinder (coiled sheet)
 * - Inner core (cardboard/steel tube)
 * - Protective wrapping (blue/green)
 * - Steel banding straps
 * - Edge protectors
 * - Identification tag
 */
export function createCoilModel(w: number, h: number, d: number, color: string): THREE.Group {
  const group = new THREE.Group();
  const radius = w / 2;
  const length = h;

  // Main coil body (steel)
  const coilGeo = new THREE.CylinderGeometry(radius, radius, length, 32);
  const coilMat = steelMaterial('#6b7b8d');
  const coil = new THREE.Mesh(coilGeo, coilMat);
  coil.rotation.x = Math.PI / 2;
  coil.castShadow = true;
  coil.receiveShadow = true;
  group.add(coil);

  // Visible coil lines (concentric rings to show it's coiled)
  for (let i = 1; i <= 4; i++) {
    const r = radius * (i / 5);
    const ringGeo = new THREE.TorusGeometry(r, 0.005, 8, 48);
    const ringMat = new THREE.MeshStandardMaterial({ color: '#4a5568', roughness: 0.5, metalness: 0.9 });
    [1, -1].forEach(dir => {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = dir * length / 2;
      group.add(ring);
    });
  }

  // Inner core (hollow)
  const coreGeo = new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, length + 0.02, 24);
  const coreMat = new THREE.MeshStandardMaterial({ color: '#8b6f47', roughness: 0.9 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.rotation.x = Math.PI / 2;
  group.add(core);

  // Protective wrapping (colored plastic)
  const wrapGeo = new THREE.CylinderGeometry(radius + 0.02, radius + 0.02, length * 0.9, 32);
  const wrapMat = new THREE.MeshPhysicalMaterial({
    color: '#2563eb', transparent: true, opacity: 0.25,
    roughness: 0.2, metalness: 0.1,
  });
  const wrap = new THREE.Mesh(wrapGeo, wrapMat);
  wrap.rotation.x = Math.PI / 2;
  group.add(wrap);

  // Steel banding straps
  const bandGeo = new THREE.TorusGeometry(radius + 0.02, 0.015, 8, 32);
  const bandMat = strapMaterial();
  [-0.3, 0, 0.3].forEach(pos => {
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.z = pos * length;
    group.add(band);
  });

  // Edge protectors (cardboard rings)
  const edgeGeo = new THREE.TorusGeometry(radius + 0.01, 0.03, 8, 32);
  const edgeMat = new THREE.MeshStandardMaterial({ color: '#a08060', roughness: 0.9 });
  [1, -1].forEach(dir => {
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.z = dir * (length / 2 + 0.01);
    group.add(edge);
  });

  return group;
}

// ── Carton / Box ────────────────────────────────────────────────────────────

/**
 * Realistic corrugated carton:
 * - Brown cardboard box
 * - Packing tape along seams
 * - Shipping label
 * - Handling marks (fragile, this-side-up)
 * - Edge lines showing corrugation
 */
export function createCartonModel(w: number, h: number, d: number, color: string): THREE.Group {
  const group = new THREE.Group();

  // Main box
  const boxGeo = new THREE.BoxGeometry(w, h, d);
  const boxMat = cardboardMaterial();
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  // Edge lines (corrugation detail)
  const edges = new THREE.EdgesGeometry(boxGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: '#8b7355', linewidth: 1 });
  const edgeLines = new THREE.LineSegments(edges, edgeMat);
  group.add(edgeLines);

  // Packing tape (top seam)
  const tapeGeo = new THREE.PlaneGeometry(w * 0.9, 0.06);
  const tapeMat = new THREE.MeshStandardMaterial({ color: '#d4c5a9', roughness: 0.5, transparent: true, opacity: 0.7 });
  const tape = new THREE.Mesh(tapeGeo, tapeMat);
  tape.position.set(0, h / 2 + 0.001, 0);
  tape.rotation.x = -Math.PI / 2;
  group.add(tape);

  // Bottom tape
  const tape2 = new THREE.Mesh(tapeGeo, tapeMat);
  tape2.position.set(0, -h / 2 - 0.001, 0);
  tape2.rotation.x = Math.PI / 2;
  group.add(tape2);

  // Shipping label (front face)
  const labelGeo = new THREE.PlaneGeometry(w * 0.35, h * 0.2);
  const labelMat = new THREE.MeshStandardMaterial({ color: '#f7fafc', roughness: 0.4 });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, h * 0.15, d / 2 + 0.001);
  group.add(label);

  // Barcode lines on label
  const barcodeMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9 });
  for (let i = 0; i < 12; i++) {
    const bw = 0.01 + Math.random() * 0.02;
    const barGeo = new THREE.PlaneGeometry(bw, h * 0.1);
    const bar = new THREE.Mesh(barGeo, barcodeMat);
    bar.position.set(-w * 0.12 + i * 0.025, h * 0.15, d / 2 + 0.002);
    group.add(bar);
  }

  // "Fragile" marking (red rectangle)
  const fragileGeo = new THREE.PlaneGeometry(w * 0.2, h * 0.08);
  const fragileMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.6 });
  const fragile = new THREE.Mesh(fragileGeo, fragileMat);
  fragile.position.set(0, -h * 0.25, d / 2 + 0.001);
  group.add(fragile);

  return group;
}

// ── Drum / Barrel ───────────────────────────────────────────────────────────

/**
 * Realistic metal drum:
 * - Cylindrical steel body
 * - Top and bottom chime rings
 * - Bung caps (fill/vent holes)
 * - Horizontal rolling ribs
 * - Hazard label
 * - Paint color
 */
export function createDrumModel(w: number, h: number, d: number, color: string): THREE.Group {
  const group = new THREE.Group();
  const radius = w / 2;
  const height = h;

  // Main drum body
  const bodyGeo = new THREE.CylinderGeometry(radius, radius, height, 32);
  const bodyMat = steelMaterial(color);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Chime rings (top and bottom edges)
  const chimeGeo = new THREE.TorusGeometry(radius, 0.02, 8, 32);
  const chimeMat = darkSteelMaterial();
  [1, -1].forEach(dir => {
    const chime = new THREE.Mesh(chimeGeo, chimeMat);
    chime.position.y = dir * height / 2;
    chime.rotation.x = Math.PI / 2;
    group.add(chime);
  });

  // Rolling ribs (horizontal ridges)
  const ribGeo = new THREE.TorusGeometry(radius + 0.005, 0.01, 8, 32);
  const ribMat = darkSteelMaterial();
  [-0.25, 0, 0.25].forEach(pos => {
    const rib = new THREE.Mesh(ribGeo, ribMat);
    rib.position.y = pos * height;
    rib.rotation.x = Math.PI / 2;
    group.add(rib);
  });

  // Bung caps (fill holes on top)
  const bungGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
  const bungMat = darkSteelMaterial();
  [0.15, -0.15].forEach(xOff => {
    const bung = new THREE.Mesh(bungGeo, bungMat);
    bung.position.set(xOff, height / 2 + 0.01, 0);
    group.add(bung);
  });

  // Hazard label
  const labelGeo = new THREE.PlaneGeometry(radius * 0.6, radius * 0.5);
  const labelMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.5 });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, 0, radius + 0.001);
  group.add(label);

  return group;
}

// ── Bag / Sack ──────────────────────────────────────────────────────────────

/**
 * Realistic flexible bag:
 * - Bulging sack shape (wider in middle)
 * - Tie-off at top
 * - Wrinkle details
 * - Printed label
 */
export function createBagModel(w: number, h: number, d: number, color: string): THREE.Group {
  const group = new THREE.Group();

  // Main bag body (slightly bulging)
  const bagGeo = new THREE.SphereGeometry(1, 24, 24);
  bagGeo.scale(w / 2, h / 2, d / 2);
  // Squash it to look more like a filled bag
  const positions = bagGeo.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const bulge = 1 + 0.15 * Math.cos((y + 1) * Math.PI);
    positions.setX(i, positions.getX(i) * bulge);
    positions.setZ(i, positions.getZ(i) * bulge);
  }
  bagGeo.computeVertexNormals();

  const bagMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.0 });
  const bag = new THREE.Mesh(bagGeo, bagMat);
  bag.castShadow = true;
  bag.receiveShadow = true;
  group.add(bag);

  // Tie-off at top
  const tieGeo = new THREE.CylinderGeometry(0.03, 0.06, 0.15, 12);
  const tieMat = new THREE.MeshStandardMaterial({ color: '#8b6f47', roughness: 0.9 });
  const tie = new THREE.Mesh(tieGeo, tieMat);
  tie.position.y = h / 2 + 0.05;
  group.add(tie);

  // Label
  const labelGeo = new THREE.PlaneGeometry(w * 0.3, h * 0.2);
  const labelMat = new THREE.MeshStandardMaterial({ color: '#f7fafc', roughness: 0.5 });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, 0, d / 2 + 0.001);
  group.add(label);

  return group;
}

// ── Pipe / Tube Bundle ──────────────────────────────────────────────────────

/**
 * Realistic pipe bundle:
 * - Multiple parallel cylinders
 * - End caps showing hollow centers
 * - Bundle straps
 * - Protective end covers
 */
export function createPipeModel(w: number, h: number, d: number, color: string): THREE.Group {
  const group = new THREE.Group();
  const pipeRadius = Math.min(w, d) / 4;
  const length = h;
  const pipeMat = steelMaterial(color);

  // Arrange pipes in a hexagonal bundle
  const pipePositions = [
    [0, 0], [pipeRadius * 2, 0], [-pipeRadius * 2, 0],
    [pipeRadius, pipeRadius * 1.7], [-pipeRadius, pipeRadius * 1.7],
    [pipeRadius, -pipeRadius * 1.7], [-pipeRadius, -pipeRadius * 1.7],
  ];

  pipePositions.forEach(([x, z]) => {
    const pipeGeo = new THREE.CylinderGeometry(pipeRadius * 0.9, pipeRadius * 0.9, length, 16);
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, 0, z);
    pipe.castShadow = true;
    group.add(pipe);

    // Hollow center
    const hollowGeo = new THREE.CylinderGeometry(pipeRadius * 0.6, pipeRadius * 0.6, length + 0.01, 16);
    const hollowMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9 });
    const hollow = new THREE.Mesh(hollowGeo, hollowMat);
    hollow.rotation.x = Math.PI / 2;
    hollow.position.set(x, 0, z);
    group.add(hollow);
  });

  // Bundle straps
  const strapGeo = new THREE.BoxGeometry(w + 0.1, 0.02, d + 0.1);
  const strapMat = strapMaterial();
  [-0.3, 0.3].forEach(pos => {
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.y = pos * length;
    group.add(strap);
  });

  return group;
}

// ── Lumber Stack ────────────────────────────────────────────────────────────

/**
 * Realistic lumber stack:
 * - Individual boards stacked with spacers
 * - Wood grain texture
 * - Banding straps
 * - End treatment marks
 */
export function createLumberModel(w: number, h: number, d: number, color: string): THREE.Group {
  const group = new THREE.Group();
  const boardH = h / 8;
  const boardMat = woodMaterial();

  for (let i = 0; i < 8; i++) {
    const boardGeo = new THREE.BoxGeometry(w, boardH * 0.85, d);
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = -h / 2 + i * boardH + boardH / 2;
    board.castShadow = true;
    board.receiveShadow = true;
    group.add(board);

    // Spacer between boards
    if (i < 7) {
      const spacerGeo = new THREE.BoxGeometry(w * 0.3, boardH * 0.15, d * 0.1);
      const spacer = new THREE.Mesh(spacerGeo, boardMat);
      spacer.position.set(0, -h / 2 + (i + 0.5) * boardH, d / 2 - 0.05);
      group.add(spacer);
    }
  }

  // Banding straps
  const strapGeo = new THREE.BoxGeometry(0.03, h + 0.05, 0.03);
  const strapMat = strapMaterial();
  [-0.3, 0, 0.3].forEach(pos => {
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(pos * w, 0, d / 2);
    group.add(strap);
  });

  return group;
}

// ── Generic Box (fallback) ──────────────────────────────────────────────────

/**
 * Generic box with industrial detail:
 * - Colored box with edge lines
 * - Handling marks
 * - Simple but professional look
 */
export function createGenericBoxModel(w: number, h: number, d: number, color: string): THREE.Group {
  const group = new THREE.Group();

  const boxGeo = new THREE.BoxGeometry(w, h, d);
  const boxMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.2 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  // Edge lines
  const edges = new THREE.EdgesGeometry(boxGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: '#64748b', linewidth: 1 });
  group.add(new THREE.LineSegments(edges, edgeMat));

  return group;
}

// ── Load Model Factory ──────────────────────────────────────────────────────

/** Load type mapping to model builder */
const LOAD_MODEL_MAP: Record<string, (w: number, h: number, d: number, color: string) => THREE.Group> = {
  cube: createGenericBoxModel,
  cuboid: createGenericBoxModel,
  irregular: createGenericBoxModel,
  cylinder: createPaperRollModel,
  paper_roll: createPaperRollModel,
  pallet: createPalletModel,
  coil: createCoilModel,
  carton: createCartonModel,
  drum: createDrumModel,
  bag: createBagModel,
  pipe: createPipeModel,
  lumber: createLumberModel,
};

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

export interface LoadVisualSpec {
  materialType?: string;
  textureUrl?: string;
  modelUrl?: string;
  orientation?: { x?: number; y?: number; z?: number };
}

function fitGroupToDimensions(group: THREE.Group, w: number, h: number, d: number): void {
  const bbox = new THREE.Box3().setFromObject(group);
  const size = bbox.getSize(new THREE.Vector3());
  if (size.x <= 0 || size.y <= 0 || size.z <= 0) return;
  const scale = new THREE.Vector3(w / size.x, h / size.y, d / size.z);
  group.scale.set(scale.x, scale.y, scale.z);
  const aligned = new THREE.Box3().setFromObject(group);
  const min = aligned.min;
  const max = aligned.max;
  const centerX = (min.x + max.x) / 2;
  const centerZ = (min.z + max.z) / 2;
  group.position.set(-centerX, -min.y, -centerZ);
}

function applyMaterialHints(group: THREE.Group, spec: LoadVisualSpec, color: string) {
  let texture: THREE.Texture | null = null;
  if (spec.textureUrl) {
    texture = textureLoader.load(spec.textureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  const materialHints: Record<string, { roughness: number; metalness: number }> = {
    steel: { roughness: 0.35, metalness: 0.82 },
    wood: { roughness: 0.88, metalness: 0.05 },
    paper: { roughness: 0.9, metalness: 0.0 },
    plastic: { roughness: 0.45, metalness: 0.1 },
    mixed: { roughness: 0.65, metalness: 0.2 },
  };
  const hint = materialHints[spec.materialType || 'mixed'] ?? materialHints.mixed;
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mat = child.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
          m.color = new THREE.Color(color);
          m.roughness = hint.roughness;
          m.metalness = hint.metalness;
          if (texture) m.map = texture;
          m.needsUpdate = true;
        }
      });
    } else if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      mat.color = new THREE.Color(color);
      mat.roughness = hint.roughness;
      mat.metalness = hint.metalness;
      if (texture) mat.map = texture;
      mat.needsUpdate = true;
    }
  });
}

/**
 * Creates a realistic 3D model for a load based on its type.
 * Falls back to generic box if type is not recognized.
 * 
 * @param loadType - Type identifier (paper_roll, pallet, coil, carton, etc.)
 * @param w - Width in meters
 * @param h - Height in meters
 * @param d - Depth in meters
 * @param color - Base color hex string
 * @returns THREE.Group containing the load model
 */
export function createLoadModel(loadType: string, w: number, h: number, d: number, color: string): THREE.Group {
  const builder = LOAD_MODEL_MAP[loadType.toLowerCase()] || createGenericBoxModel;
  return builder(w, h, d, color);
}

export async function createLoadModelAsync(
  loadType: string,
  w: number,
  h: number,
  d: number,
  color: string,
  visual: LoadVisualSpec = {},
): Promise<THREE.Group> {
  if (visual.modelUrl) {
    try {
      const gltf = await gltfLoader.loadAsync(visual.modelUrl);
      const group = new THREE.Group();
      const root = gltf.scene;
      group.add(root);
      fitGroupToDimensions(group, w, h, d);
      applyMaterialHints(group, visual, color);
      if (visual.orientation) {
        group.rotation.set(
          THREE.MathUtils.degToRad(visual.orientation.x ?? 0),
          THREE.MathUtils.degToRad(visual.orientation.y ?? 0),
          THREE.MathUtils.degToRad(visual.orientation.z ?? 0),
        );
      }
      return group;
    } catch (err) {
      console.warn('[LoadModelBuilder] GLTF load failed, using procedural fallback:', err);
    }
  }

  const procedural = createLoadModel(loadType, w, h, d, color);
  applyMaterialHints(procedural, visual, color);
  if (visual.orientation) {
    procedural.rotation.set(
      THREE.MathUtils.degToRad(visual.orientation.x ?? 0),
      THREE.MathUtils.degToRad(visual.orientation.y ?? 0),
      THREE.MathUtils.degToRad(visual.orientation.z ?? 0),
    );
  }
  return procedural;
}
