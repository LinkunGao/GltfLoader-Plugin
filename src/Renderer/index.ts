import * as THREE from "three";
import Scene from "../Scene/index";

interface SceneMapType {
  [key: string]: Scene;
}

export default class Renderer {
  container: HTMLDivElement;
  private currentScene: Scene;
  private sceneMap: SceneMapType = {};
  renderer: THREE.WebGLRenderer;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer();
    this.currentScene = new Scene(this.container, this.renderer);
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
