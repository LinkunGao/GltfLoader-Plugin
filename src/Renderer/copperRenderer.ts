import * as THREE from "three";
import Scene from "../Scene/copperScene";
import { customMeshType } from "../lib/three-vignette";
import { environments, environmentType } from "../lib/environment/index";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

interface SceneMapType {
  [key: string]: Scene;
}

export default class Renderer {
  container: HTMLDivElement;
  renderer: THREE.WebGLRenderer;
  private currentScene: Scene;
  private sceneMap: SceneMapType = {};

  private pmremGenerator: THREE.PMREMGenerator;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    // this.renderer.setClearColor(0xffffff, 1);
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    this.currentScene = new Scene(this.container, this.renderer);
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

  onWindowResize() {}
  animate = () => {
    this.render();
    requestAnimationFrame(this.animate);
  };
  render() {
    this.currentScene.render();
  }
}
