import * as THREE from "three";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader";
import copperScene from "../Scene/copperScene";
import { VolumeRenderShader1 } from "three/examples/jsm/shaders/VolumeShader";
import cm_gray from "../css/images/cm_gray.png";
import cm_viridis from "../css/images/cm_viridis.png";
import { GUI } from "dat.gui";
import { nrrdMeshesType } from "../types/types";

let cube: THREE.Mesh;
let gui: GUI;

export interface optsType {
  openGui: boolean;
  container?: HTMLDivElement;
}

export function copperNrrdLoader(
  url: string,
  scene: THREE.Scene,
  callback?: (volume: any, nrrdMeshes: nrrdMeshesType, gui?: GUI) => void,
  opts?: optsType
) {
  const loader = new NRRDLoader();
  let nrrdMeshes: nrrdMeshesType;

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

    nrrdMeshes = {
      x: sliceX.mesh,
      y: sliceY.mesh,
      z: sliceZ.mesh,
      cube,
    };
    // nrrdMeshes.x = sliceX.mesh;
    // nrrdMeshes.y = sliceY.mesh;
    // nrrdMeshes.z = sliceZ.mesh;

    // scene.add(sliceZ.mesh);
    // scene.add(sliceY.mesh);
    // scene.add(sliceX.mesh);
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
    if (gui) {
      callback && callback(volume, nrrdMeshes, gui);
    } else {
      callback && callback(volume, nrrdMeshes);
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
