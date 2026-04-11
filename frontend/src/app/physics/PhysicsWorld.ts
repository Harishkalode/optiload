import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export interface PhysicsConfig {
  gravity: [number, number, number];
  sleepSpeedLimit: number;
  sleepTimeLimit: number;
}

export class PhysicsWorld {
  world: CANNON.World;
  bodies: Map<string, CANNON.Body> = new Map();
  debugMeshes: Map<string, THREE.Mesh> = new Map();
  enabled = true;
  debugMode = false;
  private scene: THREE.Scene | null = null;

  constructor(config: PhysicsConfig, scene?: THREE.Scene) {
    this.scene = scene || null;
    this.world = new CANNON.World();
    this.world.gravity.set(...config.gravity);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.solver.iterations = 10;
    this.world.allowSleep = true;
    this.world.sleepSpeedLimit = config.sleepSpeedLimit;
    this.world.sleepTimeLimit = config.sleepTimeLimit;

    const defaultMat = new CANNON.Material('default');
    const defaultContactMat = new CANNON.ContactMaterial(defaultMat, defaultMat, {
      friction: 0.5,
      restitution: 0.1,
    });
    this.world.addContactMaterial(defaultContactMat);
  }

  createContainer(length: number, width: number, platH: number, height: number) {
    const wallMat = new CANNON.Material('wall');
    const t = 0.05;

    const floor = new CANNON.Body({ mass: 0, material: wallMat });
    floor.addShape(new CANNON.Box(new CANNON.Vec3(length / 2, t, width / 2)),
      new CANNON.Vec3(length / 2, platH, width / 2));
    this.world.addBody(floor);

    const leftWall = new CANNON.Body({ mass: 0, material: wallMat });
    leftWall.addShape(new CANNON.Box(new CANNON.Vec3(length / 2, height / 2, t)),
      new CANNON.Vec3(length / 2, platH + height / 2, t));
    this.world.addBody(leftWall);

    const rightWall = new CANNON.Body({ mass: 0, material: wallMat });
    rightWall.addShape(new CANNON.Box(new CANNON.Vec3(length / 2, height / 2, t)),
      new CANNON.Vec3(length / 2, platH + height / 2, width - t));
    this.world.addBody(rightWall);

    const frontWall = new CANNON.Body({ mass: 0, material: wallMat });
    frontWall.addShape(new CANNON.Box(new CANNON.Vec3(t, height / 2, width / 2)),
      new CANNON.Vec3(t, platH + height / 2, width / 2));
    this.world.addBody(frontWall);

    const backWall = new CANNON.Body({ mass: 0, material: wallMat });
    backWall.addShape(new CANNON.Box(new CANNON.Vec3(t, height / 2, width / 2)),
      new CANNON.Vec3(length - t, platH + height / 2, width / 2));
    this.world.addBody(backWall);
  }

  createBody(id: string, type: string, dims: { w: number; h: number; d: number },
    pos: { x: number; y: number; z: number }, mass: number) {
    const shape = (type === 'cylinder' || type === 'paper_roll' || type === 'coil')
      ? new CANNON.Cylinder(dims.w / 2, dims.w / 2, dims.h, 16)
      : new CANNON.Box(new CANNON.Vec3(dims.w / 2, dims.h / 2, dims.d / 2));

    const body = new CANNON.Body({ mass, linearDamping: 0.3, angularDamping: 0.5 });
    body.addShape(shape);
    body.position.set(pos.x, pos.y, pos.z);
    body.sleep();
    this.world.addBody(body);
    this.bodies.set(id, body);

    if (this.debugMode && this.scene) {
      const geo = new THREE.BoxGeometry(dims.w, dims.h, dims.d);
      const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.4 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(body.position as any);
      mesh.quaternion.copy(body.quaternion as any);
      this.scene.add(mesh);
      this.debugMeshes.set(id, mesh);
    }

    return body;
  }

  step() {
    if (!this.enabled) return;
    this.world.step(1 / 60);
  }

  syncToMeshes(meshes: Map<string, THREE.Group>) {
    this.bodies.forEach((body, id) => {
      if (body.type === CANNON.Body.KINEMATIC) return;
      const mesh = meshes.get(id);
      if (mesh && body.sleepState === CANNON.Body.AWAKE) {
        mesh.position.copy(body.position as any);
        mesh.quaternion.copy(body.quaternion as any);
      }
      const debugMesh = this.debugMeshes.get(id);
      if (debugMesh) {
        debugMesh.position.copy(body.position as any);
        debugMesh.quaternion.copy(body.quaternion as any);
      }
    });
  }

  setBodyKinematic(id: string) {
    const body = this.bodies.get(id);
    if (body) { body.type = CANNON.Body.KINEMATIC; body.wakeUp(); }
  }

  setBodyDynamic(id: string) {
    const body = this.bodies.get(id);
    if (body) { body.type = CANNON.Body.DYNAMIC; }
  }

  setBodyPosition(id: string, pos: { x: number; y: number; z: number }) {
    const body = this.bodies.get(id);
    if (body) { body.position.set(pos.x, pos.y, pos.z); }
  }

  clear() {
    this.bodies.forEach((_, id) => this.removeBody(id));
  }

  removeBody(id: string) {
    const body = this.bodies.get(id);
    if (body) { this.world.removeBody(body); this.bodies.delete(id); }
    const debugMesh = this.debugMeshes.get(id);
    if (debugMesh && this.scene) { this.scene.remove(debugMesh); this.debugMeshes.delete(id); }
  }

  setDebugMode(enabled: boolean, scene?: THREE.Scene) {
    if (enabled && !this.debugMode) {
      this.scene = scene || this.scene;
      this.bodies.forEach((body, id) => {
        if (!this.debugMeshes.has(id) && this.scene) {
          const s = body.shapes[0];
          let geo: THREE.BufferGeometry;
          if (s instanceof CANNON.Box) {
            geo = new THREE.BoxGeometry(s.halfExtents.x * 2, s.halfExtents.y * 2, s.halfExtents.z * 2);
          } else {
            geo = new THREE.BoxGeometry(1, 1, 1);
          }
          const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.4 });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.copy(body.position as any);
          mesh.quaternion.copy(body.quaternion as any);
          this.scene.add(mesh);
          this.debugMeshes.set(id, mesh);
        }
      });
    } else if (!enabled && this.debugMode) {
      this.debugMeshes.forEach((mesh) => { if (this.scene) this.scene.remove(mesh); });
      this.debugMeshes.clear();
    }
    this.debugMode = enabled;
  }
}
