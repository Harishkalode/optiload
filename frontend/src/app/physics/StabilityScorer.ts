import * as CANNON from 'cannon-es';

export interface StabilityResult {
  item_id: string;
  stable: boolean;
  risk_score: number;
  contact_area: number;
  tilt_angle: number;
  com_offset: number;
}

export class StabilityScorer {
  score(body: CANNON.Body, dims: { w: number; h: number; d: number }, platH: number): StabilityResult {
    const tiltAngle = Math.acos(Math.min(1, Math.abs(body.quaternion.w))) * 2;
    const comOffset = Math.sqrt(body.position.x ** 2 + body.position.z ** 2);
    const isOnGround = body.position.y < platH + dims.h / 2 + 0.05;
    const isSleeping = body.sleepState === CANNON.Body.SLEEPING;
    const speed = body.velocity.length();

    let risk = 0;
    risk += tiltAngle > 0.5 ? 40 : tiltAngle > 0.2 ? 20 : tiltAngle > 0.1 ? 10 : 0;
    risk += !isOnGround ? 25 : 0;
    risk += !isSleeping && speed > 0.01 ? 15 : 0;
    risk += comOffset > 2 ? 10 : 0;
    risk = Math.min(100, risk);

    return {
      item_id: body.id.toString(),
      stable: risk < 30,
      risk_score: risk,
      contact_area: isOnGround ? dims.w * dims.d : 0,
      tilt_angle: tiltAngle,
      com_offset: comOffset,
    };
  }

  scoreAll(
    bodies: Map<string, CANNON.Body>,
    dims: Map<string, { w: number; h: number; d: number }>,
    platH: number,
  ): StabilityResult[] {
    const results: StabilityResult[] = [];
    bodies.forEach((body, id) => {
      const d = dims.get(id);
      if (d) results.push(this.score(body, d, platH));
    });
    return results;
  }
}
