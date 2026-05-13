import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../contexts/ThemeContext';
import { EngineOutput } from '../../engine/AAREngine';
import {
  createFlatcarModel, createBoxcarModel, createGondolaModel, createReeferModel, createBogie,
} from './VehicleModelBuilder';
import { createLoadModelAsync } from './LoadModelBuilder';
import { createSecurementGroup, updateSecurementGroup } from './SecurementRenderer';

// ── TYPES ─────────────────────────────────────────────────────────────────
export interface Load3D {
  id: string; name: string; weight: number; volume: number;
  fragile: boolean; priority: number; customer: string;
  compatScore: number; stackGroup: string; rotationAllowed: boolean;
  x: number; y: number; z: number; w: number; h: number; d: number;
  rotationY?: number;
  shape?: string;
  loadType?: string;
  materialType?: string;
  textureUrl?: string;
  modelUrl?: string;
  orientation?: 'vertical' | 'horizontal';
  color: string; hasViolation?: boolean;
}

export interface Scene3DProps {
  loads: Load3D[];
  selectedLoad: string | null;
  vehicleType?: 'flatcar' | 'boxcar' | 'gondola' | 'reefer';
  /** Vehicle dimensions (from backend optimization result) */
  vehicleDims?: { length: number; width: number; height: number; platformHeight?: number };
  cogPosition: { x:number; y:number; z:number };
  cogTrail: { x:number; y:number; z:number }[];
  axleData: { name:string; load:number; limit:number }[];
  engineResult?: EngineOutput;
  securements?: any[];
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

/** Default vehicle dimensions (fallback when not provided) */
const DEF_CAR_L = 20;
const DEF_CAR_W = 3.2;
const DEF_PLAT_H = 1.2;

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
  private target = new THREE.Vector3(DEF_CAR_L/2, 0, DEF_CAR_W/2);
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
    this.focusOn(new THREE.Vector3(DEF_CAR_L/2, DEF_PLAT_H + 1, DEF_CAR_W/2));
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

/* Vehicle and load models built by VehicleModelBuilder.ts and LoadModelBuilder.ts */

export function Scene3D({
  loads,
  selectedLoad,
  vehicleType = 'flatcar',
  vehicleDims,
  cogPosition,
  cogTrail,
  axleData,
  engineResult,
  securements = [],
  onSelectLoad,
  onMoveLoad,
  onValidateDrag,
}: Scene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  /** Derived vehicle dimensions (from props or defaults) */
  const carL = vehicleDims?.length ?? DEF_CAR_L;
  const carW = vehicleDims?.width ?? DEF_CAR_W;
  const carH = vehicleDims?.height ?? 2.6;
  const platH = vehicleDims?.platformHeight ?? DEF_PLAT_H;
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
  const securementsGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const animationFrameRef = useRef<number>();
  const dragPlaneRef = useRef<THREE.Plane | null>(null);
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  // ── Refs that mirror drag state so stale-closure handlers can read current values ──
  const isDraggingRef = useRef(false);
  const draggedLoadIdRef = useRef<string | null>(null);
  const intersectionPointRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const SNAP_GRID_SIZE = 0.05;

  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? '#0f172a' : '#f1f5f9');
    sceneRef.current = scene;

    // Camera (positioned to show full vehicle)
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(carL * 1.5, carL * 1.2, carW * 5);
    camera.lookAt(carL/2, platH, carW/2);
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
    sunLight.position.set(carL/2, carL, carW*2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -carL;
    sunLight.shadow.camera.right = carL;
    sunLight.shadow.camera.top = carL;
    sunLight.shadow.camera.bottom = -carW;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x4299e1, isDark ? 0.2 : 0.3);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // Ground plane (sized to vehicle)
    const groundSize = Math.max(carL, carW) * 4;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: isDark ? '#1e293b' : '#cbd5e1',
      roughness: 0.8,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper (sized to vehicle)
    const gridSize = Math.max(carL, carW) * 3;
    const gridHelper = new THREE.GridHelper(gridSize, Math.floor(gridSize), isDark ? '#334155' : '#94a3b8', isDark ? '#1e293b' : '#cbd5e1');
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // ── Vehicle model (realistic 3D structure) ──
    let vehicleModel: THREE.Group;
    switch (vehicleType) {
      case 'boxcar':
        vehicleModel = createBoxcarModel(carL, carW, carH, platH, isDark);
        break;
      case 'gondola':
        vehicleModel = createGondolaModel(carL, carW, carH, platH, isDark);
        break;
      case 'reefer':
        vehicleModel = createReeferModel(carL, carW, carH, platH, isDark);
        break;
      default:
        vehicleModel = createFlatcarModel(carL, carW, platH);
        break;
    }
    scene.add(vehicleModel);

    // Securements rendering
    if (securements && securements.length > 0) {
      const securementGroup = createSecurementGroup(securements);
      securementsGroupRef.current = securementGroup;
      scene.add(securementGroup);
    }

    // COG indicator
    const cogGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const cogMaterial = new THREE.MeshStandardMaterial({ 
      color: '#f6ad55',
      emissive: '#dd6b20',
      emissiveIntensity: 0.6
    });
    const cogSphere = new THREE.Mesh(cogGeometry, cogMaterial);
    cogSphere.position.set(cogPosition.x, platH + cogPosition.y + 0.3, cogPosition.z);
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
      
      // Get all meshes from all load groups, skipping overlay meshes
      const allMeshes: THREE.Object3D[] = [];
      loadMeshesRef.current.forEach(group => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh && !child.userData.isOverlay) {
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

    // Drag handler — with stack awareness and boundary clamping
    const handleMouseDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);
      
      // Get all meshes, skipping overlay meshes
      const allMeshes: THREE.Object3D[] = [];
      loadMeshesRef.current.forEach(group => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh && !child.userData.isOverlay) {
            allMeshes.push(child);
          }
        });
      });
      
      const intersects = raycasterRef.current.intersectObjects(allMeshes);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        let parent = mesh.parent;
        while (parent && !parent.userData.loadId) {
          parent = parent.parent;
        }
        if (parent && parent.userData.loadId) {
          const clickedId = parent.userData.loadId;
          const clickedGroup = parent as THREE.Group;
          const stackGroup = clickedGroup.userData.stackGroup || clickedId;

          // Find all loads in the same stack
          const stackMembers: THREE.Group[] = [];
          const stackOffsets: { group: THREE.Group; dx: number; dy: number; dz: number }[] = [];
          loadMeshesRef.current.forEach((group, id) => {
            const g = group as THREE.Group;
            if (g.userData.stackGroup === stackGroup) {
              stackMembers.push(g);
              stackOffsets.push({
                group: g,
                dx: g.position.x - clickedGroup.position.x,
                dy: g.position.y - clickedGroup.position.y,
                dz: g.position.z - clickedGroup.position.z,
              });
            }
          });

          // Store stack info in refs for use during drag
          (dragPlaneRef.current as any)._stackMembers = stackMembers;
          (dragPlaneRef.current as any)._stackOffsets = stackOffsets;

          setDraggedLoadId(clickedId);
          setIsDragging(true);
          isDraggingRef.current = true;
          draggedLoadIdRef.current = clickedId;
          dragOffsetRef.current.copy(intersects[0].point).sub(clickedGroup.position);
          dragPlaneRef.current = new THREE.Plane().setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 1, 0),
            clickedGroup.position
          );
          // Re-attach stack refs to new plane
          (dragPlaneRef.current as any)._stackMembers = stackMembers;
          (dragPlaneRef.current as any)._stackOffsets = stackOffsets;
          controlsRef.current!.enabled = false;
        }
      }
    };
    renderer.domElement.addEventListener('mousedown', handleMouseDown);

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !draggedLoadIdRef.current || !dragPlaneRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);
      raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectionPointRef.current);

      const leadLoad = loadMeshesRef.current.get(draggedLoadIdRef.current);
      if (leadLoad && intersectionPointRef.current) {
        const stackMembers = (dragPlaneRef.current as any)._stackMembers as THREE.Group[] | undefined;
        const stackOffsets = (dragPlaneRef.current as any)._stackOffsets as { group: THREE.Group; dx: number; dy: number; dz: number }[] | undefined;

        // Compute new position for the lead load
        let newX = intersectionPointRef.current.x - dragOffsetRef.current.x;
        let newZ = intersectionPointRef.current.z - dragOffsetRef.current.z;

        newX = Math.round(newX / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
        newZ = Math.round(newZ / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
        const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

         if (stackMembers && stackOffsets) {
           const bounds = stackOffsets.map(({ group, dx, dz }) => {
             const gw = group.userData.loadW || 1;
             const gd = group.userData.loadD || 1;
             return {
               minX: gw / 2 - dx,
               maxX: carL - gw / 2 - dx,
               minZ: -carW / 2 + gd / 2 - dz,
               maxZ: -carW / 2 + carW - gd / 2 - dz,
             };
           });
           const allowedMinX = Math.max(...bounds.map(b => b.minX));
           const allowedMaxX = Math.min(...bounds.map(b => b.maxX));
           const allowedMinZ = Math.max(...bounds.map(b => b.minZ));
           const allowedMaxZ = Math.min(...bounds.map(b => b.maxZ));
           newX = clamp(newX, allowedMinX, allowedMaxX);
           newZ = clamp(newZ, allowedMinZ, allowedMaxZ);


          stackOffsets.forEach(({ group, dx, dz }) => {
            group.position.set(newX + dx, group.position.y, newZ + dz);
          });
         } else {
           const leadW = leadLoad.userData.loadW || 1;
           const leadD = leadLoad.userData.loadD || 1;
           newX = clamp(newX, leadW / 2, carL - leadW / 2);
           newZ = clamp(newZ, -carW / 2 + leadD / 2, carW / 2 - leadD / 2);
           leadLoad.position.set(newX, leadLoad.position.y, newZ);
         }

        if (onValidateDrag) {
          const validation = onValidateDrag(draggedLoadIdRef.current, newX, newZ);
          setDragValidation(validation);
        }
      }
    };
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

     const handleMouseUp = () => {
       if (!isDraggingRef.current || !draggedLoadIdRef.current) return;
       
       const load = loadMeshesRef.current.get(draggedLoadIdRef.current);
       if (load) {
         // Convert center coords → corner coords for the data model
         const loadW = load.userData.loadW || 1;
         const loadD = load.userData.loadD || 1;
         const cornerX = load.position.x - loadW / 2;
         const cornerZ = load.position.z - loadD / 2 + carW / 2;
         onMoveLoad(draggedLoadIdRef.current, cornerX, cornerZ);
       }
       
       isDraggingRef.current = false;
       draggedLoadIdRef.current = null;
       setIsDragging(false);
       setDraggedLoadId(null);
       setDragValidation(null);
       controlsRef.current!.enabled = true;
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
    let cancelled = false;

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

    const build = async () => {
      // Add new load meshes using realistic product models
      for (const load of loads) {
        if (cancelled) break;
        
        // Determine load type for realistic model
        let loadType = load.loadType || load.shape || 'box';
        const nameLower = load.name.toLowerCase();
        if (!load.shape) {
          if (nameLower.includes('paper') || nameLower.includes('roll')) loadType = 'paper_roll';
          else if (nameLower.includes('pallet')) loadType = 'pallet';
          else if (nameLower.includes('coil')) loadType = 'coil';
          else if (nameLower.includes('carton') || nameLower.includes('box')) loadType = 'carton';
          else if (nameLower.includes('drum') || nameLower.includes('barrel')) loadType = 'drum';
          else if (nameLower.includes('bag') || nameLower.includes('sack')) loadType = 'bag';
          else if (nameLower.includes('pipe') || nameLower.includes('tube')) loadType = 'pipe';
          else if (nameLower.includes('lumber') || nameLower.includes('wood')) loadType = 'lumber';
          else if (nameLower.includes('crate')) loadType = 'carton';
        }
        
         const loadGroup = await createLoadModelAsync(loadType, load.w, load.h, load.d, load.color, {
            materialType: load.materialType,
            textureUrl: load.textureUrl,
            modelUrl: load.modelUrl,
            orientationLabel: load.orientation,
            orientation: {
              x: (load.orientation ?? 'horizontal') === 'horizontal' ? 0 : Math.PI / 2,
              y: load.rotationY ?? 0,
              z: 0,
            },
          });
         if (cancelled) break;
         
         // Position the load group (corner coords from backend → center for THREE.js)
         // Backend x,y,z is the front-bottom-left corner.
         // X: Front is 0, extends to carL. Load center is x + w/2.
         // Y: Floor is platH. Load center is platH + y + h/2.
         // Z: Left edge is -carW/2. Load center is -carW/2 + z + d/2.
         loadGroup.position.set(
           load.x + load.w / 2,
           platH + load.y + load.h / 2,
           -carW / 2 + load.z + load.d / 2
         );
        
        // Store dimensions and stack info for drag/boundary logic
        loadGroup.userData.loadId = load.id;
        loadGroup.userData.loadW = load.w;
        loadGroup.userData.loadH = load.h;
        loadGroup.userData.loadD = load.d;
        loadGroup.userData.stackGroup = load.stackGroup || load.id;
        
        // Enable shadows for all children
        loadGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Selection/violation overlay
        if (selectedLoad === load.id) {
          const boundingBox = new THREE.Box3().setFromObject(loadGroup);
          const size = new THREE.Vector3();
          boundingBox.getSize(size);
          const overlayGeometry = new THREE.BoxGeometry(size.x * 1.05, size.y * 1.05, size.z * 1.05);
          const overlayMaterial = new THREE.MeshStandardMaterial({
            color: '#63b3ed', emissive: '#3182ce', emissiveIntensity: 0.5,
            transparent: true, opacity: 0.25, wireframe: true
          });
          const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
          overlay.userData.isOverlay = true;
          loadGroup.add(overlay);
        } else if (load.hasViolation) {
          const boundingBox = new THREE.Box3().setFromObject(loadGroup);
          const size = new THREE.Vector3();
          boundingBox.getSize(size);
          const overlayGeometry = new THREE.BoxGeometry(size.x * 1.05, size.y * 1.05, size.z * 1.05);
          const overlayMaterial = new THREE.MeshStandardMaterial({
            color: '#fc8181', emissive: '#e53e3e', emissiveIntensity: 0.6,
            transparent: true, opacity: 0.3, wireframe: true
          });
          const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
          overlay.userData.isOverlay = true;
          loadGroup.add(overlay);
        }
        
        scene.add(loadGroup);
        loadMeshesRef.current.set(load.id, loadGroup as any);
      }
    };
    void build();

    return () => {
      cancelled = true;
    };
  }, [loads, isInitialized]);

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
      cogSphere.position.set(cogPosition.x, platH + cogPosition.y + 0.3, cogPosition.z - carW / 2);
    }
  }, [cogPosition, isInitialized]);

  // Update securements when the prop changes
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;
    const scene = sceneRef.current;

    if (!securements || securements.length === 0) {
      if (securementsGroupRef.current) {
        scene.remove(securementsGroupRef.current);
        securementsGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
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
        securementsGroupRef.current = null;
      }
      return;
    }

    if (securementsGroupRef.current) {
      updateSecurementGroup(securementsGroupRef.current, securements);
    } else {
      const securementGroup = createSecurementGroup(securements);
      securementsGroupRef.current = securementGroup;
      scene.add(securementGroup);
    }
  }, [securements, isInitialized]);

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
