import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { Controls, CameraViewPoint } from "../Controls/copperControls";
import { createBackground, customMeshType } from "../lib/three-vignette";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { copperGltfLoader } from "../GlftLoader/copperGltfLoader";

interface stateType {
  [key: string]: string | number | boolean | {};
}

const IS_IOS = isIOS();

export default class Scene {
  container: HTMLDivElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: TrackballControls;
  sceneName: string = "";
  vignette: customMeshType;
  clock: THREE.Clock = new THREE.Clock();

  content: THREE.Group | null;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private mixer: THREE.AnimationMixer | null = null;

  private copperControl: Controls;
  private color1: string = "#5454ad";
  private color2: string = "#18e5a7";

  private modelReady: boolean = false;

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
    this.directionalLight = new THREE.DirectionalLight(0x777777, 1);

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

    this.scene.add(this.ambientLight);
    // this.scene.add(this.directionalLight);
    this.camera.add(this.directionalLight);
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.container.appendChild(this.renderer.domElement);

    this.container.addEventListener("resize", this.onWindowResize, false);
  }

  loadGltf(url: string) {
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

        this.mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach((a: THREE.AnimationClip) => {
          this.mixer && this.mixer.clipAction(a).play();
        });
        this.content = gltf.scene;
        this.scene.add(gltf.scene);
        this.modelReady = true;
      },
      (error) => {
        // console.log(error);
      }
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
    const viewpoint = new CameraViewPoint();
    viewpoint.farPlane = viewpointData.farPlane;
    viewpoint.nearPlane = viewpointData.nearPlane;
    viewpoint.eyePosition = viewpointData.eyePosition;
    viewpoint.targetPosition = viewpointData.targetPosition;
    viewpoint.upVector = viewpointData.upVector;
    this.copperControl.updateCameraViewPoint(viewpoint);
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
      color: 0x00ff00,
      // wireframe: true,
    });

    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
    this.scene.add(new THREE.AxesHelper(5));
  }

  onWindowResize() {
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
      this.mixer && this.mixer.update(this.clock.getDelta());
    }
    this.copperControl.updateDirectionalLight(this.directionalLight);
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
