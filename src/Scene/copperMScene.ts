import * as THREE from "three";
import { GUI, GUIController } from "dat.gui";
import { Controls, CameraViewPoint } from "../Controls/copperControls";
import { createBackground, customMeshType } from "../lib/three-vignette";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { copperGltfLoader } from "../Loader/copperGltfLoader";
import { pickModelDefault } from "../Utils/raycaster";
import { copperNrrdLoader, optsType } from "../Loader/copperNrrdLoader";
import { isIOS } from "../Utils/utils";

const IS_IOS = isIOS();

export default class copperMScene {
  gui: GUI = new GUI();
  container: HTMLDivElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  sceneName: string = "";
  vignette: customMeshType;
  directionalLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  copperControl: Controls;
  viewPoint: CameraViewPoint = new CameraViewPoint();
  cameraPositionFlag = false;
  content: THREE.Group = new THREE.Group();
  isHalfed: boolean = false;
  controls: TrackballControls;
  private pickableObjects: THREE.Mesh[] = [];

  private color1: string = "#5454ad";
  private color2: string = "#18e5a7";
  private lights: any[] = [];

  constructor(container: HTMLDivElement, renderer: THREE.WebGLRenderer) {
    this.container = container;
    this.renderer = renderer;
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    this.ambientLight = new THREE.AmbientLight(0x202020, 1);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    this.vignette = createBackground({
      aspect: this.container.clientWidth / this.container.clientHeight,
      grainScale: IS_IOS ? 0 : 0.001,
      colors: [this.color1, this.color2],
    });
    this.vignette.name = "Vignette";
    this.vignette.renderOrder = -1;

    this.copperControl = new Controls(this.camera);
    this.controls = new TrackballControls(this.camera, container);
    this.init();
  }
  init() {
    this.copperControl.setCameraViewPoint();
    this.container.appendChild(this.gui.domElement);
  }

  loadGltf(url: string, callback?: (content: THREE.Group) => void) {
    const loader = copperGltfLoader(this.renderer);

    loader.load(
      url,
      (gltf: GLTF) => {
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());

        this.controls.maxDistance = size * 10;
        gltf.scene.position.x += gltf.scene.position.x - center.x;
        gltf.scene.position.y += gltf.scene.position.y - center.y;
        gltf.scene.position.z += gltf.scene.position.z - center.z;

        // gltf.scene.traverse((child) => {
        //   if ((child as THREE.Mesh).isMesh) {
        //     const a = (child as THREE.Mesh)
        //       .material as THREE.MeshStandardMaterial;
        //     a.flatShading = false;
        //   }
        // });

        if (!this.cameraPositionFlag) {
          this.camera.position.copy(center);
          this.camera.position.x += size / 2.0;
          this.camera.position.y += size / 5.0;
          this.camera.position.z += size / 2.0;
          this.camera.lookAt(center);
          this.viewPoint = this.setViewPoint(this.camera, [
            center.x,
            center.y,
            center.z,
          ]);
        }

        // this.mixer = new THREE.AnimationMixer(gltf.scene);
        // gltf.animations.forEach((a: THREE.AnimationClip, index: number) => {
        //   if (index === 0) this.clipAction = this.mixer?.clipAction(a).play();
        //   else this.mixer?.clipAction(a).play();
        // });
        this.content = gltf.scene;

        this.scene.add(gltf.scene);
        // this.modelReady = true;
        callback && callback(gltf.scene);
      },
      (error) => {
        // console.log(error);
      }
    );
  }

  pickModel(
    content: THREE.Group,
    callback: (selectMesh: THREE.Mesh | undefined) => void,
    options?: string[]
  ) {
    content.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (!(options && options.includes(m.name))) {
          this.pickableObjects.push(m);
        }
      }
    });

    pickModelDefault(
      this.camera,
      this.container,
      this.pickableObjects,
      callback
    );
  }
  setViewPoint(
    camera: THREE.PerspectiveCamera,
    target?: number[]
  ): CameraViewPoint {
    const viewPoint = new CameraViewPoint();
    viewPoint.farPlane = camera.far;
    viewPoint.nearPlane = camera.near;
    viewPoint.eyePosition = [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ];
    if (target) {
      viewPoint.targetPosition = [target[0], target[1], target[2]];
    } else {
      viewPoint.targetPosition = [0, 0, 0];
    }
    viewPoint.upVector = [camera.up.x, camera.up.y, camera.up.z];
    return viewPoint;
  }

  loadNrrd(url: string, callback?: (volume: any) => void, opts?: optsType) {
    copperNrrdLoader(url, this.scene, callback, opts);
  }
  updateBackground(color1: string, color2: string) {
    this.vignette.style({
      colors: [color1, color2],
    });
  }
  addLights() {
    const hemiLight = new THREE.HemisphereLight();
    hemiLight.name = "hemi_light";
    this.scene.add(hemiLight);
    this.ambientLight.name = "ambient_light";
    this.directionalLight.name = "main_light";
    this.directionalLight.position.set(0.5, 0, 0.866);
    this.camera.add(this.ambientLight);
    this.camera.add(this.directionalLight);
    this.lights.push(hemiLight);
    this.lights.push(this.ambientLight);
    this.lights.push(this.directionalLight);
  }
  removeLights() {
    if (this.lights) {
      this.lights.forEach((light) => light.parent.remove(light));
      this.lights.length = 0;
    }
  }

  loadViewUrl(url: string) {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = () => {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        const viewpointData = JSON.parse(xmlhttp.responseText);
        this.loadView(viewpointData);
      }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
  }

  loadView(viewpointData: CameraViewPoint) {
    this.cameraPositionFlag = true;
    this.viewPoint = viewpointData;
    const viewpoint = new CameraViewPoint();
    viewpoint.farPlane = viewpointData.farPlane;
    viewpoint.nearPlane = viewpointData.nearPlane;
    viewpoint.eyePosition = viewpointData.eyePosition;
    viewpoint.targetPosition = viewpointData.targetPosition;
    viewpoint.upVector = viewpointData.upVector;
    this.copperControl.updateCameraViewPoint(viewpoint);
  }

  render() {
    // this.controls.update();

    // if (this.modelReady) {
    //   this.mixer && this.mixer.update(this.clock.getDelta() * this.playRate);
    // }
    this.renderer.render(this.scene, this.camera);
  }
}
