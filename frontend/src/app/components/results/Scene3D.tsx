import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../contexts/ThemeContext';
import { EngineOutput } from '../../engine/AAREngine';

// ── TYPES ─────────────────────────────────────────────────────────────────
export interface Load3D {
  id: string; name: string; weight: number; volume: number;
  fragile: boolean; priority: number; customer: string;
  compatScore: number; stackGroup: string; rotationAllowed: boolean;
  x: number; y: number; z: number; w: number; h: number; d: number;
  color: string; hasViolation?: boolean;
}

export interface Scene3DProps {
  loads: Load3D[];
  selectedLoad: string | null;
  vehicleType?: 'flatcar' | 'boxcar' | 'gondola' | 'reefer';
  cogPosition: { x:number; y:number; z:number };
  cogTrail: { x:number; y:number; z:number }[];
  axleData: { name:string; load:number; limit:number }[];
  engineResult?: EngineOutput;
  onSelectLoad: (id:string|null) => void;
  onMoveLoad: (id:string, x:number, z:number) => void;
  onValidateDrag?: (id:string, x:number, z:number) => {
    hasCollision: boolean;
    lateralWarning: boolean;
    cgViolation: boolean;
    voidWarning: boolean;
    combinedCG: number;
    lateralPercent: number;
  };
}

const CAR_L = 20;
const CAR_W = 3.2;
const PLAT_H = 1.2;

// Enhanced OrbitControls with damping and momentum
class EnhancedOrbitControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLCanvasElement;
  private isDown = false;
  private previousMouseX = 0;
  private previousMouseY = 0;
  private theta = Math.PI / 4;
  private phi = Math.PI / 4;
  private radius = 35;
  private target = new THREE.Vector3(CAR_L/2, 0, CAR_W/2);
  private velocityTheta = 0;
  private velocityPhi = 0;
  private dampingFactor = 0.92;
  private animationId: number | null = null;
  public enabled = true;  // ← new: lets drag logic pause orbit rotation

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLCanvasElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel);
    this.domElement.addEventListener('dblclick', this.onDoubleClick);
    
    this.update();
    this.startMomentum();
  }

  private onMouseDown = (e: MouseEvent) => {
    this.isDown = true;
    this.previousMouseX = e.clientX;
    this.previousMouseY = e.clientY;
    this.velocityTheta = 0;
    this.velocityPhi = 0;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isDown || !this.enabled) return;  // ← check enabled
    
    const deltaX = e.clientX - this.previousMouseX;
    const deltaY = e.clientY - this.previousMouseY;
    
    this.velocityTheta = -deltaX * 0.01;
    this.velocityPhi = -deltaY * 0.01;
    
    this.theta += this.velocityTheta;
    this.phi += this.velocityPhi;
    this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi));
    
    this.previousMouseX = e.clientX;
    this.previousMouseY = e.clientY;
    
    this.update();
  };

  private onMouseUp = () => {
    this.isDown = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.radius += e.deltaY * 0.02;
    this.radius = Math.max(10, Math.min(60, this.radius));
    this.update();
  };

  private onDoubleClick = () => {
    // Focus animation on center
    this.focusOn(new THREE.Vector3(CAR_L/2, PLAT_H + 1, CAR_W/2));
  };

  focusOn(position: THREE.Vector3) {
    const duration = 500;
    const startTarget = this.target.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutCubic(progress);

      this.target.lerpVectors(startTarget, position, eased);
      this.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private startMomentum() {
    const momentum = () => {
      if (!this.isDown) {
        this.velocityTheta *= this.dampingFactor;
        this.velocityPhi *= this.dampingFactor;

        if (Math.abs(this.velocityTheta) > 0.001 || Math.abs(this.velocityPhi) > 0.001) {
          this.theta += this.velocityTheta;
          this.phi += this.velocityPhi;
          this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi));
          this.update();
        }
      }
      this.animationId = requestAnimationFrame(momentum);
    };
    momentum();
  }

  update() {
    const x = this.target.x + this.radius * Math.sin(this.phi) * Math.cos(this.theta);
    const y = this.target.y + this.radius * Math.cos(this.phi);
    const z = this.target.z + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('dblclick', this.onDoubleClick);
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}

// Helper function to create realistic paper roll
function createPaperRoll(load: Load3D): THREE.Group {
  const group = new THREE.Group();
  
  // Main cylinder
  const radius = load.w / 2;
  const height = load.h;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
  
  // Kraft paper material
  const material = new THREE.MeshStandardMaterial({
    color: '#b8936b',
    roughness: 0.85,
    metalness: 0.0,
  });
  
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.rotation.x = Math.PI / 2; // Rotate to lie flat
  group.add(cylinder);
  
  // End caps with paper texture
  const capGeometry = new THREE.CircleGeometry(radius, 32);
  const capMaterial = new THREE.MeshStandardMaterial({
    color: '#d4c5a9',
    roughness: 0.9,
    metalness: 0.0,
  });
  
  const cap1 = new THREE.Mesh(capGeometry, capMaterial);
  cap1.position.z = height / 2;
  group.add(cap1);
  
  const cap2 = new THREE.Mesh(capGeometry, capMaterial);
  cap2.position.z = -height / 2;
  cap2.rotation.y = Math.PI;
  group.add(cap2);
  
  // Plastic wrap shine overlay
  const wrapGeometry = new THREE.CylinderGeometry(radius + 0.01, radius + 0.01, height * 0.8, 32);
  const wrapMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.15,
    roughness: 0.1,
    metalness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
  });
  
  const wrap = new THREE.Mesh(wrapGeometry, wrapMaterial);
  wrap.rotation.x = Math.PI / 2;
  group.add(wrap);
  
  // Label sticker
  const labelGeometry = new THREE.PlaneGeometry(radius * 0.6, radius * 0.3);
  const labelMaterial = new THREE.MeshStandardMaterial({
    color: '#f7fafc',
    roughness: 0.4,
  });
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(0, radius + 0.02, 0);
  label.rotation.x = -Math.PI / 2;
  group.add(label);
  
  // Add subtle edge chamfer with darker ring
  const edgeGeometry = new THREE.TorusGeometry(radius, 0.02, 8, 32);
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: '#8b7355',
    roughness: 0.9,
  });
  const edge1 = new THREE.Mesh(edgeGeometry, edgeMaterial);
  edge1.position.z = height / 2 - 0.05;
  group.add(edge1);
  
  const edge2 = new THREE.Mesh(edgeGeometry, edgeMaterial);
  edge2.position.z = -height / 2 + 0.05;
  group.add(edge2);
  
  return group;
}

// Helper function to create realistic pallet
function createPallet(load: Load3D): THREE.Group {
  const group = new THREE.Group();
  
  // Pallet base (wooden slats)
  const palletHeight = 0.15;
  const slatsGroup = new THREE.Group();
  
  const slotGeometry = new THREE.BoxGeometry(load.w, palletHeight, load.d / 10);
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: '#8b6f47',
    roughness: 0.9,
    metalness: 0.1,
  });
  
  for (let i = 0; i < 5; i++) {
    const slat = new THREE.Mesh(slotGeometry, woodMaterial);
    slat.position.z = (i - 2) * (load.d / 5);
    slat.castShadow = true;
    slat.receiveShadow = true;
    slatsGroup.add(slat);
  }
  
  slatsGroup.position.y = -load.h / 2 + palletHeight / 2;
  group.add(slatsGroup);
  
  // Stacked goods on pallet
  const goodsGeometry = new THREE.BoxGeometry(load.w * 0.9, load.h - palletHeight - 0.1, load.d * 0.9);
  const goodsMaterial = new THREE.MeshStandardMaterial({
    color: load.color || '#a0816c',
    roughness: 0.7,
    metalness: 0.2,
  });
  
  const goods = new THREE.Mesh(goodsGeometry, goodsMaterial);
  goods.position.y = palletHeight / 2;
  goods.castShadow = true;
  goods.receiveShadow = true;
  group.add(goods);
  
  // Stretch wrap (transparent plastic)
  const wrapGeometry = new THREE.BoxGeometry(load.w * 0.95, load.h - palletHeight, load.d * 0.95);
  const wrapMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.12,
    roughness: 0.1,
    metalness: 0.0,
    transmission: 0.3,
  });
  
  const wrap = new THREE.Mesh(wrapGeometry, wrapMaterial);
  wrap.position.y = palletHeight / 2;
  group.add(wrap);
  
  // Straps
  const strapGeometry = new THREE.BoxGeometry(load.w * 0.96, 0.03, 0.05);
  const strapMaterial = new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.6,
    metalness: 0.4,
  });
  
  const strap1 = new THREE.Mesh(strapGeometry, strapMaterial);
  strap1.position.set(0, load.h / 3, 0);
  group.add(strap1);
  
  const strap2 = new THREE.Mesh(strapGeometry, strapMaterial);
  strap2.position.set(0, load.h * 0.6, 0);
  group.add(strap2);
  
  return group;
}

// Helper function to create realistic crate
function createCrate(load: Load3D): THREE.Group {
  const group = new THREE.Group();
  
  // Main wooden crate body
  const crateGeometry = new THREE.BoxGeometry(load.w, load.h, load.d);
  const crateMaterial = new THREE.MeshStandardMaterial({
    color: '#a89968',
    roughness: 0.85,
    metalness: 0.1,
  });
  
  const crate = new THREE.Mesh(crateGeometry, crateMaterial);
  crate.castShadow = true;
  crate.receiveShadow = true;
  group.add(crate);
  
  // Metal corner reinforcements
  const cornerGeometry = new THREE.BoxGeometry(0.04, load.h + 0.02, 0.04);
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: '#4a5568',
    roughness: 0.3,
    metalness: 0.9,
  });
  
  const corners = [
    [-load.w/2, 0, -load.d/2],
    [-load.w/2, 0, load.d/2],
    [load.w/2, 0, -load.d/2],
    [load.w/2, 0, load.d/2],
  ];
  
  corners.forEach(([x, y, z]) => {
    const corner = new THREE.Mesh(cornerGeometry, metalMaterial);
    corner.position.set(x, y, z);
    corner.castShadow = true;
    group.add(corner);
  });
  
  // Warning stickers on sides
  const stickerGeometry = new THREE.PlaneGeometry(load.w * 0.4, load.h * 0.3);
  const warningMaterial = new THREE.MeshStandardMaterial({
    color: '#fed700',
    roughness: 0.4,
  });
  
  const sticker = new THREE.Mesh(stickerGeometry, warningMaterial);
  sticker.position.set(0, 0, load.d/2 + 0.01);
  group.add(sticker);
  
  // Weight marking stencil (darker rectangle)
  const markingGeometry = new THREE.PlaneGeometry(load.w * 0.3, load.h * 0.15);
  const markingMaterial = new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.9,
  });
  
  const marking = new THREE.Mesh(markingGeometry, markingMaterial);
  marking.position.set(0, load.h * 0.25, load.d/2 + 0.011);
  group.add(marking);
  
  // Edge highlighting
  const edges = new THREE.EdgesGeometry(crateGeometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: '#6b5d3f', linewidth: 2 });
  const lineSegments = new THREE.LineSegments(edges, lineMaterial);
  group.add(lineSegments);
  
  return group;
}

// Helper function to create railcar bogies (wheel trucks)
function createBogie(isDark: boolean): THREE.Group {
  const group = new THREE.Group();
  
  // Bogie frame
  const frameGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.6);
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: '#1a202c',
    roughness: 0.7,
    metalness: 0.8,
  });
  
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.castShadow = true;
  group.add(frame);
  
  // Wheels (2 per bogie)
  const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: '#2d3748',
    roughness: 0.5,
    metalness: 0.9,
  });
  
  const positions = [-0.3, 0.3];
  positions.forEach(x => {
    [-0.4, 0.4].forEach(z => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, -0.2, z);
      wheel.castShadow = true;
      group.add(wheel);
    });
  });
  
  return group;
}

// Helper function to create boxcar with sliding door details
function createBoxcarDetails(scene: THREE.Scene, isDark: boolean): void {
  const carColor = isDark ? '#2d3748' : '#4a5568';
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: carColor,
    roughness: 0.6,
    metalness: 0.4,
  });

  // Side walls with panel detail
  const sideWallGeometry = new THREE.BoxGeometry(CAR_L, 4, 0.12);
  const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  leftWall.position.set(CAR_L/2, PLAT_H + 2, CAR_W/2 + CAR_W/2);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  rightWall.position.set(CAR_L/2, PLAT_H + 2, CAR_W/2 - CAR_W/2);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  // Vertical panel ribs on side walls
  const ribGeometry = new THREE.BoxGeometry(0.08, 4, 0.06);
  const ribMaterial = new THREE.MeshStandardMaterial({
    color: '#1a202c',
    roughness: 0.7,
    metalness: 0.6,
  });

  for (let i = 0; i < 8; i++) {
    const x = (i / 7) * CAR_L;
    
    const rib1 = new THREE.Mesh(ribGeometry, ribMaterial);
    rib1.position.set(x, PLAT_H + 2, CAR_W/2 + CAR_W/2 + 0.09);
    rib1.castShadow = true;
    scene.add(rib1);
    
    const rib2 = new THREE.Mesh(ribGeometry, ribMaterial);
    rib2.position.set(x, PLAT_H + 2, CAR_W/2 - CAR_W/2 - 0.09);
    rib2.castShadow = true;
    scene.add(rib2);
  }

  // Sliding door tracks
  const doorTrackGeometry = new THREE.BoxGeometry(CAR_L * 0.8, 0.05, 0.05);
  const doorTrackMaterial = new THREE.MeshStandardMaterial({
    color: '#718096',
    roughness: 0.4,
    metalness: 0.8,
  });

  const topTrack = new THREE.Mesh(doorTrackGeometry, doorTrackMaterial);
  topTrack.position.set(CAR_L/2, PLAT_H + 3.9, CAR_W/2 + CAR_W/2 + 0.15);
  scene.add(topTrack);

  const bottomTrack = new THREE.Mesh(doorTrackGeometry, doorTrackMaterial);
  bottomTrack.position.set(CAR_L/2, PLAT_H + 0.2, CAR_W/2 + CAR_W/2 + 0.15);
  scene.add(bottomTrack);

  // Door handle detail
  const handleGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.1);
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: '#f7fafc',
    roughness: 0.3,
    metalness: 0.9,
  });

  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(CAR_L * 0.6, PLAT_H + 2, CAR_W/2 + CAR_W/2 + 0.18);
  scene.add(handle);

  // End walls
  const endWallGeometry = new THREE.BoxGeometry(0.12, 4, CAR_W);
  const frontWall = new THREE.Mesh(endWallGeometry, wallMaterial);
  frontWall.position.set(CAR_L, PLAT_H + 2, CAR_W/2);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  scene.add(frontWall);

  const backWall = new THREE.Mesh(endWallGeometry, wallMaterial);
  backWall.position.set(0, PLAT_H + 2, CAR_W/2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Roof
  const roofGeometry = new THREE.BoxGeometry(CAR_L, 0.12, CAR_W);
  const roof = new THREE.Mesh(roofGeometry, wallMaterial);
  roof.position.set(CAR_L/2, PLAT_H + 4, CAR_W/2);
  roof.castShadow = true;
  roof.receiveShadow = true;
  scene.add(roof);

  // Ladder on end
  const ladderRungGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
  const ladderMaterial = new THREE.MeshStandardMaterial({
    color: '#f6e05e',
    roughness: 0.4,
    metalness: 0.8,
  });

  for (let i = 0; i < 6; i++) {
    const rung = new THREE.Mesh(ladderRungGeometry, ladderMaterial);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(CAR_L + 0.15, PLAT_H + 0.5 + i * 0.6, CAR_W/2);
    scene.add(rung);
  }
}

// Helper function to create flatcar with structural beams
function createFlatcarDetails(scene: THREE.Scene): void {
  // Deck beams
  const beamGeometry = new THREE.BoxGeometry(CAR_L, 0.15, 0.2);
  const beamMaterial = new THREE.MeshStandardMaterial({
    color: '#2d3748',
    roughness: 0.7,
    metalness: 0.6,
  });

  const positions = [-CAR_W/2 + 0.3, 0, CAR_W/2 - 0.3];
  positions.forEach(z => {
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(CAR_L/2, PLAT_H - 0.1, CAR_W/2 + z);
    beam.castShadow = true;
    scene.add(beam);
  });

  // Cross beams
  const crossBeamGeometry = new THREE.BoxGeometry(0.2, 0.15, CAR_W * 0.9);
  for (let i = 0; i < 6; i++) {
    const beam = new THREE.Mesh(crossBeamGeometry, beamMaterial);
    beam.position.set(i * (CAR_L / 5), PLAT_H - 0.1, CAR_W/2);
    beam.castShadow = true;
    scene.add(beam);
  }

  // Tie-down points
  const tieDownGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
  const tieDownMaterial = new THREE.MeshStandardMaterial({
    color: '#718096',
    roughness: 0.4,
    metalness: 0.9,
  });

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      const tieDown = new THREE.Mesh(tieDownGeometry, tieDownMaterial);
      tieDown.position.set(
        i * (CAR_L / 5),
        PLAT_H + 0.1,
        CAR_W/2 + (j - 1) * (CAR_W / 3)
      );
      scene.add(tieDown);
    }
  }
}

// Helper function to create gondola with deep sidewalls
function createGondolaDetails(scene: THREE.Scene, isDark: boolean): void {
  const gondolaColor = isDark ? '#2d3748' : '#4a5568';
  const gondolaMaterial = new THREE.MeshStandardMaterial({
    color: gondolaColor,
    roughness: 0.75,
    metalness: 0.5,
  });

  const wallHeight = 2.5;
  
  // Side walls with ribs
  const sideWallGeometry = new THREE.BoxGeometry(CAR_L, wallHeight, 0.1);
  const leftWall = new THREE.Mesh(sideWallGeometry, gondolaMaterial);
  leftWall.position.set(CAR_L/2, PLAT_H + wallHeight/2, CAR_W/2 + CAR_W/2);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeometry, gondolaMaterial);
  rightWall.position.set(CAR_L/2, PLAT_H + wallHeight/2, CAR_W/2 - CAR_W/2);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  // Interior ribs for structural detail
  const ribGeometry = new THREE.BoxGeometry(0.08, wallHeight, 0.08);
  const ribMaterial = new THREE.MeshStandardMaterial({
    color: '#1a202c',
    roughness: 0.7,
    metalness: 0.7,
  });

  for (let i = 0; i < 10; i++) {
    const x = i * (CAR_L / 9);
    
    const rib1 = new THREE.Mesh(ribGeometry, ribMaterial);
    rib1.position.set(x, PLAT_H + wallHeight/2, CAR_W/2 + CAR_W/2 - 0.08);
    rib1.castShadow = true;
    scene.add(rib1);
    
    const rib2 = new THREE.Mesh(ribGeometry, ribMaterial);
    rib2.position.set(x, PLAT_H + wallHeight/2, CAR_W/2 - CAR_W/2 + 0.08);
    rib2.castShadow = true;
    scene.add(rib2);
  }

  // End walls
  const endWallGeometry = new THREE.BoxGeometry(0.1, wallHeight, CAR_W);
  const frontWall = new THREE.Mesh(endWallGeometry, gondolaMaterial);
  frontWall.position.set(CAR_L, PLAT_H + wallHeight/2, CAR_W/2);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  scene.add(frontWall);

  const backWall = new THREE.Mesh(endWallGeometry, gondolaMaterial);
  backWall.position.set(0, PLAT_H + wallHeight/2, CAR_W/2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  scene.add(backWall);
}

// Helper function to create reefer (refrigerated car)
function createReeferDetails(scene: THREE.Scene): void {
  const carColor = '#e2e8f0';
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: carColor,
    roughness: 0.4,
    metalness: 0.3,
  });

  // Insulated walls
  const sideWallGeometry = new THREE.BoxGeometry(CAR_L, 4, 0.15);
  const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  leftWall.position.set(CAR_L/2, PLAT_H + 2, CAR_W/2 + CAR_W/2);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  rightWall.position.set(CAR_L/2, PLAT_H + 2, CAR_W/2 - CAR_W/2);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  // End walls
  const endWallGeometry = new THREE.BoxGeometry(0.15, 4, CAR_W);
  const frontWall = new THREE.Mesh(endWallGeometry, wallMaterial);
  frontWall.position.set(CAR_L, PLAT_H + 2, CAR_W/2);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  scene.add(frontWall);

  const backWall = new THREE.Mesh(endWallGeometry, wallMaterial);
  backWall.position.set(0, PLAT_H + 2, CAR_W/2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Roof
  const roofGeometry = new THREE.BoxGeometry(CAR_L, 0.15, CAR_W);
  const roof = new THREE.Mesh(roofGeometry, wallMaterial);
  roof.position.set(CAR_L/2, PLAT_H + 4, CAR_W/2);
  roof.castShadow = true;
  roof.receiveShadow = true;
  scene.add(roof);

  // Refrigeration unit on front
  const refrigUnitGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.6);
  const refrigUnitMaterial = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.5,
    metalness: 0.7,
  });

  const refrigUnit = new THREE.Mesh(refrigUnitGeometry, refrigUnitMaterial);
  refrigUnit.position.set(CAR_L + 0.5, PLAT_H + 1, CAR_W/2);
  refrigUnit.castShadow = true;
  scene.add(refrigUnit);

  // Vent grilles on refrigeration unit
  const ventGeometry = new THREE.PlaneGeometry(0.6, 0.3);
  const ventMaterial = new THREE.MeshStandardMaterial({
    color: '#475569',
    roughness: 0.8,
    metalness: 0.4,
  });

  const vent = new THREE.Mesh(ventGeometry, ventMaterial);
  vent.position.set(CAR_L + 0.91, PLAT_H + 1, CAR_W/2);
  vent.rotation.y = -Math.PI / 2;
  scene.add(vent);

  // Cooling fins
  for (let i = 0; i < 5; i++) {
    const finGeometry = new THREE.BoxGeometry(0.02, 0.8, 0.4);
    const fin = new THREE.Mesh(finGeometry, refrigUnitMaterial);
    fin.position.set(CAR_L + 0.5 + i * 0.08, PLAT_H + 1.4, CAR_W/2);
    scene.add(fin);
  }
}

// Helper function to add industrial markings
function addIndustrialMarkings(scene: THREE.Scene, vehicleType: string): void {
  // Railcar ID marking
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a202c';
  ctx.font = 'bold 80px monospace';
  ctx.fillText('OPTL 248517', 30, 100);
  ctx.font = '40px monospace';
  ctx.fillText('LOAD LIMIT: 220,000 LB', 30, 160);
  ctx.fillText('TARE: 58,400 LB', 30, 210);
  
  const texture = new THREE.CanvasTexture(canvas);
  const markingMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
  });
  
  const markingGeometry = new THREE.PlaneGeometry(2, 1);
  const marking = new THREE.Mesh(markingGeometry, markingMaterial);
  marking.position.set(CAR_L/2, PLAT_H + 2.5, CAR_W/2 + CAR_W/2 + 0.13);
  scene.add(marking);
  
  // Clearance plate
  const plateCanvas = document.createElement('canvas');
  plateCanvas.width = 256;
  plateCanvas.height = 256;
  const plateCtx = plateCanvas.getContext('2d')!;
  
  plateCtx.fillStyle = '#f6e05e';
  plateCtx.fillRect(0, 0, plateCanvas.width, plateCanvas.height);
  plateCtx.fillStyle = '#1a202c';
  plateCtx.font = 'bold 60px monospace';
  plateCtx.fillText('PLATE', 40, 100);
  plateCtx.fillText('C-87', 60, 180);
  
  const plateTexture = new THREE.CanvasTexture(plateCanvas);
  const plateMaterial = new THREE.MeshStandardMaterial({
    map: plateTexture,
    roughness: 0.6,
  });
  
  const plateGeometry = new THREE.PlaneGeometry(0.5, 0.5);
  const plate = new THREE.Mesh(plateGeometry, plateMaterial);
  plate.position.set(CAR_L - 0.5, PLAT_H + 1, CAR_W/2 + CAR_W/2 + 0.13);
  scene.add(plate);
}

export function Scene3D({
  loads,
  selectedLoad,
  vehicleType = 'flatcar',
  cogPosition,
  onSelectLoad,
  onMoveLoad,
  onValidateDrag,
}: Scene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredLoad, setHoveredLoad] = useState<Load3D | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLoadId, setDraggedLoadId] = useState<string | null>(null);
  const [dragValidation, setDragValidation] = useState<any>(null);
  
  // Store Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<EnhancedOrbitControls | null>(null);
  const loadMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const animationFrameRef = useRef<number>();
  const dragPlaneRef = useRef<THREE.Plane | null>(null);
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  // ── Refs that mirror drag state so stale-closure handlers can read current values ──
  const isDraggingRef = useRef(false);
  const draggedLoadIdRef = useRef<string | null>(null);
  const intersectionPointRef = useRef<THREE.Vector3>(new THREE.Vector3());

  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? '#0f172a' : '#f1f5f9');
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(25, 25, 25);
    camera.lookAt(CAR_L/2, 0, CAR_W/2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new EnhancedOrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.4 : 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.6 : 0.8);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x4299e1, isDark ? 0.2 : 0.3);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: isDark ? '#1e293b' : '#cbd5e1',
      roughness: 0.8,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50, isDark ? '#334155' : '#94a3b8', isDark ? '#1e293b' : '#cbd5e1');
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Railcar chassis
    const chassisGeometry = new THREE.BoxGeometry(CAR_L, 0.8, CAR_W * 0.8);
    const chassisMaterial = new THREE.MeshStandardMaterial({ 
      color: '#1a202c',
      roughness: 0.7,
      metalness: 0.8
    });
    const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
    chassis.position.set(CAR_L/2, PLAT_H/2 - 0.4, CAR_W/2);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    scene.add(chassis);

    // Railcar deck
    const deckGeometry = new THREE.PlaneGeometry(CAR_L, CAR_W);
    const deckMaterial = new THREE.MeshStandardMaterial({ 
      color: vehicleType === 'reefer' ? '#e2e8f0' : '#2d3748',
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.rotation.x = -Math.PI / 2;
    deck.position.set(CAR_L/2, PLAT_H + 0.01, CAR_W/2);
    deck.receiveShadow = true;
    scene.add(deck);

    // Boxcar/Reefer walls
    if (vehicleType === 'boxcar') {
      createBoxcarDetails(scene, isDark);
    }

    // Gondola walls
    if (vehicleType === 'gondola') {
      createGondolaDetails(scene, isDark);
    }

    // Flatcar details
    if (vehicleType === 'flatcar') {
      createFlatcarDetails(scene);
    }

    // Reefer details
    if (vehicleType === 'reefer') {
      createReeferDetails(scene);
    }

    // Add industrial markings
    addIndustrialMarkings(scene, vehicleType);

    // Add bogies
    const bogie1 = createBogie(isDark);
    bogie1.position.set(CAR_L/2, 0, CAR_W/2 - 0.5);
    scene.add(bogie1);

    const bogie2 = createBogie(isDark);
    bogie2.position.set(CAR_L/2, 0, CAR_W/2 + 0.5);
    scene.add(bogie2);

    // COG indicator
    const cogGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const cogMaterial = new THREE.MeshStandardMaterial({ 
      color: '#f6ad55',
      emissive: '#dd6b20',
      emissiveIntensity: 0.6
    });
    const cogSphere = new THREE.Mesh(cogGeometry, cogMaterial);
    cogSphere.position.set(cogPosition.x, PLAT_H + cogPosition.y + 0.3, cogPosition.z);
    scene.add(cogSphere);

    // Animation loop
    function animate() {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Click handler
    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);
      
      // Get all meshes from all load groups
      const allMeshes: THREE.Object3D[] = [];
      loadMeshesRef.current.forEach(group => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            allMeshes.push(child);
          }
        });
      });
      
      const intersects = raycasterRef.current.intersectObjects(allMeshes);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        // Traverse up to find the parent group with loadId
        let parent = mesh.parent;
        while (parent && !parent.userData.loadId) {
          parent = parent.parent;
        }
        if (parent && parent.userData.loadId) {
          onSelectLoad(parent.userData.loadId);
        }
      } else {
        onSelectLoad(null);
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    // Drag handler
    const handleMouseDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);
      
      // Get all meshes from all load groups
      const allMeshes: THREE.Object3D[] = [];
      loadMeshesRef.current.forEach(group => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            allMeshes.push(child);
          }
        });
      });
      
      const intersects = raycasterRef.current.intersectObjects(allMeshes);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        // Traverse up to find the parent group with loadId
        let parent = mesh.parent;
        while (parent && !parent.userData.loadId) {
          parent = parent.parent;
        }
        if (parent && parent.userData.loadId) {
          setDraggedLoadId(parent.userData.loadId);
          setIsDragging(true);
          isDraggingRef.current = true;           // ← keep ref in sync
          draggedLoadIdRef.current = parent.userData.loadId; // ← keep ref in sync
          dragOffsetRef.current.copy(intersects[0].point).sub(parent.position);
          dragPlaneRef.current = new THREE.Plane().setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 1, 0),
            parent.position
          );
          controlsRef.current!.enabled = false;  // ← disable orbit controls
        }
      }
    };
    renderer.domElement.addEventListener('mousedown', handleMouseDown);

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !draggedLoadIdRef.current || !dragPlaneRef.current) return;  // ← use refs

      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);
      // Use a separate vector so we don't corrupt dragOffsetRef
      raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectionPointRef.current);

      const load = loadMeshesRef.current.get(draggedLoadIdRef.current);  // ← use ref
      if (load && intersectionPointRef.current) {
        const newX = intersectionPointRef.current.x;
        const newZ = intersectionPointRef.current.z;
        load.position.set(newX, load.position.y, newZ);
        if (onValidateDrag) {
          const validation = onValidateDrag(draggedLoadIdRef.current, newX, newZ);
          setDragValidation(validation);
        }
      }
    };
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    const handleMouseUp = () => {
      if (!isDraggingRef.current || !draggedLoadIdRef.current) return;  // ← use refs

      const load = loadMeshesRef.current.get(draggedLoadIdRef.current);  // ← use ref
      if (load) {
        const newX = load.position.x;
        const newZ = load.position.z;
        onMoveLoad(draggedLoadIdRef.current, newX, newZ);  // ← use ref
      }

      isDraggingRef.current = false;      // ← clear ref
      draggedLoadIdRef.current = null;    // ← clear ref
      setIsDragging(false);
      setDraggedLoadId(null);
      setDragValidation(null);
      controlsRef.current!.enabled = true;  // ← re-enable orbit controls
    };
    renderer.domElement.addEventListener('mouseup', handleMouseUp);

    setIsInitialized(true);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Update loads
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    const scene = sceneRef.current;

    // Remove old load meshes
    loadMeshesRef.current.forEach(group => {
      scene.remove(group);
      // Properly dispose of all geometries and materials in the group
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    });
    loadMeshesRef.current.clear();

    // Add new load meshes
    loads.forEach(load => {
      // Determine load type and create realistic model
      let loadGroup: THREE.Group;

      if (load.name.toLowerCase().includes('paper') || load.name.toLowerCase().includes('roll')) {
        // Create realistic paper roll
        loadGroup = createPaperRoll(load);
      } else if (load.name.toLowerCase().includes('pallet')) {
        // Create realistic pallet
        loadGroup = createPallet(load);
      } else if (load.name.toLowerCase().includes('crate')) {
        // Create realistic crate
        loadGroup = createCrate(load);
      } else {
        // Generic box with industrial look
        loadGroup = new THREE.Group();
        const geometry = new THREE.BoxGeometry(load.w, load.h, load.d);
        const material = new THREE.MeshStandardMaterial({
          color: load.color || '#cbd5e1',
          roughness: 0.7,
          metalness: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        loadGroup.add(mesh);

        // Add edge detail
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: '#64748b', linewidth: 1 });
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        loadGroup.add(lineSegments);
      }

      // Position the load group
      loadGroup.position.set(load.x + load.w/2, PLAT_H + load.y + load.h/2, load.z + load.d/2);
      loadGroup.userData.loadId = load.id;

      // Enable shadows for all children
      loadGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add selection/violation overlay
      if (selectedLoad === load.id) {
        const boundingBox = new THREE.Box3().setFromObject(loadGroup);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        
        const overlayGeometry = new THREE.BoxGeometry(size.x * 1.05, size.y * 1.05, size.z * 1.05);
        const overlayMaterial = new THREE.MeshStandardMaterial({
          color: '#63b3ed',
          emissive: '#3182ce',
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.25,
          wireframe: true
        });
        const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
        loadGroup.add(overlay);
      } else if (load.hasViolation) {
        const boundingBox = new THREE.Box3().setFromObject(loadGroup);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        
        const overlayGeometry = new THREE.BoxGeometry(size.x * 1.05, size.y * 1.05, size.z * 1.05);
        const overlayMaterial = new THREE.MeshStandardMaterial({
          color: '#fc8181',
          emissive: '#e53e3e',
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.3,
          wireframe: true
        });
        const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
        loadGroup.add(overlay);
      }

      scene.add(loadGroup);
      // Store the main group (not individual meshes)
      loadMeshesRef.current.set(load.id, loadGroup as any);
    });
  }, [loads, selectedLoad, isInitialized]);

  // Update theme
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;
    sceneRef.current.background = new THREE.Color(isDark ? '#0f172a' : '#f1f5f9');
  }, [isDark, isInitialized]);

  // Update COG position
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    // Find and update COG sphere
    const cogSphere = sceneRef.current.children.find(
      child => child instanceof THREE.Mesh && (child.material as THREE.MeshStandardMaterial).emissive?.getHex() === 0xdd6b20
    );
    
    if (cogSphere) {
      cogSphere.position.set(cogPosition.x, PLAT_H + cogPosition.y + 0.3, cogPosition.z);
    }
  }, [cogPosition, isInitialized]);

  // Hover detection for tooltips
  useEffect(() => {
    if (!rendererRef.current || !isInitialized) return;

    const handleHoverMove = (event: MouseEvent) => {
      if (isDragging) {
        setHoveredLoad(null);
        return;
      }

      const rect = rendererRef.current!.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current!);
      
      // Get all meshes from all load groups
      const allMeshes: THREE.Object3D[] = [];
      loadMeshesRef.current.forEach(group => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            allMeshes.push(child);
          }
        });
      });
      
      const intersects = raycasterRef.current.intersectObjects(allMeshes);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        // Traverse up to find the parent group with loadId
        let parent = mesh.parent;
        while (parent && !parent.userData.loadId) {
          parent = parent.parent;
        }
        if (parent && parent.userData.loadId) {
          const load = loads.find(l => l.id === parent.userData.loadId);
          if (load) {
            setHoveredLoad(load);
            setTooltipPosition({ x: event.clientX, y: event.clientY });
          }
        }
      } else {
        setHoveredLoad(null);
      }
    };

    rendererRef.current.domElement.addEventListener('mousemove', handleHoverMove);

    return () => {
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener('mousemove', handleHoverMove);
      }
    };
  }, [loads, isInitialized, isDragging]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={containerRef} 
        className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
        style={{ minHeight: '400px' }}
      />
      
      {/* Hover Tooltip */}
      {hoveredLoad && !isDragging && (
        <div 
          style={{
            position: 'fixed',
            left: tooltipPosition.x + 16,
            top: tooltipPosition.y + 16,
            pointerEvents: 'none',
            zIndex: 9999,
            background: isDark ? '#1e293b' : '#ffffff',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.15)',
            minWidth: '220px',
            fontSize: '12px',
            color: isDark ? '#f1f5f9' : '#0f172a'
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: isDark ? '#ffffff' : '#000000' }}>
            {hoveredLoad.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
            <div>
              <div style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Weight:</div>
              <div style={{ fontWeight: 600 }}>{hoveredLoad.weight.toLocaleString()} lb</div>
            </div>
            <div>
              <div style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Volume:</div>
              <div style={{ fontWeight: 600 }}>{hoveredLoad.volume.toFixed(1)} ft³</div>
            </div>
            <div>
              <div style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Dimensions:</div>
              <div style={{ fontWeight: 600, fontSize: '10px' }}>{hoveredLoad.w.toFixed(1)} × {hoveredLoad.h.toFixed(1)} × {hoveredLoad.d.toFixed(1)}</div>
            </div>
            <div>
              <div style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Priority:</div>
              <div style={{ fontWeight: 600 }}>P{hoveredLoad.priority}</div>
            </div>
          </div>
          {hoveredLoad.fragile && (
            <div style={{ 
              marginTop: '8px', 
              padding: '4px 8px', 
              background: '#FEF3C7', 
              color: '#92400E',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              ⚠️ FRAGILE
            </div>
          )}
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
            <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '10px' }}>Customer:</div>
            <div style={{ fontWeight: 600, fontSize: '11px' }}>{hoveredLoad.customer}</div>
          </div>
        </div>
      )}

      {/* Drag Validation Overlay */}
      {isDragging && dragValidation && (
        <div 
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: isDark ? '#1e293b' : '#ffffff',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: dragValidation.hasCollision ? '#EF4444' : dragValidation.cgViolation ? '#F59E0B' : '#10B981',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.15)',
            minWidth: '200px',
            fontSize: '12px',
            color: isDark ? '#f1f5f9' : '#0f172a',
            zIndex: 1000
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
            Placement Validation
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>{dragValidation.hasCollision ? '❌' : '✅'}</span>
              <span>Collision Check</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>{dragValidation.cgViolation ? '⚠️' : '✅'}</span>
              <span>Center of Gravity</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>{dragValidation.lateralWarning ? '⚠️' : '✅'}</span>
              <span>Lateral Balance</span>
            </div>
          </div>
          {dragValidation.combinedCG !== undefined && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, fontSize: '10px' }}>
              <div style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Combined CG: {dragValidation.combinedCG.toFixed(2)} ft</div>
              <div style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Lateral: {dragValidation.lateralPercent.toFixed(1)}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}