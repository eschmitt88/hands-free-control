/*
 * Pure, dependency-free ridge regression for in-browser gaze calibration.
 *
 * The fused cursor needs a LIVE gaze point (features -> screen px) every frame,
 * so the calibration must be fit and evaluated client-side — no server round-trip.
 * This mirrors the server-side approach in
 * ../../experiments/2026-07-01-webcam-gaze-accuracy (StandardScaler -> Ridge):
 * standardize features on the calibration set, then ridge-regress to screen px
 * with an unregularized bias term. Small matrices (features are 6-D, +bias = 7),
 * so a plain Gaussian-elimination solve is ample.
 *
 * Exported as an ES module so it runs unchanged in the browser AND under node for
 * headless testing (see test_solve.mjs).
 */

export function fitStandardizer(X) {
  const n = X.length, d = X[0].length;
  const mean = new Array(d).fill(0), std = new Array(d).fill(0);
  for (const row of X) for (let j = 0; j < d; j++) mean[j] += row[j];
  for (let j = 0; j < d; j++) mean[j] /= n;
  for (const row of X) for (let j = 0; j < d; j++) std[j] += (row[j] - mean[j]) ** 2;
  for (let j = 0; j < d; j++) std[j] = Math.sqrt(std[j] / n) || 1e-6;
  return { mean, std };
}

export function standardizeRow(row, s) {
  return row.map((v, j) => (v - s.mean[j]) / s.std[j]);
}

// Solve A x = b for a small square system via Gaussian elimination w/ partial pivot.
export function gaussSolve(A, b) {
  const m = A.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let col = 0; col < m; col++) {
    let piv = col;
    for (let r = col + 1; r < m; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col] || 1e-12;
    for (let r = 0; r < m; r++) {
      if (r === col) continue;
      const f = M[r][col] / d;
      for (let c = col; c <= m; c++) M[r][c] -= f * M[col][c];
    }
  }
  // After full elimination M is diagonal: x[i] = rhs / diagonal.
  return M.map((r, i) => r[m] / (r[i] || 1e-12));
}

// Ridge fit on already-standardized X (n×d) -> Y (n×k). Bias term (col 0) is
// unregularized. Returns weight matrix W of shape (d+1)×k.
export function ridgeFit(Xstd, Y, lambda = 1.0) {
  const n = Xstd.length, d = Xstd[0].length, k = Y[0].length;
  const p = d + 1;
  const Xb = Xstd.map((row) => [1, ...row]);
  const A = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let i = 0; i < n; i++)
    for (let a = 0; a < p; a++)
      for (let b = 0; b < p; b++) A[a][b] += Xb[i][a] * Xb[i][b];
  for (let a = 1; a < p; a++) A[a][a] += lambda;   // don't regularize the bias
  const W = Array.from({ length: p }, () => new Array(k).fill(0));
  for (let c = 0; c < k; c++) {
    const rhs = new Array(p).fill(0);
    for (let i = 0; i < n; i++) for (let a = 0; a < p; a++) rhs[a] += Xb[i][a] * Y[i][c];
    const w = gaussSolve(A.map((r) => [...r]), rhs);
    for (let a = 0; a < p; a++) W[a][c] = w[a];
  }
  return W;
}

// Fit a full gaze model from RAW features + target px. Returns a predictor closure.
export function fitGazeModel(Xraw, Ypx, lambda = 1.0) {
  const scaler = fitStandardizer(Xraw);
  const Xstd = Xraw.map((row) => standardizeRow(row, scaler));
  const W = ridgeFit(Xstd, Ypx, lambda);
  const p = W.length, k = W[0].length;
  const predict = (rawFeat) => {
    const xb = [1, ...standardizeRow(rawFeat, scaler)];
    const out = new Array(k).fill(0);
    for (let c = 0; c < k; c++) for (let a = 0; a < p; a++) out[c] += xb[a] * W[a][c];
    return out;
  };
  return { predict, scaler, W };
}

// Convenience: RMS residual (px) of a fitted model on a labelled set.
export function rmsResidualPx(model, Xraw, Ypx) {
  let se = 0;
  for (let i = 0; i < Xraw.length; i++) {
    const p = model.predict(Xraw[i]);
    se += (p[0] - Ypx[i][0]) ** 2 + (p[1] - Ypx[i][1]) ** 2;
  }
  return Math.sqrt(se / Xraw.length);
}
