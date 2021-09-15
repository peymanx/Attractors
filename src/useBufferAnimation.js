import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

import {
  InstancedPrefabBufferGeometry,
  ShaderChunk,
  StandardAnimationMaterial,
} from "three-bas";
import { AdditiveBlending } from "three";

const worker = new Worker("./attractors/attractors.js");

const length = 25000;

export const useBufferAnimation = ({ func, transition }) => {
  const meshRef = useRef();
  const posRef = useRef();
  const rotRef = useRef();

  const geometryRef = useRef(null);
  const materialRef = useRef(null);

  const [init, setInit] = useState(false);

  useEffect(() => {
    worker.postMessage({ func, length });
  }, [func]);

  useEffect(() => {
    const updateGeo = (name, array) => {
      const tmpa = [];
      const geometry = geometryRef.current;
      const buffer = geometry.attributes[name];

      for (let i = 0; i < length; i++) {
        tmpa[0] = array[i][0];
        tmpa[1] = array[i][1];
        tmpa[2] = array[i][2];
        geometry.setPrefabData(buffer, i, tmpa);
      }
      buffer.needsUpdate = true;
    };

    worker.onmessage = (e) => {
      const { positions, rotations } = e.data;
      //only update geo if it already exists
      if (posRef.current) {
        updateGeo("prevPos", posRef.current);
        updateGeo("prevRot", rotRef.current);
        updateGeo("pos", positions);
        updateGeo("rot", rotations);
        meshRef.current.material.uniforms.progress.value = 0;
      }
      posRef.current = positions;
      rotRef.current = rotations;
      setInit(true);
    };
  }, [meshRef]);

  useFrame(() => {
    if (!meshRef.current) return;
    const uniforms = meshRef.current.material.uniforms;
    if (uniforms.progress.value >= 0) {
      uniforms.progress.value += 0.01;
      if (uniforms.progress.value > 1) {
        uniforms.progress.value = -1;
        transition.current = false;
      }
    } else {
      uniforms.index.value--;
      if (uniforms.index.value === 0) uniforms.index.value = length;
    }
  });

  return useMemo(() => {
    if (!init) return [];
    const length = posRef.current.length;

    const prefab = new THREE.ConeBufferGeometry(0.003, 0.01, 3);
    const geometry = new InstancedPrefabBufferGeometry(prefab, length);

    geometry.createAttribute("prevPos", 3);
    geometry.createAttribute("prevRot", 3);
    const positionBuffer = geometry.createAttribute("pos", 3);
    const rotationBuffer = geometry.createAttribute("rot", 3);
    const referenceBuffer = geometry.createAttribute("ref", 1);

    //loop through all new points
    for (let i = 0; i < length; i++) {
      geometry.setPrefabData(positionBuffer, i, posRef.current[i]);
      geometry.setPrefabData(rotationBuffer, i, rotRef.current[i]);
      geometry.setPrefabData(referenceBuffer, i, [i]);
    }

    const material = new StandardAnimationMaterial({
      roughness: 0.9,
      metalness: 0.1,
      uniforms: {
        progress: { value: -1 },
        index: { value: length },
        length: { value: length },
        a: { value: 1103515245 },
        c: { value: 12345 },
        m: { value: 2593123487 },
        xAxis: { value: [1.0, 0.0, 0.0] },
        yAxis: { value: [0.0, 1.0, 0.0] },
        zAxis: { value: [0.0, 0.0, 1.0] },
      },
      vertexParameters: [
        "uniform float progress;",
        "uniform float index;",
        "uniform float length;",

        "uniform float a;",
        "uniform float c;",
        "uniform float m;",

        "uniform vec3 xAxis;",
        "uniform vec3 yAxis;",
        "uniform vec3 zAxis;",

        "attribute float ref;",
        "attribute vec3 pos;",
        "attribute vec3 prevPos;",
        "attribute vec3 prevRot;",
        "attribute vec3 rot;",

        "float rand(float seed) {",
        "float random1 = fract(((a * seed + c) / m));",
        "return (0.5 - random1) * 0.015;",
        "}",
      ],
      vertexNormal: [
        "vec3 rotation;",
        "if(progress > 0.0) {",
        "float time = easeCubicInOut(progress);",
        "rotation = mix(prevRot, rot, progress);",
        "} else {",
        "rotation = rot;",
        "};",
        "vec4 quatZ = quatFromAxisAngle(zAxis, rotation.z);",
        "objectNormal  = rotateVector(quatZ, objectNormal );",

        "vec4 quatY = quatFromAxisAngle(yAxis, rotation.y);",
        "objectNormal  = rotateVector(quatY, objectNormal );",

        "vec4 quatX = quatFromAxisAngle(xAxis, rotation.x);",
        "objectNormal  = rotateVector(quatX, objectNormal );",
      ],
      vertexPosition: [
        "vec3 offset;",
        "float ind1 = mod((ref + index) , length);",
        "offset.x = rand(ind1);",
        "offset.y = rand(ind1*100.0);",
        "offset.z = rand(ind1*300.0);",

        "transformed = rotateVector(quatZ, transformed);",
        "transformed = rotateVector(quatY, transformed);",
        "transformed = rotateVector(quatX, transformed);",

        "if(progress > 0.0) {",
        "float time = easeCubicInOut(progress);",
        "transformed += mix(prevPos + offset, pos + offset, time);",
        "} else {",
        "transformed += pos + offset;",
        "};",
      ],
      vertexFunctions: [
        ShaderChunk["quaternion_rotation"],
        ShaderChunk["ease_cubic_in_out"],
      ],
      color: "white",
      blending: AdditiveBlending,
    });
    geometry.computeVertexNormals();

    geometryRef.current && geometryRef.current.dispose();
    materialRef.current && materialRef.current.dispose();
    geometryRef.current = geometry;
    materialRef.current = material;
    return [meshRef, geometry, material];
  }, [init]);
};
