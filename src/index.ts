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
import copperRendererOnDemond from "./Renderer/copperRendererOnDemond";
import copperSceneOnDemond from "./Scene/copperSceneOnDemond";

console.log(
  "%cMedtech Heart Plugin %cBeta:v1.6.0",
  "padding: 3px;color:white; background:#023047",
  "padding: 3px;color:white; background:#219EBC"
);

export {
  copperRenderer,
  copperRendererOnDemond,
  setHDRFilePath,
  addLabelToScene,
  convert3DPostoScreenPos,
  convertScreenPosto3DPos,
  addBoxHelper,
  fullScreenListenner,
  copperScene,
  copperSceneOnDemond,
  CameraViewPoint,
};

export type { positionType, screenPosType, optsType };
