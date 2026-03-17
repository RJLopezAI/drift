// ══════════════════════════════════════════════════════
// DRIFT — Three.js Scene Setup
// Camera, renderer, controls, resize, render loop
// ══════════════════════════════════════════════════════

import * as THREE from 'three';

/** @type {THREE.Scene} */
export let scene;
/** @type {THREE.PerspectiveCamera} */
export let camera;
/** @type {THREE.WebGLRenderer} */
export let renderer;

// Camera state
let theta = 0;
let phi = Math.PI / 2;
let radius = 85;
const RADIUS_MIN = 20;
const RADIUS_MAX = 200;
let isDragging = false;
let lastMouse = { x: 0, y: 0 };
let autoRotate = true;

// Tween state
let tweenActive = false;
let tweenStart = {};
let tweenEnd = {};
let tweenT = 0;
const TWEEN_DURATION = 1.5;

// Animation callbacks
const updateCallbacks = [];

/**
 * Initialize the Three.js scene, camera, renderer.
 * @param {HTMLCanvasElement} canvas
 */
export function initScene(canvas) {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060610);

  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  updateCameraPosition();

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.sortObjects = true;

  // Events
  window.addEventListener('resize', onResize);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: true });
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
}

function updateCameraPosition() {
  if (!camera) return;
  camera.position.set(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
  camera.lookAt(0, 0, 0);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ── Mouse Controls ──

function onMouseDown(e) {
  isDragging = true;
  autoRotate = false;
  lastMouse = { x: e.clientX, y: e.clientY };
}

function onMouseMove(e) {
  if (!isDragging) return;
  const dx = e.clientX - lastMouse.x;
  const dy = e.clientY - lastMouse.y;
  theta -= dx * 0.005;
  phi -= dy * 0.005;
  phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
  lastMouse = { x: e.clientX, y: e.clientY };
  updateCameraPosition();
}

function onMouseUp() {
  isDragging = false;
}

function onWheel(e) {
  radius += e.deltaY * 0.05;
  radius = Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, radius));
  updateCameraPosition();
}

// ── Touch Controls ──

let lastTouch = { x: 0, y: 0 };

function onTouchStart(e) {
  if (e.touches.length === 1) {
    isDragging = true;
    autoRotate = false;
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.preventDefault();
  }
}

function onTouchMove(e) {
  if (!isDragging || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - lastTouch.x;
  const dy = e.touches[0].clientY - lastTouch.y;
  theta -= dx * 0.005;
  phi -= dy * 0.005;
  phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
  lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  updateCameraPosition();
  e.preventDefault();
}

function onTouchEnd() {
  isDragging = false;
}

/**
 * Register a callback for each animation frame.
 * @param {function} fn - Receives (deltaTime, elapsedTime)
 */
export function onUpdate(fn) {
  updateCallbacks.push(fn);
}

/**
 * Tween camera to look at a 3D position.
 * @param {THREE.Vector3} target
 */
export function flyTo(target) {
  const dir = target.clone().normalize();
  tweenStart = { theta, phi, radius };
  tweenEnd = {
    theta: Math.atan2(dir.z, dir.x),
    phi: Math.acos(dir.y / 1),
    radius: Math.max(RADIUS_MIN + 5, radius * 0.7)
  };
  tweenT = 0;
  tweenActive = true;
  autoRotate = false;
}

/**
 * Reset camera to home position.
 */
export function resetCamera() {
  tweenStart = { theta, phi, radius };
  tweenEnd = { theta: 0, phi: Math.PI / 2, radius: 85 };
  tweenT = 0;
  tweenActive = true;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Start the render loop.
 */
export function startLoop() {
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // Auto-rotate
    if (autoRotate && !isDragging && !tweenActive) {
      theta += 0.0003;
      updateCameraPosition();
    }

    // Camera tween
    if (tweenActive) {
      tweenT += dt / TWEEN_DURATION;
      if (tweenT >= 1) {
        tweenT = 1;
        tweenActive = false;
      }
      const t = easeOutCubic(tweenT);
      theta = tweenStart.theta + (tweenEnd.theta - tweenStart.theta) * t;
      phi = tweenStart.phi + (tweenEnd.phi - tweenStart.phi) * t;
      radius = tweenStart.radius + (tweenEnd.radius - tweenStart.radius) * t;
      updateCameraPosition();
    }

    // Update callbacks
    for (const fn of updateCallbacks) {
      try { fn(dt, elapsed); } catch (e) { console.error('Update error:', e); }
    }

    renderer.render(scene, camera);
  }

  animate();
}

/**
 * Get raycaster from screen coordinates.
 * @param {number} x - Screen X
 * @param {number} y - Screen Y
 * @returns {THREE.Raycaster}
 */
export function getRaycaster(x, y) {
  const rc = new THREE.Raycaster();
  const mouse = new THREE.Vector2(
    (x / window.innerWidth) * 2 - 1,
    -(y / window.innerHeight) * 2 + 1
  );
  rc.setFromCamera(mouse, camera);
  return rc;
}
