export interface VehicleParameters {
  length: number;
  width: number;
  height: number;
  loadLimit: number;
}

export interface Vehicle {
  id: string;
  name: string;
  type: string;
  parameters: VehicleParameters;
  aarCompliant: boolean;
  validationErrors: string[];
}
