// import Scene from "./Scene/index";
import copperRenderer from "./Renderer/copperRenderer";
import { setHDRFilePath } from "./lib/environment/index";
import copperScene from "./Scene/copperScene";
import { CameraViewPoint } from "./Controls/copperControls";
import {
  addLabelToScene,
  positionType,
  screenPosType,
  convert3DPostoScreenPos,
  convertScreenPosto3DPos,
} from "./Utils/add3DLabel";
import { addBoxHelper, optsType } from "./Loader/copperNrrdLoader";
import { fullScreenListenner } from "./Utils/utils";

console.log(
  "%cMedtech Heart Plugin %cBeta:v1.5.3",
  "padding: 3px;color:white; background:#023047",
  "padding: 3px;color:white; background:#219EBC"
);

export {
  copperRenderer,
  setHDRFilePath,
  addLabelToScene,
  convert3DPostoScreenPos,
  convertScreenPosto3DPos,
  addBoxHelper,
  fullScreenListenner,
  copperScene,
  CameraViewPoint,
};

export type { positionType, screenPosType, optsType };
