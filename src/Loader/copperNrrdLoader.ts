import * as THREE from "three";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader";
import copperScene from "../Scene/copperScene";
import { VolumeRenderShader1 } from "three/examples/jsm/shaders/VolumeShader";
import cm_gray from "../css/images/cm_gray.png";
import cm_viridis from "../css/images/cm_viridis.png";
import { GUI } from "dat.gui";
import {
  nrrdMeshesType,
  nrrdSliceType,
  nrrdDragImageOptType,
} from "../types/types";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import copperMScene from "../Scene/copperMScene";

let cube: THREE.Mesh;
let gui: GUI;

let Is_Shift_Pressed: boolean = false;
let Is_Control_Enabled: boolean = true;
let Is_Draw: boolean = false;
const CircleGeometry = new THREE.RingGeometry(5, 6, 30);
const CircleMaterial = new THREE.MeshBasicMaterial({
  transparent: true,
  side: THREE.DoubleSide,
});

export interface optsType {
  openGui: boolean;
  container?: HTMLDivElement;
}

export function copperNrrdLoader(
  url: string,
  scene: THREE.Scene,
  callback?: (
    volume: any,
    nrrdMeshes: nrrdMeshesType,
    nrrdSlices: nrrdSliceType,
    gui?: GUI
  ) => void,
  opts?: optsType
) {
  const loader = new NRRDLoader();
  let nrrdMeshes: nrrdMeshesType;
  let nrrdSlices: nrrdSliceType;

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

    // scene.add(cube);

    volume.axisOrder = ["x", "y", "z"];

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

    nrrdMeshes = {
      x: sliceX.mesh,
      y: sliceY.mesh,
      z: sliceZ.mesh,
    };
    nrrdSlices = {
      x: sliceX,
      y: sliceY,
      z: sliceZ,
    };

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
        .add(sliceZ, "index", 0, volume.RASDimensions[2] - 1, 1)
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
    if (gui) {
      callback && callback(volume, nrrdMeshes, nrrdSlices, gui);
    } else {
      callback && callback(volume, nrrdMeshes, nrrdSlices);
    }
  });
}

export function copperNrrdLoader1(
  url: string,
  scene: THREE.Scene,
  callback?: (volume: any, gui?: GUI) => void
) {
  const volconfig = {
    clim1: 0,
    clim2: 1,
    renderStyle: "iso",
    isothreshold: -0.15,
    colormap: "viridis",
  };
  // const volconfig = {
  //   clim1: 10,
  //   clim2: 10,
  //   renderStyle: "iso",
  //   isothreshold: -0.15,
  //   colormap: "viridis",
  // };

  let cmtextures: { [key: string]: any };
  let material: THREE.ShaderMaterial;

  let mesh: THREE.Mesh;

  new NRRDLoader().load(url, function (volume: any) {
    volume.axisOrder = ["x", "y", "z"];

    const is_Int16Array = volume.data.byteLength / volume.data.length === 2;
    volume.lowerThreshold = 19;
    volume.upperThreshold = 498;
    volume.windowLow = 0;
    volume.windowHigh = 354;

    let data = is_Int16Array
      ? int16ToFloat32(volume.data, 0, volume.data.length)
      : volume.data;

    const texture = new THREE.Data3DTexture(
      data as any,
      volume.xLength,
      volume.yLength,
      volume.zLength
    );

    texture.format = THREE.RedFormat;
    texture.type = THREE.FloatType;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    // colormap texture
    cmtextures = {
      viridis: new THREE.TextureLoader().load(cm_viridis),
      gray: new THREE.TextureLoader().load(cm_gray),
    };

    // Material
    const shader = VolumeRenderShader1;

    const uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    uniforms["u_data"].value = texture;
    uniforms["u_size"].value.set(
      volume.xLength,
      volume.yLength,
      volume.zLength
    );

    uniforms["u_clim"].value.set(volconfig.clim1, volconfig.clim2);
    uniforms["u_renderstyle"].value = volconfig.renderStyle === "mip" ? 0 : 1; // mip 0, iso 1
    uniforms["u_renderthreshold"].value = volconfig.isothreshold; // for iso render style
    uniforms["u_cmdata"].value = cmtextures[volconfig.colormap];

    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      side: THREE.BackSide, // The volume shader uses the backface as its "reference point"
    });

    // Mesh
    const geometry = new THREE.BoxGeometry(
      volume.xLength,
      volume.yLength,
      volume.zLength
    );
    geometry.translate(
      volume.xLength / 2 - 0.5,
      volume.yLength / 2 - 0.5,
      volume.zLength / 2 - 0.5
    );
    mesh = new THREE.Mesh(geometry, material);

    const boxHelper = new THREE.BoxHelper(mesh);
    scene.add(boxHelper);
    boxHelper.applyMatrix4((volume as any).matrix);

    scene.add(mesh);

    const gui = new GUI();
    gui.add(volconfig, "clim1", -1, 1, 0.01).onChange(updateUniforms);
    gui.add(volconfig, "clim2", -1, 1, 0.01).onChange(updateUniforms);
    // gui.add(volconfig, "clim1", -50, 400, 1).onChange(updateUniforms);
    // gui.add(volconfig, "clim2", -50, 400, 1).onChange(updateUniforms);
    gui
      .add(volconfig, "colormap", { gray: "gray", viridis: "viridis" })
      .onChange(updateUniforms);
    gui
      .add(volconfig, "renderStyle", { mip: "mip", iso: "iso" })
      .onChange(updateUniforms);
    gui.add(volconfig, "isothreshold", -1, 1, 0.01).onChange(updateUniforms);

    function updateUniforms() {
      material.uniforms["u_clim"].value.set(volconfig.clim1, volconfig.clim2);
      material.uniforms["u_renderstyle"].value =
        volconfig.renderStyle == "mip" ? 0 : 1; // 0: MIP, 1: ISO
      material.uniforms["u_renderthreshold"].value = volconfig.isothreshold; // For ISO renderstyle
      material.uniforms["u_cmdata"].value = cmtextures[volconfig.colormap];
    }

    callback && callback(volume, gui);
  });
}

export function dragImageWithMode(
  container: HTMLDivElement,
  controls: TrackballControls,
  slice: any,
  opts?: nrrdDragImageOptType
) {
  let move: number;
  let y: number;
  let h: number = container.offsetHeight;
  let max: number = 0;
  let min: number = 0;
  let showNumberDiv: HTMLDivElement;
  let handleOnMouseUp: (ev: MouseEvent) => void;
  let handleOnMouseDown: (ev: MouseEvent) => void;
  let handleOnMouseMove: (ev: MouseEvent) => void;

  container.tabIndex = 1;

  switch (slice.axis) {
    case "x":
      max = slice.volume.RASDimensions[0];
      break;
    case "y":
      max = slice.volume.RASDimensions[1];
      break;
    case "z":
      max = slice.volume.RASDimensions[2] - 1;
      break;
  }

  if (opts?.showNumber) {
    showNumberDiv = createShowSliceNumberDiv();
    showNumberDiv.innerHTML = `Slice number: ${slice.index}/${max}`;
    container.appendChild(showNumberDiv);
  }

  container.addEventListener("keydown", (ev: KeyboardEvent) => {
    if (ev.key === "Shift") {
      controls.enabled = false;
      container.style.cursor = "pointer";
      Is_Shift_Pressed = true;
      container.addEventListener("mousedown", handleOnMouseDown, false);
      container.addEventListener("mouseup", handleOnMouseUp, false);
    }
  });

  container.addEventListener("keyup", (ev: KeyboardEvent) => {
    if (ev.key === "Shift") {
      if (!Is_Draw) {
        controls.enabled = true;
      }
      container.style.cursor = "";
      Is_Shift_Pressed = false;
      container.removeEventListener("mousedown", handleOnMouseDown, false);
      container.removeEventListener("mouseup", handleOnMouseUp, false);
      container.removeEventListener("mousemove", handleOnMouseMove, false);
    }
  });

  if (opts?.mode === "mode0") {
    handleOnMouseDown = (ev: MouseEvent) => {
      y = ev.offsetY / h;
    };
    handleOnMouseUp = (ev: MouseEvent) => {
      if (y - ev.offsetY / h >= 0) {
        move = Math.ceil((y - ev.offsetY / h) * 20);
      } else {
        move = Math.floor((y - ev.offsetY / h) * 20);
      }

      let newIndex = slice.index + move;
      if (newIndex > max) {
        newIndex = max;
      } else if (newIndex < min) {
        newIndex = min;
      } else {
        slice.index = newIndex;
        slice.repaint.call(slice);
      }
      if (opts?.showNumber) {
        showNumberDiv.innerHTML = `Slice number: ${newIndex}/${max}`;
      }
    };
  } else {
    let oldIndex: number;
    handleOnMouseDown = (ev: MouseEvent) => {
      y = ev.offsetY / h;
      container.addEventListener("mousemove", handleOnMouseMove, false);
      oldIndex = slice.index;
    };
    handleOnMouseMove = (ev: MouseEvent) => {
      if (y - ev.offsetY / h >= 0) {
        move = Math.ceil((y - ev.offsetY / h) * 20);
      } else {
        move = Math.floor((y - ev.offsetY / h) * 20);
      }
      let newIndex = oldIndex + move;
      if (newIndex != oldIndex) {
        if (newIndex > max) {
          newIndex = max;
        } else if (newIndex < min) {
          newIndex = min;
        } else {
          slice.index = newIndex;
          slice.repaint.call(slice);
        }
        if (opts?.showNumber) {
          showNumberDiv.innerHTML = `Slice number: ${newIndex}/${max}`;
        }
      }
    };
    handleOnMouseUp = (ev: MouseEvent) => {
      container.removeEventListener("mousemove", handleOnMouseMove, false);
    };
  }
}

export function getWholeSlices(
  nrrdSlices: nrrdSliceType,
  scene: THREE.Scene,
  gui: GUI,
  controls: TrackballControls
) {
  let i = 0;
  let timeX = nrrdSlices.x.volume.RASDimensions[0];
  let timeY = nrrdSlices.y.volume.RASDimensions[1];
  let timeZ = nrrdSlices.z.volume.RASDimensions[2];
  let slicesX: Array<THREE.Mesh> = [];
  let sliceGroup: THREE.Group = new THREE.Group();

  const volume = nrrdSlices.x.volume;
  volume.lowerThreshold = 19;
  volume.upperThreshold = 498;
  volume.windowLow = 0;
  volume.windowHigh = 354;
  for (let i = 0; i < timeZ; i++) {
    const slicez = volume.extractSlice("z", i);
    slicez.mesh.index = i;
    sliceGroup.add(slicez.mesh);

    slicesX.push(slicez.mesh);
  }
  for (let i = 0; i < timeX; i++) {
    const slicex = volume.extractSlice("x", i);

    sliceGroup.add(slicex.mesh);
  }
  for (let i = 0; i < timeY; i++) {
    const slicey = volume.extractSlice("y", i);
    sliceGroup.add(slicey.mesh);
  }

  scene.add(sliceGroup);

  const zz = {
    indexX: 0,
  };

  let a = 0;
  gui
    .add(zz, "indexX", 0, 50, 1)
    .name("indexZ")
    .onChange((index) => {
      controls.enabled = false;

      console.log(index);
      // if (index < a) {
      //   a = index;
      //   slicesX[a].visible = true;
      // } else if (index >= a) {
      //   slicesX[a].visible = false;
      //   a = index;
      //   slicesX[a].visible = false;
      // }

      // if (slicesX[index]) {
      //   controls.enabled = false;
      //   console.log(slicesX[index]);
      //   slicesX[index].visible = false;
      //   // ? (slicesX[index].visible = false)
      //   // : (slicesX[index].visible = true);
      // }
    });
  gui.add(controls, "enabled").name("controls");
}

export function draw(
  container: HTMLDivElement,
  controls: TrackballControls,
  sceneIn: copperMScene,
  slice: any,
  gui: GUI,
  guiContainer: HTMLDivElement
) {
  let circles: THREE.Mesh[] = [];
  let modeFolder: GUI;
  let modeState: string = "mode0";
  const state = {
    mode: "mode0",
    undo: function () {
      undoLastDrawing();
    },
    clearAll: function () {
      removeAllDrawing();
    },
    resetView: function () {
      sceneIn.resetView();
    },
  };
  let handleOnMouseClick: (ev: MouseEvent) => void;
  let defaultOnMouseClick: (ev: MouseEvent) => void;
  let mode1OnMouseClick: (ev: MouseEvent) => void;
  let mode2OnMouseClick: (ev: MouseEvent) => void;
  /**
   * GUI
   */

  gui
    .add(state, "mode", { mode0: "mode0", mode1: "mode1", mode2: "mode2" })
    .onChange((mode) => {
      modeState = mode;
      removeModeChilden();
      container.removeEventListener("click", handleOnMouseClick, false);
      if (mode === "mode0") {
        addMode1();
        if (!Is_Control_Enabled) {
          mode0Controller();
        }
      } else if (mode === "mode1" && !Is_Control_Enabled) {
        mode1Controller();
      }
    });

  gui.add(state, "undo");
  gui.add(state, "clearAll");
  gui.add(state, "resetView");

  modeFolder = gui.addFolder("Mode Parameters");

  const stateMode1 = {
    color: "#47FF63",
    radius: 5,
  };
  function addMode1() {
    modeFolder
      .add(stateMode1, "radius")
      .min(1)
      .max(9)
      .step(0.01)
      .onChange(regenerateGeometry);
    modeFolder.addColor(stateMode1, "color");
  }
  addMode1();

  /***
   * mode controls
   */

  function mode0Controller() {
    handleOnMouseClick = defaultOnMouseClick;
    container.addEventListener("click", handleOnMouseClick, false);
  }
  function mode1Controller() {
    container.removeEventListener("click", handleOnMouseClick, false);
    handleOnMouseClick = (ev: MouseEvent) => {
      console.log("mode1");
    };
    container.addEventListener("click", handleOnMouseClick, false);
  }
  /**
   * mode1
   * */
  defaultOnMouseClick = handleOnMouseClick = (ev: MouseEvent) => {
    // ev.stopPropagation();
    if (!Is_Shift_Pressed) {
      const x = ev.offsetX;
      const y = ev.offsetY;
      let worldPos: THREE.Vector3 = new THREE.Vector3();
      const { intersectedObject, intersects } = sceneIn.pickSpecifiedModel(
        slice.mesh,
        { x, y }
      );
      if (intersects.length > 0) {
        const p = intersects[0].point;
        worldPos.copy(p);
        const circle = createRingCircle(stateMode1.color);
        circle.position.set(worldPos.x, worldPos.y, worldPos.z + 0.1);
        circles.push(circle);
        sceneIn.scene.add(circle);
      }
    }
  };
  container.addEventListener("keypress", (ev: KeyboardEvent) => {
    if (ev.key === "d") {
      Is_Control_Enabled = !Is_Control_Enabled;
      controls.enabled = Is_Control_Enabled;
      sceneIn.changedControlsState(Is_Control_Enabled);
      if (!Is_Draw) {
        Is_Draw = true;
        switch (modeState) {
          case "mode0":
            mode0Controller();
            break;
          case "mode1":
            mode1Controller();
            break;
          default:
            mode0Controller();
            break;
        }
      } else {
        Is_Draw = false;
        container.removeEventListener("click", handleOnMouseClick, false);
      }
    }
  });

  function undoLastDrawing() {
    const old = circles.pop();
    old?.geometry.dispose();
    !!old && sceneIn.scene.remove(old as THREE.Mesh);
  }

  function removeAllDrawing() {
    circles.forEach((mesh) => {
      !!mesh && sceneIn.scene.remove(mesh);
    });
    circles = [];
  }

  function removeModeChilden() {
    const subControllers = modeFolder.__controllers;
    subControllers.forEach((c) => {
      setTimeout(() => {
        modeFolder.remove(c);
      }, 100);
    });
  }

  function regenerateGeometry(radius: number) {
    const innerRadius = radius;
    const outerRadius = radius + 1;
    const newCircleGeometry = new THREE.RingGeometry(
      innerRadius,
      outerRadius,
      30
    );
    circles.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.geometry = newCircleGeometry;
    });
  }
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

function createShowSliceNumberDiv() {
  const sliceNumberDiv = document.createElement("div");
  sliceNumberDiv.className = "copper3d_sliceNumber";
  sliceNumberDiv.style.position = "absolute";
  sliceNumberDiv.style.zIndex = "100";
  sliceNumberDiv.style.top = "20px";
  sliceNumberDiv.style.left = "100px";

  return sliceNumberDiv;
}

function int16ToFloat32(
  inputArray: Int16Array,
  startIndex: number,
  length: number
): Float32Array {
  var output = new Float32Array(inputArray.length - startIndex);
  for (var i = startIndex; i < length; i++) {
    var int = inputArray[i];
    // If the high bit is on, then it is a negative number, and actually counts backwards.
    var float = int >= 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
    output[i] = float;
  }
  return output;
}

/**
 *
 * @param {number} r - Radius
 * @param {string} color - e.g., 0xffffff
 * @returns {object} - A Circle mesh
 */
function createCircle(r: number, color: string) {
  const geometry = new THREE.CircleGeometry(r * 1.6, 30);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
}

/**
 *
 * @param {string} color  - e.g., 0xffffff
 * @returns {object} - A ring circle mesh
 */
function createRingCircle(color: string) {
  CircleMaterial.color = new THREE.Color(color);
  return new THREE.Mesh(CircleGeometry, CircleMaterial);
}
