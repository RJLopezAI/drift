// ══════════════════════════════════════════════════════
// DRIFT — Galaxy Generator
// Each repo is a galaxy: spiral or elliptical.
// Commits are stars within each galaxy.
// ══════════════════════════════════════════════════════

import * as THREE from 'three';
import { scene } from './scene.js';

// Language → color mapping
const LANG_COLORS = {
  JavaScript:  new THREE.Color(0xf0db4f),
  TypeScript:  new THREE.Color(0x3178c6),
  Python:      new THREE.Color(0x306998),
  Rust:        new THREE.Color(0xdea584),
  Go:          new THREE.Color(0x00add8),
  Java:        new THREE.Color(0xb07219),
  'C++':       new THREE.Color(0xf34b7d),
  C:           new THREE.Color(0x555555),
  'C#':        new THREE.Color(0x178600),
  Ruby:        new THREE.Color(0xcc342d),
  PHP:         new THREE.Color(0x4F5D95),
  Swift:       new THREE.Color(0xfa7343),
  Kotlin:      new THREE.Color(0xa97bff),
  Solidity:    new THREE.Color(0x8a5cf5),
  HTML:        new THREE.Color(0xe34c26),
  CSS:         new THREE.Color(0x563d7c),
  Shell:       new THREE.Color(0x89e051),
  Dart:        new THREE.Color(0x00b4ab),
  Vue:         new THREE.Color(0x41b883),
  Svelte:      new THREE.Color(0xff3e00),
  default:     new THREE.Color(0x8a8aa0)
};

// Commit message → type classification
function classifyCommit(message) {
  const m = (message || '').toLowerCase();
  if (/^(feat|add|new|implement|create)/i.test(m)) return 'feature';
  if (/^(fix|bug|patch|resolve|hotfix)/i.test(m)) return 'fix';
  if (/^(refactor|clean|restructure|reorganize)/i.test(m)) return 'refactor';
  if (/^(doc|readme|comment|update doc)/i.test(m)) return 'docs';
  if (/^(test|spec|coverage)/i.test(m)) return 'test';
  if (/^(ci|build|deploy|release|bump|version)/i.test(m)) return 'ci';
  if (/^(style|lint|format)/i.test(m)) return 'style';
  return 'other';
}

const COMMIT_COLORS = {
  feature: new THREE.Color(0x4a8eff),  // blue
  fix:     new THREE.Color(0xe8a84c),  // amber
  refactor:new THREE.Color(0x4acfcf),  // teal
  docs:    new THREE.Color(0xaaaacc),  // silver
  test:    new THREE.Color(0x5ce87a),  // green
  ci:      new THREE.Color(0x8a5cf5),  // purple
  style:   new THREE.Color(0xe85ca8),  // pink
  other:   new THREE.Color(0x8a8aa0)   // muted
};

/** All visible galaxy groups for raycasting */
export const galaxyGroups = [];

/** Repo metadata map (name → details) */
export const galaxyMeta = new Map();

/**
 * Generate all galaxies from repo + commit data.
 * @param {object[]} repos
 * @param {Map<string, object[]>} commitMap
 * @param {object} stats
 */
export function createGalaxies(repos, commitMap, stats) {
  // Place galaxies on a Fibonacci sphere
  const n = repos.length;
  const SPHERE_R = 50;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < n; i++) {
    const repo = repos[i];
    const commits = commitMap.get(repo.name) || [];

    // Fibonacci sphere positioning
    const y = 1 - (i / (n - 1 || 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const thetaF = goldenAngle * i;
    const pos = new THREE.Vector3(
      radiusAtY * Math.cos(thetaF) * SPHERE_R,
      y * SPHERE_R,
      radiusAtY * Math.sin(thetaF) * SPHERE_R
    );

    const group = createSingleGalaxy(repo, commits, pos);
    galaxyGroups.push(group);

    // Store metadata
    galaxyMeta.set(repo.name, {
      name: repo.name,
      description: repo.description || 'No description',
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      commits: commits.length,
      lastPush: repo.pushed_at,
      url: repo.html_url,
      position: pos
    });
  }
}

/**
 * Create a single galaxy (repo) at a position.
 */
function createSingleGalaxy(repo, commits, position) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.userData = { repoName: repo.name };

  const langColor = LANG_COLORS[repo.language] || LANG_COLORS.default;
  const galaxySize = Math.max(2, Math.min(8, Math.log2(commits.length + 1) * 1.5));
  const isSpiral = commits.length > 10;

  // ── Galaxy core glow ──
  const coreGeo = new THREE.SphereGeometry(galaxySize * 0.3, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: langColor,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // ── Halo sprite ──
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const hctx = haloCanvas.getContext('2d');
  const grad = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  const c = langColor;
  grad.addColorStop(0, `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},0.4)`);
  grad.addColorStop(0.3, `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},0.15)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  hctx.fillStyle = grad;
  hctx.fillRect(0, 0, 128, 128);

  const haloTex = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(galaxySize * 3, galaxySize * 3, 1);
  group.add(halo);

  // ── Commit stars ──
  if (commits.length > 0) {
    const starCount = commits.length;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const now = Date.now();

    for (let j = 0; j < starCount; j++) {
      const commit = commits[j];
      const msg = commit.commit?.message || '';
      const type = classifyCommit(msg);
      const commitColor = COMMIT_COLORS[type];
      const date = new Date(commit.commit?.author?.date || now);
      const dayAge = (now - date.getTime()) / 86400000;

      let x, y, z;
      if (isSpiral) {
        // Spiral arm positioning
        const arm = j % 2;
        const t = j / starCount;
        const armAngle = arm * Math.PI + t * Math.PI * 3;
        const armR = t * galaxySize * 1.2;
        const scatter = (Math.random() - 0.5) * galaxySize * 0.3;
        x = armR * Math.cos(armAngle) + scatter;
        y = (Math.random() - 0.5) * galaxySize * 0.15;
        z = armR * Math.sin(armAngle) + scatter;
      } else {
        // Elliptical blob
        const r = Math.random() * galaxySize * 0.8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.cos(phi) * 0.3;
        z = r * Math.sin(phi) * Math.sin(theta);
      }

      positions[j * 3] = x;
      positions[j * 3 + 1] = y;
      positions[j * 3 + 2] = z;

      // Redshift aging: older commits warm-shift
      const ageFactor = Math.min(1, dayAge / 180);
      const aged = commitColor.clone().lerp(new THREE.Color(0xe8a84c), ageFactor * 0.15);
      colors[j * 3] = aged.r;
      colors[j * 3 + 1] = aged.g;
      colors[j * 3 + 2] = aged.b;

      // Fresh commits are bigger, corona effect
      const freshness = dayAge < 7 ? 1.5 : dayAge < 30 ? 1.2 : 1.0;
      sizes[j] = (0.15 + Math.random() * 0.25) * freshness;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.4,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const stars = new THREE.Points(starGeo, starMat);
    group.add(stars);
  }

  scene.add(group);
  return group;
}

/**
 * Create streak constellation lines connecting daily commits.
 * @param {object} stats
 */
export function createConstellations(stats) {
  const dailyCommits = stats.dailyCommits;
  const dates = Object.keys(dailyCommits).sort();
  if (dates.length < 2) return;

  // Find consecutive day streaks
  const streaks = [];
  let current = [dates[0]];

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const gap = Math.floor((curr - prev) / 86400000);
    if (gap <= 1) {
      current.push(dates[i]);
    } else {
      if (current.length >= 3) streaks.push([...current]);
      current = [dates[i]];
    }
  }
  if (current.length >= 3) streaks.push(current);

  // Draw lines for each streak
  for (const streak of streaks) {
    const points = streak.map((d, i) => {
      // Map date to a position on the sphere
      const dayOfYear = Math.floor((new Date(d) - new Date(d.slice(0, 4) + '-01-01')) / 86400000);
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (dayOfYear / 365) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * dayOfYear;
      return new THREE.Vector3(
        r * Math.cos(theta) * 52,
        y * 52,
        r * Math.sin(theta) * 52
      );
    });

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const intensity = Math.min(1, streak.length / 14);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(0xc9b06b),
      transparent: true,
      opacity: 0.12 + intensity * 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const line = new THREE.Line(geo, mat);
    scene.add(line);
  }
}
