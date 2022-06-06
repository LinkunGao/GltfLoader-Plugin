import * as THREE from "three";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader";
import copperScene from "../Scene/copperScene";
import { GUI } from "dat.gui";

let cube: THREE.Mesh;
let gui: GUI;

export interface optsType {
  openGui: boolean;
  container?: HTMLDivElement;
}

export function copperNrrdLoader(
  url: string,
  scene: THREE.Scene,
  callback?: (volume: any) => void,
  opts?: optsType
) {
  const loader = new NRRDLoader();

  loader.load(url, function (volume: any) {
    configGui(opts);

    const geometry = new THREE.BoxGeometry(
      volume.xLength,
      volume.yLength,
      volume.zLength
    );
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    cube = new THREE.Mesh(geometry, material);
    cube.visible = false;

    scene.add(cube);

    const sliceZ = volume.extractSlice(
      "z",
      Math.floor(volume.RASDimensions[2] / 4)
    );
    const sliceY = volume.extractSlice(
      "y",
      Math.floor(volume.RASDimensions[1] / 2)
    );
    //x plane
    const sliceX = volume.extractSlice(
      "x",
      Math.floor(volume.RASDimensions[0] / 2)
    );
    // sliceY.geometry.parameters.width = 300;
    // sliceY.geometry.boundingSphere.radius = 194.94330668752295;
    console.log(sliceX);
    console.log(sliceY);
    scene.add(sliceZ.mesh);
    scene.add(sliceY.mesh);
    scene.add(sliceX.mesh);
    if (gui) {
      gui
        .add(sliceX, "index", 0, volume.RASDimensions[0], 1)
        .name("indexX")
        .onChange(function () {
          sliceX.repaint.call(sliceX);
        });
      gui
        .add(sliceY, "index", 0, volume.RASDimensions[1], 1)
        .name("indexY")
        .onChange(function () {
          sliceY.repaint.call(sliceY);
        });
      gui
        .add(sliceZ, "index", 0, volume.RASDimensions[2], 1)
        .name("indexZ")
        .onChange(function () {
          sliceZ.repaint.call(sliceZ);
        });

      gui
        .add(volume, "lowerThreshold", volume.min, volume.max, 1)
        .name("Lower Threshold")
        .onChange(function () {
          volume.repaintAllSlices();
        });
      gui
        .add(volume, "upperThreshold", volume.min, volume.max, 1)
        .name("Upper Threshold")
        .onChange(function () {
          volume.repaintAllSlices();
        });
      gui
        .add(volume, "windowLow", volume.min, volume.max, 1)
        .name("Window Low")
        .onChange(function () {
          volume.repaintAllSlices();
        });
      gui
        .add(volume, "windowHigh", volume.min, volume.max, 1)
        .name("Window High")
        .onChange(function () {
          volume.repaintAllSlices();
        });
    }
    callback && callback(volume);
  });
}

export function addBoxHelper(
  scene: copperScene,
  volume: any,
  boxCube?: THREE.Object3D<THREE.Event>
) {
  let obj: THREE.Object3D<THREE.Event>;
  boxCube ? (obj = boxCube) : (obj = cube);

  const boxHelper = new THREE.BoxHelper(obj);
  scene.addObject(boxHelper);
  boxHelper.applyMatrix4(volume.matrix);
}

function configGui(opts?: optsType) {
  if (opts && opts.openGui) {
    if (opts.container) {
      gui = new GUI({
        width: 260,
        autoPlace: false,
      });

      opts.container.appendChild(gui.domElement);
    } else {
      gui = new GUI();
      gui.closed = true;
    }
  }
}
