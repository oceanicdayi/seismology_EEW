const SeismicMath = {
  travelTimeP(deltaKm, depthKm) {
    const dist = Math.sqrt(deltaKm * deltaKm + depthKm * depthKm);
    return dist / 6.0;
  },

  travelTimeS(deltaKm, depthKm) {
    const dist = Math.sqrt(deltaKm * deltaKm + depthKm * depthKm);
    return dist / 3.5;
  },

  distance(lon1, lat1, lon2, lat2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },

  locateGeiger(stations, lon0, lat0, depth0, maxIter) {
    maxIter = maxIter || 20;
    let lon = lon0, lat = lat0, depth = depth0;
    const n = stations.length;
    let prevError = Infinity;

    for (let iter = 0; iter < maxIter; iter++) {
      const A = [];
      const b = [];
      let totalError = 0;

      for (const st of stations) {
        if (st.pickedP === null) continue;
        const d = this.distance(lon, lat, st.lon, st.lat);
        const tCalc = this.travelTimeP(d, depth);
        const tObs = st.pickedP / 1000;
        const residual = tObs - tCalc;
        totalError += Math.abs(residual);

        const eps = 0.01;
        const d1 = this.distance(lon + eps, lat, st.lon, st.lat);
        const d2 = this.distance(lon, lat + eps, st.lon, st.lat);
        const d3 = this.distance(lon, lat, st.lon, st.lat);
        const dtDlon = (this.travelTimeP(d1, depth) - this.travelTimeP(d3, depth)) / (eps * 111.32);
        const dtDlat = (this.travelTimeP(d2, depth) - this.travelTimeP(d3, depth)) / (eps * 111.32);
        const dtDdep = (this.travelTimeP(d, depth + 0.5) - this.travelTimeP(d, depth - 0.5));

        A.push([dtDlon, dtDlat, dtDdep]);
        b.push(residual);
      }

      if (A.length < 3) break;

      const At = _transpose(A);
      const AtA = _mult(At, A);
      const Atb = _multVec(At, b);

      const det = AtA[0][0]*(AtA[1][1]*AtA[2][2] - AtA[1][2]*AtA[2][1])
                - AtA[0][1]*(AtA[1][0]*AtA[2][2] - AtA[1][2]*AtA[2][0])
                + AtA[0][2]*(AtA[1][0]*AtA[2][1] - AtA[1][1]*AtA[2][0]);

      if (Math.abs(det) < 1e-12) break;

      const inv = _inverse3x3(AtA, det);
      const dx = _multVecMat(inv, Atb);

      lon += dx[0];
      lat += dx[1];
      depth += dx[2];

      if (depth < 0) depth = 1;

      if (Math.abs(totalError - prevError) < 0.001) break;
      prevError = totalError;
    }

    const finalDists = stations.filter(s => s.pickedP !== null).map(s =>
      this.distance(lon, lat, s.lon, s.lat)
    );
    const errorKm = finalDists.length > 0
      ? Math.sqrt(finalDists.reduce((a,b) => a + b*b, 0) / finalDists.length)
      : NaN;

    return { lon, lat, depth, errorKm };
  },

  calcML(amplitudeMm, distKm) {
    return Math.log10(amplitudeMm) + 1.11 * Math.log10(distKm) + 0.00189 * distKm - 2.09;
  },

  calcMw(momentNm) {
    return (2/3) * Math.log10(momentNm) - 6.07;
  }
};

function _transpose(m) {
  return m[0].map((_, i) => m.map(r => r[i]));
}

function _mult(a, b) {
  const res = Array.from({length: a.length}, () => Array(b[0].length).fill(0));
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b[0].length; j++)
      for (let k = 0; k < b.length; k++)
        res[i][j] += a[i][k] * b[k][j];
  return res;
}

function _multVec(m, v) {
  return m.map(r => r.reduce((s, x, i) => s + x * v[i], 0));
}

function _multVecMat(v, m) {
  return m[0].map((_, j) => v.reduce((s, x, i) => s + x * m[i][j], 0));
}

function _inverse3x3(m, det) {
  const inv = Array.from({length: 3}, () => Array(3).fill(0));
  inv[0][0] = (m[1][1]*m[2][2] - m[1][2]*m[2][1]) / det;
  inv[0][1] = (m[0][2]*m[2][1] - m[0][1]*m[2][2]) / det;
  inv[0][2] = (m[0][1]*m[1][2] - m[0][2]*m[1][1]) / det;
  inv[1][0] = (m[1][2]*m[2][0] - m[1][0]*m[2][2]) / det;
  inv[1][1] = (m[0][0]*m[2][2] - m[0][2]*m[2][0]) / det;
  inv[1][2] = (m[0][2]*m[1][0] - m[0][0]*m[1][2]) / det;
  inv[2][0] = (m[1][0]*m[2][1] - m[1][1]*m[2][0]) / det;
  inv[2][1] = (m[0][1]*m[2][0] - m[0][0]*m[2][1]) / det;
  inv[2][2] = (m[0][0]*m[1][1] - m[0][1]*m[1][0]) / det;
  return inv;
}
