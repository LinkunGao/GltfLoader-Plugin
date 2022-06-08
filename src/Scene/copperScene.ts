import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { Controls, CameraViewPoint } from "../Controls/copperControls";
import { createBackground, customMeshType } from "../lib/three-vignette";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { copperGltfLoader } from "../Loader/copperGltfLoader";
import { pickModelDefault } from "../Utils/raycaster";
import { copperNrrdLoader, optsType } from "../Loader/copperNrrdLoader";
import { copperVtkLoader } from "../Loader/copperVtkLoader";

interface stateType {
  [key: string]: string | number | boolean | {};
}

const IS_IOS = isIOS();

export default class copperScene {
  container: HTMLDivElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: TrackballControls;
  sceneName: string = "";
  vignette: customMeshType;
  clock: THREE.Clock = new THREE.Clock();
  content: THREE.Group | null;
  isHalfed: boolean = false;

  private viewPoint: CameraViewPoint = new CameraViewPoint();
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private mixer: THREE.AnimationMixer | null = null;
  private playRate: number = 1.0;

  private copperControl: Controls;
  private color1: string = "#5454ad";
  private color2: string = "#18e5a7";
  private lights: any[] = [];
  private cameraPositionFlag = false;
  private modelReady: boolean = false;
  private clipAction: any;
  // rayster pick
  private pickableObjects: THREE.Mesh[] = [];

  constructor(container: HTMLDivElement, renderer: THREE.WebGLRenderer) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    this.renderer = renderer;
    this.ambientLight = new THREE.AmbientLight(0x202020, 1);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);

    this.copperControl = new Controls(this.camera);

    this.content = null;

    this.vignette = createBackground({
      aspect: this.container.clientWidth / this.container.clientHeight,
      grainScale: IS_IOS ? 0 : 0.001,
      colors: [this.color1, this.color2],
    });
    (this.vignette.name = "Vignette"), (this.vignette.renderOrder = -1);
    this.init();
    this.controls = new TrackballControls(
      this.camera,
      this.renderer.domElement
    );
  }

  init() {
    this.copperControl.setCameraViewPoint();
    this.camera.position.z = 2;

    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.container.appendChild(this.renderer.domElement);
    this.addLights();
    this.container.addEventListener("resize", this.onWindowResize, false);
  }

  addLights() {
    const hemiLight = new THREE.HemisphereLight();
    hemiLight.name = "hemi_light";
    this.scene.add(hemiLight);
    // this.scene.add(this.ambientLight);
    // this.scene.add(this.directionalLight);
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

        this.mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach((a: THREE.AnimationClip, index: number) => {
          if (index === 0) this.clipAction = this.mixer?.clipAction(a).play();
          else this.mixer?.clipAction(a).play();
        });
        this.content = gltf.scene;

        this.scene.add(gltf.scene);
        this.modelReady = true;
        callback && callback(gltf.scene);
      },
      (error) => {
        // console.log(error);
      }
    );
  }

  loadNrrd(url: string, callback?: (volume: any) => void, opts?: optsType) {
    copperNrrdLoader(url, this.scene, callback, opts);
  }

  loadVtk(url: string) {
    copperVtkLoader(url, this.scene);
  }

  // pickModel
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
      this.renderer,
      this.pickableObjects,
      callback
    );
  }

  loadMetadataUrl(url: string) {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = () => {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        const metadata = JSON.parse(xmlhttp.responseText) as any[];
        const numberOfMetadata = metadata.length;
        if (numberOfMetadata === 1) {
        } else if (numberOfMetadata > 1) {
        } else {
          console.error("Empty metadata!");
        }
      }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
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

  addObject(obj: any) {
    this.scene.add(obj);
  }

  getDefaultViewPoint() {
    return this.viewPoint;
  }

  getPlayRate() {
    return this.playRate;
  }

  setPlayRate(playRate: number) {
    this.playRate = playRate;
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

  resetView() {
    this.controls.reset();
    this.updateCamera(this.viewPoint);
  }

  updateModelChildrenVisualisation(child: THREE.Mesh) {
    child.visible = !child.visible;
    let flags: Array<boolean> = [];
    this.content?.traverse((mesh) => {
      flags.push(mesh.visible);
    });
    flags.includes(false) ? (this.isHalfed = true) : (this.isHalfed = false);
  }

  updateCamera(viewpoint: CameraViewPoint) {
    this.cameraPositionFlag = true;
    this.copperControl.updateCameraViewPoint(viewpoint);
  }

  updateLights(state: stateType) {
    const lights = this.lights;

    if (state.addLights && !lights.length) {
      this.addLights();
    } else if (!state.addLights && lights.length) {
      this.removeLights();
    }

    if (lights.length === 2) {
      lights[0].intensity = state.ambientIntensity;
      lights[0].color.setHex(state.ambientColor);
      lights[1].intensity = state.directIntensity;
      lights[1].color.setHex(state.directColor);
    }
  }

  updateDisplay(state: stateType) {
    traverseMaterials(this.content as THREE.Group, (material) => {
      material.wireframe = state.wireframe;
    });
  }
  updateBackground(color1: string, color2: string) {
    this.vignette.style({
      colors: [color1, color2],
    });
  }

  createDemoMesh() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      wireframe: true,
    });

    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
    this.scene.add(new THREE.AxesHelper(5));
  }

  getCurrentTime() {
    let currentTime = 0;
    // console.log(this.clipAction.time);
    if (this.clipAction) {
      currentTime = this.clipAction.time / this.clipAction._clip.duration;
    }
    // console.log(this.clipAction._clip.duration);
    return currentTime;
  }

  getCurrentMixer() {
    return this.mixer;
  }

  onWindowResize() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.vignette.style({ aspect: this.camera.aspect });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
  }

  render() {
    this.onWindowResize();
    this.controls.update();

    if (this.modelReady) {
      this.mixer && this.mixer.update(this.clock.getDelta() * this.playRate);
    }
    this.renderer.render(this.scene, this.camera);
  }
}

function isIOS() {
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod",
    ].includes(navigator.platform) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
}

function traverseMaterials(
  object: THREE.Group,
  callback: (material: any) => void
) {
  object.traverse((node) => {
    if (!(node as THREE.Mesh).isMesh) return;
    if (Array.isArray((node as THREE.Mesh).material)) {
      callback((node as THREE.Mesh).material);
    } else {
      [(node as THREE.Mesh).material].forEach(callback);
    }
  });
}
