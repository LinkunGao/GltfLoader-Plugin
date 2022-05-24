import * as THREE from "three";
import Scene from "../Scene/copperScene";
import { customMeshType } from "../lib/three-vignette";
import { environments, environmentType } from "../lib/environment/index";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "dat.gui";

interface SceneMapType {
  [key: string]: Scene;
}
interface optType {
  guiOpen: boolean;
  [key: string]: string | boolean;
}
interface stateType {
  playbackSpeed: number;
  wireframe: boolean;
  skeleton: boolean;
  grid: boolean;
  // Lights
  addLights: boolean;
  exposure: number;
  ambientIntensity: number;
  ambientColor: number;
  directIntensity: number;
  directColor: number;
  bgColor1: string;
  bgColor2: string;
  [key: string]: string | number | boolean | {};
}

export default class Renderer {
  container: HTMLDivElement;
  renderer: THREE.WebGLRenderer;
  gui: GUI | null;
  private currentScene: Scene;
  private sceneMap: SceneMapType = {};
  private options: optType | undefined;
  private state: stateType;
  private pmremGenerator: THREE.PMREMGenerator;
  private stats: Stats;
  constructor(container: HTMLDivElement, options?: optType) {
    this.container = container;
    this.options = options;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    // this.renderer.setClearColor(0xffffff, 1);
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.currentScene = new Scene(this.container, this.renderer);
    this.updateEnvironment(this.currentScene.vignette);
    this.stats = Stats();
    this.gui = null;
    this.state = {
      playbackSpeed: 1.0,
      wireframe: false,
      skeleton: false,
      grid: false,
      // Lights
      addLights: true,
      exposure: 1.0,
      ambientIntensity: 0.3,
      ambientColor: 0x202020,
      directIntensity: 0.8 * Math.PI,
      directColor: 0xffffff,
      bgColor1: "#5454ad",
      bgColor2: "#18e5a7",
    };
    this.init();
  }
  init() {
    if (this.currentScene.sceneName === "")
      this.currentScene.sceneName = "default";
    if (this.options?.guiOpen && !this.gui) {
      this.addGui();
    }
    [].forEach.call(
      this.stats.dom.children,
      (child) => ((child as any).style.display = "")
    );
  }
  updateEnvironment(vignette?: customMeshType) {
    const environment = environments.filter(
      (entry) => entry.name === "Venice Sunset"
    )[0];
    this.getCubeMapTexture(environment).then((envMap) => {
      const currentScene = this.getCurrentScene();
      if (envMap) {
        vignette && currentScene.scene.add(vignette.mesh);
      }
      currentScene.scene.environment = envMap as THREE.Texture;
      currentScene.scene.background = envMap as THREE.Texture;
    });
  }
  private getCubeMapTexture(environment: environmentType) {
    const { path } = environment;
    if (!path) return Promise.resolve({ envMap: null });
    return new Promise((resolve, reject) => {
      new RGBELoader().load(
        path,
        (texture) => {
          const envMap =
            this.pmremGenerator.fromEquirectangular(texture).texture;
          this.pmremGenerator.dispose();
          resolve(envMap);
        },
        undefined,
        reject
      );
    });
  }

  getSceneByName(name: string) {
    return this.sceneMap[name];
  }
  getCurrentScene() {
    return this.currentScene;
  }

  setCurrentScene(sceneIn: Scene) {
    if (sceneIn) {
      this.currentScene = sceneIn;
      this.onWindowResize();
    }
  }

  createScene(name: string) {
    if (this.sceneMap[name] != undefined) {
      return undefined;
    } else {
      const new_scene = new Scene(this.container, this.renderer);
      new_scene.sceneName = name;
      this.updateEnvironment(new_scene.vignette);
      this.sceneMap[name] = new_scene;
      return new_scene;
    }
  }

  closeGui() {
    this.gui && this.gui.hide();
  }

  addGui() {
    const gui = (this.gui = new GUI({
      width: 260,
    }));
    const modelFolder = gui.addFolder("ModelFolder");
    const wireframeCtrl = modelFolder.add(this.state, "wireframe");
    wireframeCtrl.onChange(() => this.currentScene.updateDisplay(this.state));

    // bg
    const bgColor1Ctrl = modelFolder.addColor(this.state, "bgColor1");
    const bgColor2Ctrl = modelFolder.addColor(this.state, "bgColor2");
    bgColor1Ctrl.onChange(() =>
      this.currentScene.updateBackground(
        this.state.bgColor1,
        this.state.bgColor2
      )
    );
    bgColor2Ctrl.onChange(() =>
      this.currentScene.updateBackground(
        this.state.bgColor1,
        this.state.bgColor2
      )
    );
    // Performance
    const perfFolder = gui.addFolder("Performance");
    const perfLi = document.createElement("li");
    this.stats.dom.style.position = "static";
    perfLi.appendChild(this.stats.dom);
    perfLi.style.height = "50px";
    (perfFolder as any).__ul.appendChild(perfLi);

    // lights
    const lightFolder = gui.addFolder("LightsFolder");
    // const lightCtrl = lights.add(this.state, "addLights");
    // lightCtrl.onChange((flag) => {
    //   if (flag) {
    //     this.currentScene.addLights();
    //   } else {
    //     this.currentScene.removeLights();
    //   }
    // });
    [
      lightFolder.add(this.state, "addLights").listen(),
      lightFolder.add(this.state, "ambientIntensity", 0, 2),
      lightFolder.addColor(this.state, "ambientColor"),
      lightFolder.add(this.state, "directIntensity", 0, 4), // TODO(#116)
      lightFolder.addColor(this.state, "directColor"),
    ].forEach((ctrl) =>
      ctrl.onChange(() => this.currentScene.updateLights(this.state))
    );
  }

  onWindowResize() {}
  animate = () => {
    this.render();
    this.stats.update();
    requestAnimationFrame(this.animate);
  };
  render() {
    this.currentScene.render();
  }
}
