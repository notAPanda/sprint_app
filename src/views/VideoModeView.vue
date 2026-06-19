<script setup lang="ts">
// import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

import { ref, onBeforeUnmount, onMounted } from "vue";

import { getPoseDetector } from "../lib/pose-detector";
import { drawSkeleton, countVisibleLandmarks } from "../lib/pose-drawing";

import { POSE_LANDMARKS } from "../lib/pose-connections";
import Button from "@/components/ui/button/Button.vue";

interface AngleResult {
  leftKneeAngle: number | null;
  rightKneeAngle: number | null;
}

function lmToPoint(
  lm: { x: number; y: number },
  width: number,
  height: number,
) {
  return {
    x: lm.x * width,
    y: lm.y * height,
  };
}

function angleDegBetweenThree(
  a: { x: number; y: number; z?: number },
  b: { x: number; y: number; z?: number },
  c: { x: number; y: number; z?: number },
) {
  const v1 = [a.x - b.x, a.y - b.y];
  const v2 = [c.x - b.x, c.y - b.y];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const m1 = Math.hypot(...v1);
  const m2 = Math.hypot(...v2);
  if (!m1 || !m2) return NaN;
  return Math.ceil(
    (Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180) / Math.PI,
  );
}

function safeAngle(angle: number): number | null {
  return Number.isFinite(angle) ? angle : null;
}

function calculateAngles(
  landmarks: any[], // or more specific: typeof POSE_LANDMARKS[keyof typeof POSE_LANDMARKS]
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): AngleResult {
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];

  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

  if (leftHip && leftKnee && leftAnkle) {
    const A = lmToPoint(leftHip, canvas.width, canvas.height);
    const B = lmToPoint(leftKnee, canvas.width, canvas.height);
    const C = lmToPoint(leftAnkle, canvas.width, canvas.height);
    const leftKneeAngle = angleDegBetweenThree(A, B, C);
    ctx.fillStyle = "white";
    ctx.fillText(`${Math.round(leftKneeAngle)}°`, B.x + 6, B.y - 6);
  }

  if (rightHip && rightKnee && rightAnkle) {
    const A = lmToPoint(rightHip, canvas.width, canvas.height);
    const B = lmToPoint(rightKnee, canvas.width, canvas.height);
    const C = lmToPoint(rightAnkle, canvas.width, canvas.height);
    const rightKneeAngle = angleDegBetweenThree(A, B, C);
    ctx.fillStyle = "white";
    ctx.fillText(`${Math.round(rightKneeAngle)}°`, B.x + 6, B.y - 6);
  }
  return {
    leftKneeAngle:
      leftHip && leftKnee && leftAnkle
        ? safeAngle(
            angleDegBetweenThree(
              lmToPoint(leftHip, canvas.width, canvas.height),
              lmToPoint(leftKnee, canvas.width, canvas.height),
              lmToPoint(leftAnkle, canvas.width, canvas.height),
            ),
          )
        : null,
    rightKneeAngle:
      rightHip && rightKnee && rightAnkle
        ? safeAngle(
            angleDegBetweenThree(
              lmToPoint(rightHip, canvas.width, canvas.height),
              lmToPoint(rightKnee, canvas.width, canvas.height),
              lmToPoint(rightAnkle, canvas.width, canvas.height),
            ),
          )
        : null,
  };
}

const videoElement = ref<HTMLVideoElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);
const angles = ref<AngleResult>({
  leftKneeAngle: null,
  rightKneeAngle: null,
});
const cameraFacingMode = ref<"user" | "environment">("environment")

let stream: MediaStream | null = null;

const detector = getPoseDetector();

const switchCamera = async (): Promise<void> => {
  stopCamera();
  cameraFacingMode.value =
    cameraFacingMode.value === "user" ? "environment" : "user";
  await startCamera();
};

const isOptimalPose = (): boolean => {
  const { rightKneeAngle, leftKneeAngle } = angles.value;
  if (rightKneeAngle === null || leftKneeAngle === null) return false;

  const tolerance = 10; // degrees - adjust as needed
  const isNear90 = (angle: number) => Math.abs(angle - 90) <= tolerance;
  const isNear120 = (angle: number) => Math.abs(angle - 120) <= tolerance;

  return (
    (isNear90(rightKneeAngle) && isNear120(leftKneeAngle)) ||
    (isNear120(rightKneeAngle) && isNear90(leftKneeAngle))
  );
};

const startPoseDetection = async (): Promise<void> => {
  const video = videoElement.value;
  const canvas = canvasElement.value;
  const ctx = canvas?.getContext("2d");

  if (!video || !canvas || !ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const result = detector.detect(video, performance.now());
  const landmarks = result?.landmarks?.[0];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (landmarks?.length) {
    drawSkeleton(ctx, landmarks, {
      width: canvas.width,
      height: canvas.height,
      minVisibility: 0.5,
    });

    angles.value = calculateAngles(landmarks, canvas, ctx);

    const visibleCount = countVisibleLandmarks(landmarks, 0.5);
    console.log("visible landmarks", visibleCount);
  }

  requestAnimationFrame(startPoseDetection);
};

const waitForVideoReady = (video: HTMLVideoElement): Promise<void> => {
  return new Promise((resolve) => {
    if (
      video.readyState >= 2 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      resolve();
      return;
    }
    video.onloadedmetadata = () => resolve();
  });
};

const startCamera = async (): Promise<void> => {
  try {
    // Request permission and access video stream
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: false,
    });

    // Assign the stream to the video element
    if (videoElement.value) {
      videoElement.value.srcObject = stream;
      await waitForVideoReady(videoElement.value);
      await videoElement.value.play();
    }
  } catch (error) {
    console.error("Error accessing the camera: ", error);
    alert("Camera access denied or not supported on this device.");
  }
};

const stopCamera = (): void => {
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    if (videoElement.value) {
      videoElement.value.srcObject = null;
    }
  }
};

onMounted(async () => {
  await detector.load();
  await startCamera();
  startPoseDetection();
});

// Clean up the camera stream when the component is destroyed
onBeforeUnmount(() => {
  stopCamera();
});
</script>

<template>
  <div class="relative min-h-screen w-full bg-black">
    <div class="absolute inset-x-0 bottom-0 z-10">
      <div class="flex justify-center my-6">
        <Badge v-if="isOptimalPose()">Optimal!</Badge>
        <Badge v-if="angles.rightKneeAngle !== null"
          >Right knee: {{ angles.rightKneeAngle }}</Badge
        >
        <Badge v-if="angles.leftKneeAngle !== null"
          >Left knee: {{ angles.leftKneeAngle }}</Badge
        >
        <Button @click="switchCamera"></Button>
      </div>
    </div>

    <div class="relative h-screen w-full overflow-hidden">
      <video
        ref="videoElement"
        autoplay
        playsinline
        class="absolute inset-0 h-full w-full object-cover bg-black"
      ></video>
      <canvas
        ref="canvasElement"
        class="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  </div>
</template>
