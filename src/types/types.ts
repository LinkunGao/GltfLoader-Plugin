import copperScene from "../Scene/copperScene";
import baseScene from "../Scene/baseScene";

interface SceneMapType {
  [key: string]: copperScene | baseScene;
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

export type {
  SceneMapType,
  optType,
  stateType,
  modelVisualisationDataType,
  preRenderCallbackFunctionType,
  baseStateType,
};
