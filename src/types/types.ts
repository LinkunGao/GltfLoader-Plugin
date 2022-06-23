import copperScene from "../Scene/copperScene";
import baseScene from "../Scene/baseScene";
import copperMScene from "../Scene/copperMScene";

interface SceneMapType {
  [key: string]: copperScene | baseScene | copperMScene;
}
interface optType {
  guiOpen: boolean;
  [key: string]: string | boolean;
}
interface stateType {
  playbackSpeed: number;
  wireframe: boolean;
  skeleton: boolean;
  grid: boolean;
  // Lights
  addLights: boolean;
  exposure: number;
  ambientIntensity: number;
  ambientColor: number;
  directIntensity: number;
  directColor: number;
  bgColor1: string;
  bgColor2: string;
  [key: string]: string | number | boolean | {};
}

interface modelVisualisationDataType {
  name: string;
  visible: boolean;
  mesh: THREE.Mesh;
  // [key: string]: THREE.Mesh;
}

interface preRenderCallbackFunctionType {
  id: number;
  callback: Function;
}

interface baseStateType {
  [key: string]: string | number | boolean | {};
}

export interface SensorDecodedValue_kiwrious {
  type: string;
  label: string;
  value: any;
}
export interface SensorReadResult_kiwrious {
  sensorType: string;
  decodedValues: SensorDecodedValue_kiwrious[];
}
export interface HeartRateResult_kiwrious {
  status: string;
  value?: number;
}

export type {
  SceneMapType,
  optType,
  stateType,
  modelVisualisationDataType,
  preRenderCallbackFunctionType,
  baseStateType,
};
