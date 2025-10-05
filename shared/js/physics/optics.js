/**
 * Viveka Optics Physics Module
 * Physics calculations for optics simulations
 */

class VivekaOptics {
  static wavelengthToRGB(lambdaNm) {
    let t = (lambdaNm - 380) / (700 - 380);
    t = VivekaCore.clamp(t, 0, 1);
    
    const stops = [
      [148, 0, 211], [0, 80, 255], [0, 200, 255], 
      [0, 255, 0], [255, 220, 0], [255, 0, 0]
    ];
    
    const idx = Math.floor(t * (stops.length - 1));
    const frac = t * (stops.length - 1) - idx;
    const a = stops[idx], b = stops[idx + 1] || stops[idx];
    
    const r = Math.round(a[0] * (1 - frac) + b[0] * frac);
    const g = Math.round(a[1] * (1 - frac) + b[1] * frac);
    const bl = Math.round(a[2] * (1 - frac) + b[2] * frac);
    
    return { r, g, b };
  }

  static snellsLaw(n1, n2, theta1) {
    const sin2 = (n1 / n2) * Math.sin(theta1);
    const TIR = Math.abs(sin2) > 1;
    const theta2 = TIR ? Math.asin(Math.sign(sin2)) : Math.asin(VivekaCore.clamp(sin2, -1, 1));
    return { theta2, TIR };
  }

  static thinLensEquation(f, do_) {
    const di = 1 / (1 / f - 1 / Math.max(1e-3, do_));
    const magnification = -di / Math.max(1e-3, do_);
    return { di, magnification };
  }

  static doubleSlit(wavelength, slitSep, slitWidth, screenDist, y) {
    const sinTheta = y / screenDist / 500;
    const beta = Math.PI * slitWidth * sinTheta / wavelength;
    const alpha = Math.PI * slitSep * sinTheta / wavelength;
    const sinc = (beta === 0) ? 1 : Math.sin(beta) / beta;
    return Math.pow(Math.cos(alpha), 2) * Math.pow(sinc, 2);
  }

  static singleSlit(wavelength, slitWidth, y, screenDist) {
    const sinTheta = y / screenDist / 500;
    const beta = Math.PI * slitWidth * sinTheta / wavelength;
    const sinc = (beta === 0) ? 1 : Math.sin(beta) / beta;
    return Math.pow(sinc, 2);
  }

  static malusLaw(I0, theta) {
    return I0 * Math.pow(Math.cos(theta), 2);
  }
}