import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";

export function scence(container: HTMLDivElement) {
  const scene = new THREE.Scene();
  scene.add(new THREE.AxesHelper(5));

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 2;

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new TrackballControls(camera, renderer.domElement);
  //controls.addEventListener('change', render)

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
  });

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  //   window.addEventListener("resize", onWindowResize, false);
  function onWindowResize() {
    const width_client = container.clientWidth;
    const height_client = container.clientHeight;
    const { width, height } = container.getBoundingClientRect();

    const needResize = width !== width_client || height !== height_client;
    if (needResize) {
      // to create a grid for multiple scenes
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      render();
      //   renderer.setSize(width, height, false);
    }
  }

  function animate() {
    onWindowResize();
    requestAnimationFrame(animate);
    controls.update();
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  animate();
  //render()
}
