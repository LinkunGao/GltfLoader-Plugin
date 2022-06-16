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
import copperRendererOnDemond from "./Renderer/copperRendererOnDemond";
import copperSceneOnDemond from "./Scene/copperSceneOnDemond";
import copperMSceneRenderer from "./Renderer/copperMSceneRenderer";

import copperMScene from "./Scene/copperMScene";
import "./css/style.css";

console.log(
  "%cMedtech Heart Plugin %cBeta:v1.7.1",
  "padding: 3px;color:white; background:#023047",
  "padding: 3px;color:white; background:#219EBC"
);

export {
  copperRenderer,
  copperRendererOnDemond,
  copperMSceneRenderer,
  setHDRFilePath,
  addLabelToScene,
  convert3DPostoScreenPos,
  convertScreenPosto3DPos,
  addBoxHelper,
  fullScreenListenner,
  copperScene,
  copperSceneOnDemond,
  copperMScene,
  CameraViewPoint,
};

export type { positionType, screenPosType, optsType };
