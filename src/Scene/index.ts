import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";

export default class Scene {
  baseContainer: HTMLDivElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: TrackballControls;
  constructor(container: HTMLDivElement) {
    this.baseContainer = container;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.0,
      10
    );
    this.controls = new TrackballControls(
      this.camera,
      this.renderer.domElement
    );
  }
  init() {
    this.baseContainer.appendChild(this.renderer.domElement);
    const ambientLight = new THREE.AmbientLight(new THREE.Color(0x202020));
    const directionalLight = new THREE.DirectionalLight(
      new THREE.Color(0x777777)
    );
    this.scene.add(ambientLight);
    this.scene.add(directionalLight);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0xff6347 });
    const mesh = new THREE.Mesh(geometry, material);

    this.scene.add(mesh);
  }
  resizeRendererToDisplaySize = () => {
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;
    const needResize: boolean =
      this.renderer.domElement.width !== width ||
      this.renderer.domElement.height !== height;
    if (needResize) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    }
  };

  animate = () => {
    this.resizeRendererToDisplaySize();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.animate);
  };
}
