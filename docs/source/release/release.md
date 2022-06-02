# Release

## Release v1.3.3

- Modify default scene name to `default`.
- Change the default background.

```js
const appRenderer = new Copper.Renderer(bg);
const defaultScene = appRenderer.getCurrentScene();
console.log(defaultScene.sceneName);
```

The result should be `"default"`.

## Release v1.3.4

- Add a method that can show/hide child mesh.

  ```ts
  let scene = appRenderer.createScene(name);
  if (child.isMesh) {
    scene.updateModelChildrenVisualisation(child);
  }
  ```

- Update GUI, allows user to show and hide child mesh under ModelFolder->ModelVisualisation folder.

Demo:
![](../_static/images/release_1.3.4_show:hide.gif)

## Release v1.4.0

- add camera control in base GUI.
- pickModel

  - use raycaster to select model.
  - it has a callback function and a optional array parameter to sieve out models that users don't want.

    `callback function:` it will give the select mesh.

  - see `tutorial - pick model`.

- add a callback funtion in loadGltf function.
  - In the callback funtion, you can get your `gltf model`.
- change class `Renderer` to `copperRenderer`
- change class `Scene` to `copperScene`

## Release v1.4.1

- optimise pickModel function.

## Release v1.4.2

- modified pickModel callback function.

  if is picked the mesh will be returned.
  if picked null, the mesh will return undefined.

## Release v1.4.3

- export copperScene type -- `copperScene`
- export viewpoint type -- `CameraViewPoint`
- add updateCamera function
  - same as loadView function

## Release v1.4.4

- setViewPoint(camera: THREE.PerspectiveCamera,target?: number[])
  - return viewPoint
- getViewPoint()
  - Returns the default viewpoint, i.e. the viewpoint that was available when the user loaded the model.
- resetView()

## Release v1.4.5

- add `isHalfed` attribute in copperScene
  - the default value is `false`
  - when user call scene.updateModelChildrenVisualisation(), the value will changed.

## Release v1.5.0

- setPlayRate(playRate:number)
- getPlayRate()
  - retrun current play rate
- addLabelToScene(scene, text, x, y, z, scaling)

  - scene: copperScene
  - text: string
  - x,y,z: tag position
  - scaling: scale

- convert3DPostoScreenPos(container: HTMLDivElement | HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  mesh: THREE.Object3D | THREE.Mesh | THREE.Sprite)

  - Give a 3D object, it will return a screen postion for you.

- convertScreenPosto3DPos(container: HTMLDivElement | HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  pos: screenPosType)

  - Give the screen position, it will return a threejs 3d position for you.
  - you can customise z position.

- export two position type
  - positionType
    ```ts
    positionType {
      x: number;
      y: number;
      z: number;
    }
    ```
  - screenPosType
    ```ts
    screenPosType {
      x: number;
      y: number;
    }
    ```
- Add nrrdloader
  - loadNrrd(url: string, callback?: (volume: any) => void, opts?: optsType)
    `optsType`:
    ```ts
    interface optsType {
      openGui: boolean;
      container?: HTMLDivElement;
    }
    ```
  - addBoxHelper(scene: copperScene,volume: any,boxCube?: THREE.Object3D<THREE.Event>)
    This function can work with loadNrrd function

More information see `tutorial 07`

## Release v1.5.1

- fix bug default gui error.
