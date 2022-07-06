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

let cube: THREE.Mesh;
let gui: GUI;

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

    // if (opts?.rotate?.sliceX?.direction === "y") {
    //   sliceX.geometry.rotateY(opts?.rotate?.sliceX?.angle);
    //   // slice.rotation.y = rotateInfo.angle;
    // }

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
    isothreshold: 0.15,
    colormap: "viridis",
  };

  let cmtextures: { [key: string]: any };
  let material: THREE.ShaderMaterial;

  let mesh: THREE.Mesh;

  new NRRDLoader().load(url, function (volume) {
    const texture = new THREE.Data3DTexture(
      volume.data as any,
      volume.xLength,
      volume.yLength,
      volume.zLength
    );
    volume.axisOrder = ["x", "y", "z"];
    texture.format = THREE.RedFormat;
    texture.type = THREE.FloatType;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    // colormap texture
    cmtextures = {
      viridis: new THREE.TextureLoader().load(cm_viridis),
      gary: new THREE.TextureLoader().load(cm_gray),
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
    gui.add(volconfig, "clim1", 0, 1, 0.01).onChange(updateUniforms);
    gui.add(volconfig, "clim2", 0, 1, 0.01).onChange(updateUniforms);
    gui
      .add(volconfig, "colormap", { gray: "gray", viridis: "viridis" })
      .onChange(updateUniforms);
    gui
      .add(volconfig, "renderStyle", { mip: "mip", iso: "iso" })
      .onChange(updateUniforms);
    gui.add(volconfig, "isothreshold", 0, 1, 0.01).onChange(updateUniforms);

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

  container.onkeydown = (ev: KeyboardEvent) => {
    if (ev.key === "Shift") {
      controls.enabled = false;
      container.style.cursor = "pointer";
      container.addEventListener("mousedown", handleOnMouseDown, false);
      container.addEventListener("mouseup", handleOnMouseUp, false);
    }
  };
  container.onkeyup = (ev: KeyboardEvent) => {
    if (ev.key === "Shift") {
      controls.enabled = true;
      container.style.cursor = "";
      container.removeEventListener("mousedown", handleOnMouseDown, false);
      container.removeEventListener("mouseup", handleOnMouseUp, false);
    }
  };

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
      container.addEventListener("mousemove", handleOnMouseMove);
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
      container.removeEventListener("mousemove", handleOnMouseMove);
    };
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
