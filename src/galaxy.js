// ══════════════════════════════════════════════════════
// DRIFT — Galaxy Generator v2 (Mountaintop Visuals)
// Each repo is a galaxy: spiral or elliptical.
// Commits are stars within each galaxy.
// Constellation lines are subtle gold arcs.
// ══════════════════════════════════════════════════════

import * as THREE from 'three';
import { scene } from './scene.js';

// Language → color mapping (vibrant, saturated)
const LANG_COLORS = {
  JavaScript:  new THREE.Color(0xf0db4f),
  TypeScript:  new THREE.Color(0x4a9eff),
  Python:      new THREE.Color(0x4b8bbe),
  Rust:        new THREE.Color(0xff6e40),
  Go:          new THREE.Color(0x00d4aa),
  Java:        new THREE.Color(0xe76f00),
  'C++':       new THREE.Color(0xf34b7d),
  C:           new THREE.Color(0x6295cb),   // more visible blue instead of gray
  'C#':        new THREE.Color(0x68d666),
  Ruby:        new THREE.Color(0xff3333),
  PHP:         new THREE.Color(0x7a86b8),
  Swift:       new THREE.Color(0xff6b3d),
  Kotlin:      new THREE.Color(0xb48eff),
  Solidity:    new THREE.Color(0x8a5cf5),
  HTML:        new THREE.Color(0xff6347),
  CSS:         new THREE.Color(0x7b55d4),
  Shell:       new THREE.Color(0x89e051),
  Dart:        new THREE.Color(0x00c4b0),
  Vue:         new THREE.Color(0x41b883),
  Svelte:      new THREE.Color(0xff3e00),
  Makefile:    new THREE.Color(0x427819),
  Perl:        new THREE.Color(0x0298c3),
  Assembly:    new THREE.Color(0x6E4C13),
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
  if (/^merge/i.test(m)) return 'merge';
  return 'other';
}

const COMMIT_COLORS = {
  feature: new THREE.Color(0x4a9eff),  // bright blue
  fix:     new THREE.Color(0xffaa33),  // warm amber
  refactor:new THREE.Color(0x4acfcf),  // teal
  docs:    new THREE.Color(0xbbbbdd),  // silver
  test:    new THREE.Color(0x5ce87a),  // green
  ci:      new THREE.Color(0xa06ef5),  // purple
  style:   new THREE.Color(0xff6ea8),  // pink
  merge:   new THREE.Color(0xc9b06b),  // gold
  other:   new THREE.Color(0x99aacc)   // blue-gray (brighter)
};

/** All visible galaxy groups for raycasting */
export const galaxyGroups = [];

/** Repo metadata map (name → details) */
export const galaxyMeta = new Map();

/**
 * Generate all galaxies from repo + commit data.
 */
export function createGalaxies(repos, commitMap, stats) {
  const n = repos.length;
  const SPHERE_R = 50;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  // Find max commits for relative sizing
  let maxCommits = 1;
  for (const [, c] of commitMap) maxCommits = Math.max(maxCommits, c.length);

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

    const group = createSingleGalaxy(repo, commits, pos, maxCommits);
    galaxyGroups.push(group);

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
 * v2: Much softer core, vivid language tint, larger commit stars
 */
function createSingleGalaxy(repo, commits, position, maxCommits) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.userData = { repoName: repo.name };

  const langColor = LANG_COLORS[repo.language] || LANG_COLORS.default;
  // Scale galaxy size relative to the largest repo (1.5 to 6 range)
  const relSize = commits.length / maxCommits;
  const galaxySize = 1.5 + relSize * 4.5;
  const isSpiral = commits.length > 15;

  // ── Galaxy core glow (MUCH softer — smaller, more transparent) ──
  const coreGeo = new THREE.SphereGeometry(galaxySize * 0.12, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: langColor.clone().lerp(new THREE.Color(0xffffff), 0.3),
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // ── Halo sprite (subtler, more colorful) ──
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const hctx = haloCanvas.getContext('2d');
  const grad = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  const c = langColor;
  grad.addColorStop(0, `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},0.2)`);
  grad.addColorStop(0.2, `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},0.08)`);
  grad.addColorStop(0.5, `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},0.02)`);
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
  halo.scale.set(galaxySize * 2.5, galaxySize * 2.5, 1);
  group.add(halo);

  // ── Commit stars (BIGGER, BRIGHTER, more vivid) ──
  if (commits.length > 0) {
    const starCount = commits.length;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
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
        // 2-arm spiral — wider spread, more galaxy-like
        const arm = j % 2;
        const t = j / starCount;
        const armAngle = arm * Math.PI + t * Math.PI * 4; // tighter spiral
        const armR = (0.15 + t * 0.85) * galaxySize * 1.6;
        const scatter = (Math.random() - 0.5) * galaxySize * 0.4;
        const vScatter = (Math.random() - 0.5) * galaxySize * 0.08;
        x = armR * Math.cos(armAngle) + scatter;
        y = vScatter;
        z = armR * Math.sin(armAngle) + scatter;
      } else {
        // Elliptical — flattened sphere
        const r = Math.pow(Math.random(), 0.5) * galaxySize * 1.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.cos(phi) * 0.2;
        z = r * Math.sin(phi) * Math.sin(theta);
      }

      positions[j * 3] = x;
      positions[j * 3 + 1] = y;
      positions[j * 3 + 2] = z;

      // Blend commit type color with language color for unique galaxy tint
      const blended = commitColor.clone().lerp(langColor, 0.2);
      // Redshift aging
      const ageFactor = Math.min(1, dayAge / 180);
      const aged = blended.lerp(new THREE.Color(0xe8a84c), ageFactor * 0.12);
      // Boost brightness for fresh commits
      if (dayAge < 7) {
        aged.lerp(new THREE.Color(0xffffff), 0.3);
      } else if (dayAge < 30) {
        aged.lerp(new THREE.Color(0xffffff), 0.1);
      }
      colors[j * 3] = aged.r;
      colors[j * 3 + 1] = aged.g;
      colors[j * 3 + 2] = aged.b;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.7,     // much bigger stars
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const stars = new THREE.Points(starGeo, starMat);
    group.add(stars);
  }

  // ── Dust cloud (faint particles around the galaxy for depth) ──
  if (commits.length > 5) {
    const dustCount = Math.min(80, commits.length);
    const dustPos = new Float32Array(dustCount * 3);
    for (let d = 0; d < dustCount; d++) {
      const r = (0.5 + Math.random()) * galaxySize * 1.3;
      const a = Math.random() * Math.PI * 2;
      dustPos[d * 3] = r * Math.cos(a) + (Math.random() - 0.5) * galaxySize * 0.4;
      dustPos[d * 3 + 1] = (Math.random() - 0.5) * galaxySize * 0.12;
      dustPos[d * 3 + 2] = r * Math.sin(a) + (Math.random() - 0.5) * galaxySize * 0.4;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: langColor.clone().lerp(new THREE.Color(0xffffff), 0.5),
      size: 0.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    group.add(new THREE.Points(dustGeo, dustMat));
  }

  scene.add(group);
  return group;
}

/**
 * Create streak constellation lines.
 * v2: Only 5+ day streaks, gold color, much subtler opacity,
 *     curves instead of straight lines
 */
export function createConstellations(stats) {
  const dailyCommits = stats.dailyCommits;
  const dates = Object.keys(dailyCommits).sort();
  if (dates.length < 2) return;

  // Find consecutive day streaks — minimum 5 days now
  const streaks = [];
  let current = [dates[0]];

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const gap = Math.floor((curr - prev) / 86400000);
    if (gap <= 1) {
      current.push(dates[i]);
    } else {
      if (current.length >= 5) streaks.push([...current]);
      current = [dates[i]];
    }
  }
  if (current.length >= 5) streaks.push(current);

  // Only draw top 6 longest streaks to avoid clutter
  streaks.sort((a, b) => b.length - a.length);
  const topStreaks = streaks.slice(0, 6);

  for (const streak of topStreaks) {
    const points = streak.map((d) => {
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

    // Smooth curve through the points
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    const curvePoints = curve.getPoints(streak.length * 4);
    const geo = new THREE.BufferGeometry().setFromPoints(curvePoints);

    const intensity = Math.min(1, streak.length / 20);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(0xc9b06b),
      transparent: true,
      opacity: 0.06 + intensity * 0.12,  // much subtler
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const line = new THREE.Line(geo, mat);
    scene.add(line);

    // Add small gold dots at each streak node
    const nodePositions = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      nodePositions[i * 3] = p.x;
      nodePositions[i * 3 + 1] = p.y;
      nodePositions[i * 3 + 2] = p.z;
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: 0xc9b06b,
      size: 0.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.3 + intensity * 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    scene.add(new THREE.Points(nodeGeo, nodeMat));
  }
}
