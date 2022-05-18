<template>
  <div id="bg" ref="classfy"></div>
</template>

<script setup lang="ts">
// import * as Copper from "gltfloader-plugin-test";
import * as Copper from "./ts/index";

import { getCurrentInstance, onMounted } from "vue";
let refs = null;
onMounted(() => {
  let { $refs } = (getCurrentInstance() as any).proxy;
  refs = $refs;
  const bg: HTMLDivElement = refs.classfy;

  const app1 = new Copper.Scene(bg);
  app1.animate();

  console.dir(bg.clientWidth);
  // const a = new Copper.Scene(bg);
  // a.init();
  // console.log(a.scene);
  // a.animate();
  // console.log(bg);
});
// const bg: HTMLDivElement = document.getElementById("bg") as HTMLDivElement;
// console.log(bg);

// new Copper.Scene(bg);
</script>

<style>
#bg {
  width: 100vw;
  height: 100vh;
  border: 1px solid palevioletred;
}
</style>
