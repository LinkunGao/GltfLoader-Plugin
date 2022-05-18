import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default class Scene {
  container: HTMLDivElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: TrackballControls;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer();

    this.init();
    this.controls = new TrackballControls(
      this.camera,
      this.renderer.domElement
    );
  }

  init() {
    this.scene.add(new THREE.AxesHelper(5));
    this.camera.position.z = 2;
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.container.appendChild(this.renderer.domElement);
    this.createDemoMesh();
  }

  createDemoMesh() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });

    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);

    // const bbox = new THREE.Box3().setFromObject(cube);
    // this.controls.target.x = (bbox.min.x + bbox.max.x) / 2;
    // this.controls.target.y = (bbox.min.y + bbox.max.y) / 2;
    // this.controls.target.z = (bbox.min.z + bbox.max.z) / 2;
  }

  onWindowResize() {
    const width_client = this.container.clientWidth;
    const height_client = this.container.clientHeight;
    const { width, height } = this.container.getBoundingClientRect();

    const needResize = width !== width_client || height !== height_client;
    if (needResize) {
      // to create a grid for multiple scenes
      this.camera.aspect =
        this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(
        this.container.clientWidth,
        this.container.clientHeight
      );
      this.render();
      //   renderer.setSize(width, height, false);
    }
  }

  animate = () => {
    this.onWindowResize();
    this.controls.update();
    // console.log(this.controls);
    requestAnimationFrame(this.animate);
    this.render();
  };

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  //   animate();
  //render()
}
