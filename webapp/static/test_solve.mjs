/*
 * Headless test for fusion_solve.mjs (run: node test_solve.mjs).
 * Validates the client-side ridge math on synthetic data with a KNOWN linear
 * gaze->screen map, so the browser code is trusted before any real session.
 */
import { gaussSolve, fitGazeModel, rmsResidualPx } from "./fusion_solve.mjs";

let pass = 0, fail = 0;
const ok = (name, cond) => { (cond ? pass++ : fail++); console.log(`  [${cond ? "PASS" : "FAIL"}] ${name}`); };

// deterministic PRNG (no Math.random dependence for reproducibility)
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += rnd(); return (s - 3) / 1.5; };

// 1) gaussSolve on a known system
{
  const A = [[2, 1], [1, 3]], b = [3, 5];   // x=0.8, y=1.4
  const x = gaussSolve(A.map(r => [...r]), [...b]);
  ok("gaussSolve 2x2", Math.abs(x[0] - 0.8) < 1e-9 && Math.abs(x[1] - 1.4) < 1e-9);
}

// 2) recover a known linear feature->screen map with light noise
{
  const d = 6, n = 120;
  // random true weights: 2 outputs from 6 features + bias, in pixel scale
  const Wtrue = Array.from({ length: 2 }, () => Array.from({ length: d + 1 }, () => (rnd() - 0.5) * 800));
  const Xraw = [], Ypx = [];
  for (let i = 0; i < n; i++) {
    const f = Array.from({ length: d }, () => (rnd() - 0.5) * 0.2);  // small features like iris offsets
    const y = [0, 1].map(c => Wtrue[c][0] + f.reduce((s, v, j) => s + v * Wtrue[c][j + 1], 0) + gauss() * 3);
    Xraw.push(f); Ypx.push(y);
  }
  // fit on first 90, evaluate on held-out 30
  const model = fitGazeModel(Xraw.slice(0, 90), Ypx.slice(0, 90), 1.0);
  const rmsTrain = rmsResidualPx(model, Xraw.slice(0, 90), Ypx.slice(0, 90));
  const rmsTest = rmsResidualPx(model, Xraw.slice(90), Ypx.slice(90));
  console.log(`    rmsTrain=${rmsTrain.toFixed(2)} px  rmsTest=${rmsTest.toFixed(2)} px`);
  ok("recovers linear map (train RMS < 40px)", rmsTrain < 40);
  ok("generalizes (test RMS < 80px)", rmsTest < 80);
  ok("predict returns 2D finite", (() => { const p = model.predict(Xraw[0]); return p.length === 2 && p.every(Number.isFinite); })());
}

// 3) degenerate (constant target) shouldn't NaN
{
  const Xraw = Array.from({ length: 10 }, () => Array.from({ length: 6 }, () => rnd()));
  const Ypx = Array.from({ length: 10 }, () => [960, 540]);
  const model = fitGazeModel(Xraw, Ypx, 1.0);
  const p = model.predict(Xraw[0]);
  ok("constant target -> finite ~constant", p.every(Number.isFinite) && Math.abs(p[0] - 960) < 50);
}

console.log(`\nSOLVE TEST: ${fail === 0 ? "PASS" : "FAIL"} (${pass} passed, ${fail} failed)`);
process.exit(fail === 0 ? 0 : 1);
