import * as THREE from "three";

export function pickModelDefault(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  pickableObjects: THREE.Mesh[],
  callback: (selectMesh: THREE.Mesh | undefined) => void
) {
  const raycaster = new THREE.Raycaster();
  let intersects: THREE.Intersection[];
  let intersectedObject: THREE.Object3D | null;
  const highlightedMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x00ff66,
  });
  const originalMaterials: { [id: string]: THREE.Material | THREE.Material[] } =
    {};

  let oldName: string = "";

  pickableObjects.forEach((m) => {
    originalMaterials[m.name] = (m as THREE.Mesh).material;
  });

  const onDocumentMouseMove = (event: MouseEvent) => {
    raycaster.setFromCamera(
      {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
      },
      camera
    );
    intersects = raycaster.intersectObjects(pickableObjects, false);
    // const b: { [key: string]: string } = {};
    // intersects.forEach((a) => {
    //   b[a.object.name] = a.object.name;
    // });
    // console.log(b);
    if (intersects.length > 0) {
      intersectedObject = intersects[0].object;
    } else {
      intersectedObject = null;
      oldName = "";
      callback(undefined);
    }
    pickableObjects.forEach((o: THREE.Mesh, i) => {
      if (intersectedObject && intersectedObject.name === o.name) {
        if (oldName != o.name) {
          oldName = o.name;

          callback(pickableObjects[i]);
          pickableObjects[i].material = highlightedMaterial;
        }
      } else {
        pickableObjects[i].material = originalMaterials[o.name];
      }
    });
  };

  document.addEventListener(
    "mousemove",
    throttle(onDocumentMouseMove, 80),
    false
  );
}

function throttle(callback: (event: MouseEvent) => void, wait: number) {
  let start: number = 0;
  return function (event: MouseEvent) {
    const current: number = Date.now();
    if (current - start > wait) {
      callback.call(null, event);
      start = current;
    }
  };
}
