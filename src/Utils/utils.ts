export function fullScreenListenner(
  container: HTMLDivElement | HTMLCanvasElement
) {
  const fullscreenElement =
    document.fullscreenElement || (document as any).webkitFullscreenElement;
  if (!fullscreenElement) {
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if ((container as any).webkitRequestFullscreen) {
      (container as any).webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }
  }
}
