// import Scene from "./Scene/index";
import copperRenderer from "./Renderer/copperRenderer";
import { setHDRFilePath } from "./lib/environment/index";
import copperScene from "./Scene/copperScene";
import { CameraViewPoint } from "./Controls/copperControls";

console.log(
  "%cMedtech Heart Plugin %cBeta:v1.4.5",
  "padding: 3px;color:white; background:#023047",
  "padding: 3px;color:white; background:#219EBC"
);

export { copperRenderer, setHDRFilePath, copperScene, CameraViewPoint };
