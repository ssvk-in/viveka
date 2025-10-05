/**
 * Viveka Optics Laboratory - Modular Implementation
 * Grade 10 Physics - All-in-One Optics Simulation
 */

class OpticsLab {
  constructor() {
    this.ui = {
      module: 'reflection',
      grid: false,
      aa: true,
      glow: true,
      guides: true,
      perf: false,
      autosave: false
    };

    this.state = {
      refl: { source: {x: 260, y: 300}, mirrorX: 650, rayAngle: -20 * Math.PI/180 },
      refr: { boundaryY: 300, n1: 1.00, n2: 1.50, angleDeg: 35, source: {x: 200, y: 160}, showFresnel: true },
      lens: { lensX: 520, f: 140, obj: {x: 220, y: 300}, lensType: 'convex', showRays: true },
      dbl: { wavelengthNm: 550, slitSepMm: 0.25, screenDistM: 1.5, slitWidthMm: 0.05, intensityScale: 1.0 },
      sgl: { wavelengthNm: 550, slitWidthMm: 0.15, screenDistM: 1.5, intensityScale: 1.0 },
      pol: { theta: 30, I0: 1.0, showPlot: true },
      rgb: { r: 255, g: 160, b: 60, addSpots: true }
    };

    this.W = 1024;
    this.H = 600;
    this.mouseDown = false;
    this.dragHandle = null;
    
    this.initializeUI();
  }

  initializeUI() {
    // Initialize UI components
    this.simUI = new VivekaSimulationUI('controls');
    
    // Attach event listeners
    this.attachHeaderEvents();
    this.attachFileHandlers();
    
    // Try to restore autosaved session
    this.restoreAutosave();
  }

  attachHeaderEvents() {
    const moduleSelect = document.getElementById('moduleSelect');
    moduleSelect.value = this.ui.module;
    moduleSelect.onchange = (e) => {
      this.ui.module = e.target.value;
      this.buildControls();
      this.updateLegend();
      this.autosaveMaybe();
    };

    // Toggle buttons
    const toggles = [
      ['toggleGrid', 'grid'],
      ['toggleAA', 'aa'],
      ['toggleGlow', 'glow'],
      ['toggleGuides', 'guides'],
      ['togglePerf', 'perf'],
      ['toggleAutosave', 'autosave']
    ];

    toggles.forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.toggle('active', this.ui[key]);
        el.onclick = () => {
          this.ui[key] = !this.ui[key];
          el.classList.toggle('active', this.ui[key]);
          this.autosaveMaybe();
        };
      }
    });
  }

  attachFileHandlers() {
    const exportBtn = document.getElementById('btnExport');
    const saveBtn = document.getElementById('btnSave');
    const loadBtn = document.getElementById('btnLoad');
    const fileInput = document.getElementById('fileInput');

    exportBtn.onclick = () => this.exportPNG();
    saveBtn.onclick = () => this.saveJSON();
    loadBtn.onclick = () => fileInput.click();
    
    fileInput.onchange = (e) => this.loadJSON(e);
  }

  buildControls() {
    const container = document.getElementById('controls');
    container.innerHTML = '';

    switch(this.ui.module) {
      case 'reflection': this.buildReflectionControls(container); break;
      case 'refraction': this.buildRefractionControls(container); break;
      case 'lens': this.buildLensControls(container); break;
      case 'doubleSlit': this.buildDoubleSlitControls(container); break;
      case 'singleSlit': this.buildSingleSlitControls(container); break;
      case 'polarization': this.buildPolarizationControls(container); break;
      case 'rgb': this.buildRGBControls(container); break;
    }
  }

  buildReflectionControls(container) {
    const s = this.state.refl;
    
    const mirrorControl = this.simUI.createSliderControl(
      'Mirror X (px)', 400, 900, s.mirrorX, 1,
      (val) => { s.mirrorX = val; this.autosaveMaybe(); }
    );
    container.appendChild(mirrorControl.row);

    const angleControl = this.simUI.createSliderControl(
      'Incident Angle (deg)', -80, 80, (s.rayAngle * 180/Math.PI), 1,
      (val) => { s.rayAngle = val * Math.PI/180; this.autosaveMaybe(); }
    );
    container.appendChild(angleControl.row);

    this.simUI.addHint(container, 'Drag the source dot; the law of reflection enforces equal angles with the normal.');
  }

  buildRefractionControls(container) {
    const s = this.state.refr;
    
    const n1Control = this.simUI.createSliderControl(
      'n₁ (top medium)', 1.00, 1.50, s.n1, 0.01,
      (val) => { s.n1 = val; this.autosaveMaybe(); }
    );
    container.appendChild(n1Control.row);

    const n2Control = this.simUI.createSliderControl(
      'n₂ (bottom medium)', 1.00, 2.00, s.n2, 0.01,
      (val) => { s.n2 = val; this.autosaveMaybe(); }
    );
    container.appendChild(n2Control.row);

    const angleControl = this.simUI.createSliderControl(
      'Incident Angle (deg)', 0, 85, s.angleDeg, 1,
      (val) => { s.angleDeg = val; this.autosaveMaybe(); }
    );
    container.appendChild(angleControl.row);

    const fresnelControl = this.simUI.createCheckboxControl(
      'Show Fresnel reflectance hint', s.showFresnel,
      (val) => { s.showFresnel = val; this.autosaveMaybe(); }
    );
    container.appendChild(fresnelControl.wrapper);

    this.simUI.addHint(container, 'Total internal reflection occurs when n₁>n₂ and incidence exceeds the critical angle.');
  }

  buildLensControls(container) {
    const s = this.state.lens;
    
    const fControl = this.simUI.createSliderControl(
      'Focal length f (px)', 40, 260, s.f, 5,
      (val) => { s.f = val; this.autosaveMaybe(); }
    );
    container.appendChild(fControl.row);

    const typeControl = this.simUI.createSelectControl(
      'Lens type', 
      [{value: 'convex', label: 'convex'}, {value: 'concave', label: 'concave'}],
      s.lensType,
      (val) => { s.lensType = val; this.autosaveMaybe(); }
    );
    container.appendChild(typeControl.row);

    const raysControl = this.simUI.createCheckboxControl(
      'Show principal rays', s.showRays,
      (val) => { s.showRays = val; this.autosaveMaybe(); }
    );
    container.appendChild(raysControl.wrapper);

    this.simUI.addHint(container, 'Drag the object point; image position obeys 1/f = 1/do + 1/di, sign flips for concave lens.');
  }

  buildDoubleSlitControls(container) {
    const s = this.state.dbl;
    
    const controls = [
      ['Wavelength (nm)', 380, 700, s.wavelengthNm, 1, (val) => s.wavelengthNm = val],
      ['Slit separation d (mm)', 0.05, 1.50, s.slitSepMm, 0.01, (val) => s.slitSepMm = val],
      ['Slit width a (mm)', 0.01, 0.50, s.slitWidthMm, 0.01, (val) => s.slitWidthMm = val],
      ['Screen distance L (m)', 0.3, 3.0, s.screenDistM, 0.1, (val) => s.screenDistM = val],
      ['Intensity scale', 0.2, 2.0, s.intensityScale, 0.05, (val) => s.intensityScale = val]
    ];

    controls.forEach(([label, min, max, value, step, callback]) => {
      const control = this.simUI.createSliderControl(label, min, max, value, step, 
        (val) => { callback(val); this.autosaveMaybe(); });
      container.appendChild(control.row);
    });

    this.simUI.addHint(container, 'Fringe spacing ~ λL/d; single-slit envelope from a controls contrast.');
  }

  buildSingleSlitControls(container) {
    const s = this.state.sgl;
    
    const controls = [
      ['Wavelength (nm)', 380, 700, s.wavelengthNm, 1, (val) => s.wavelengthNm = val],
      ['Slit width a (mm)', 0.02, 0.80, s.slitWidthMm, 0.01, (val) => s.slitWidthMm = val],
      ['Screen distance L (m)', 0.3, 3.0, s.screenDistM, 0.1, (val) => s.screenDistM = val],
      ['Intensity scale', 0.2, 2.0, s.intensityScale, 0.05, (val) => s.intensityScale = val]
    ];

    controls.forEach(([label, min, max, value, step, callback]) => {
      const control = this.simUI.createSliderControl(label, min, max, value, step, 
        (val) => { callback(val); this.autosaveMaybe(); });
      container.appendChild(control.row);
    });

    this.simUI.addHint(container, 'Diffraction intensity ~ sinc²(β) with β = π a sinθ / λ (Fraunhofer limit).');
  }

  buildPolarizationControls(container) {
    const s = this.state.pol;
    
    const thetaControl = this.simUI.createSliderControl(
      'Analyzer angle θ (deg)', 0, 180, s.theta, 1,
      (val) => { s.theta = val; this.autosaveMaybe(); }
    );
    container.appendChild(thetaControl.row);

    const I0Control = this.simUI.createSliderControl(
      'Input intensity I₀', 0.1, 1.5, s.I0, 0.05,
      (val) => { s.I0 = val; this.autosaveMaybe(); }
    );
    container.appendChild(I0Control.row);

    const plotControl = this.simUI.createCheckboxControl(
      'Show I(θ) plot', s.showPlot,
      (val) => { s.showPlot = val; this.autosaveMaybe(); }
    );
    container.appendChild(plotControl.wrapper);

    this.simUI.addHint(container, 'Malus\'s law: I = I₀ cos²θ; crossed polarizers (90°) extinguish ideal light.');
  }

  buildRGBControls(container) {
    const s = this.state.rgb;
    
    const controls = [
      ['Red', 0, 255, s.r, 1, (val) => s.r = val],
      ['Green', 0, 255, s.g, 1, (val) => s.g = val],
      ['Blue', 0, 255, s.b, 1, (val) => s.b = val]
    ];

    controls.forEach(([label, min, max, value, step, callback]) => {
      const control = this.simUI.createSliderControl(label, min, max, value, step, 
        (val) => { callback(val); this.autosaveMaybe(); });
      container.appendChild(control.row);
    });

    const spotsControl = this.simUI.createCheckboxControl(
      'Show additive spot overlapping', s.addSpots,
      (val) => { s.addSpots = val; this.autosaveMaybe(); }
    );
    container.appendChild(spotsControl.wrapper);

    this.simUI.addHint(container, 'Additive mixing combines emitted light; compare to subtractive pigment mixing in print (not simulated here).');
  }

  updateLegend() {
    const legendDiv = document.getElementById('legend');
    const legends = {
      reflection: {
        title: 'Reflection',
        badge: 'specular',
        content: [
          'Law: angle of incidence equals angle of reflection relative to the surface normal.',
          '<code>θi = θr</code>. Move the source to explore rays.',
          'Normal and angle guides help visualize geometry.'
        ]
      },
      refraction: {
        title: 'Refraction',
        badge: 'Snell\'s Law',
        content: [
          'Snell: <code>n₁ sinθ₁ = n₂ sinθ₂</code>.',
          'When n₁>n₂ and θ₁>θc, total internal reflection occurs.',
          'Optional Fresnel hint: higher angle mismatch → more reflectance.'
        ]
      },
      lens: {
        title: 'Thin Lens Imaging',
        content: [
          'Equation: <code>1/f = 1/do + 1/di</code> (signs depend on lens type).',
          'Principal rays: parallel→focus, through center→straight, through near focus→parallel.',
          'Drag the object to see real/virtual images and magnification.'
        ]
      },
      doubleSlit: {
        title: 'Double-Slit Interference',
        content: [
          'Fringe spacing ≈ <code>λL/d</code> (small angles).',
          'Single-slit envelope from finite width <code>a</code> modulates fringe contrast.',
          'Adjust λ, d, a, and L to see pattern changes.'
        ]
      },
      singleSlit: {
        title: 'Single-Slit Diffraction',
        content: [
          'Intensity ∝ <code>sinc²(β)</code>, with <code>β = π a sinθ / λ</code>.',
          'Narrower slit → broader central maximum.',
          'Fraunhofer (far-field) regime visualized.'
        ]
      },
      polarization: {
        title: 'Polarization (Malus)',
        content: [
          'Transmitted intensity: <code>I = I₀ cos²θ</code>.',
          'Rotate the analyzer; 90° yields extinction for ideal polarizers.',
          'Optional I(θ) plot around the ring.'
        ]
      },
      rgb: {
        title: 'RGB Additive Mixing',
        content: [
          'Three emitters sum to produce perceived color.',
          'Sliders control intensities; overlap shows additive result.',
          'Not a spectral simulation; focuses on color perception.'
        ]
      }
    };

    const legend = legends[this.ui.module];
    if (legend) {
      let html = `<h2>${legend.title}`;
      if (legend.badge) html += ` <span class="viveka-badge">${legend.badge}</span>`;
      html += `</h2>`;
      
      legend.content.forEach(line => {
        html += `<p>${line}</p>`;
      });
      
      legendDiv.innerHTML = html;
    }
  }

  // File operations
  snapshot() {
    return {
      version: 1,
      ui: {...this.ui},
      state: JSON.parse(JSON.stringify(this.state))
    };
  }

  exportPNG() {
    const legend = document.getElementById('legend');
    const prevDisplay = legend.style.display;
    legend.style.display = 'none';
    
    if (window.p5Instance) {
      window.p5Instance.redraw();
      window.p5Instance.saveCanvas(`viveka_optics_lab_${VivekaCore.timestamp()}`, 'png');
    }
    
    setTimeout(() => {
      legend.style.display = prevDisplay || '';
    }, 50);
  }

  saveJSON() {
    const data = JSON.stringify(this.snapshot(), null, 2);
    VivekaCore.downloadBlob(data, `viveka_optics_lab_${VivekaCore.timestamp()}.json`, 'application/json');
  }

  loadJSON(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const snap = JSON.parse(reader.result);
        if (this.restore(snap)) {
          this.autosaveMaybe();
        } else {
          alert('Could not apply settings file.');
        }
      } catch (err) {
        alert('Invalid JSON settings file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  restore(snap) {
    if (!snap || typeof snap !== 'object') return false;
    
    // Restore UI state
    if (snap.ui && typeof snap.ui === 'object') {
      Object.keys(this.ui).forEach(key => {
        if (key in snap.ui) this.ui[key] = snap.ui[key];
      });
    }
    
    // Restore simulation state with validation
    if (snap.state && typeof snap.state === 'object') {
      Object.keys(this.state).forEach(module => {
        if (snap.state[module]) {
          Object.keys(this.state[module]).forEach(param => {
            if (param in snap.state[module]) {
              this.state[module][param] = snap.state[module][param];
            }
          });
        }
      });
    }
    
    // Update UI
    const moduleSelect = document.getElementById('moduleSelect');
    if (moduleSelect) moduleSelect.value = this.ui.module;
    
    this.buildControls();
    this.updateLegend();
    
    return true;
  }

  autosaveMaybe() {
    if (!this.ui.autosave) return;
    try {
      localStorage.setItem('viveka_optics_lab_autosave', JSON.stringify(this.snapshot()));
    } catch(e) { /* ignore storage errors */ }
  }

  restoreAutosave() {
    try {
      const raw = localStorage.getItem('viveka_optics_lab_autosave');
      if (raw) {
        const ok = this.restore(JSON.parse(raw));
        if (ok) console.log('Viveka: Autosaved session restored.');
      }
    } catch(e) { /* ignore */ }
  }
}

// Initialize the lab when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.opticsLab = new OpticsLab();
  
  // Initialize p5.js sketch with modular rendering
  const sketch = (p) => {
    window.p5Instance = p;
    
    p.setup = () => {
      const holder = p.select('#p5-holder');
      p.createCanvas(window.opticsLab.W, window.opticsLab.H).parent(holder);
      p.pixelDensity(1);
      
      window.opticsLab.buildControls();
      window.opticsLab.updateLegend();
    };

    p.draw = () => {
      const lab = window.opticsLab;
      
      if (lab.ui.perf) {
        p.noSmooth();
      } else {
        if (lab.ui.aa) p.smooth();
        else p.noSmooth();
      }
      
      p.background('#0f1116');
      
      // Render current module
      switch(lab.ui.module) {
        case 'reflection': renderReflection(p, lab); break;
        case 'refraction': renderRefraction(p, lab); break;
        case 'lens': renderLens(p, lab); break;
        case 'doubleSlit': renderDoubleSlit(p, lab); break;
        case 'singleSlit': renderSingleSlit(p, lab); break;
        case 'polarization': renderPolarization(p, lab); break;
        case 'rgb': renderRGB(p, lab); break;
      }
    };

    // Mouse interactions
    p.mousePressed = () => {
      const lab = window.opticsLab;
      lab.mouseDown = true;
      lab.dragHandle = null;
      
      if (lab.ui.module === 'reflection') {
        const d = p.dist(p.mouseX, p.mouseY, lab.state.refl.source.x, lab.state.refl.source.y);
        if (d < 14) lab.dragHandle = {mod: 'reflSource'};
      } else if (lab.ui.module === 'refraction') {
        const d = p.dist(p.mouseX, p.mouseY, lab.state.refr.source.x, lab.state.refr.source.y);
        if (d < 14) lab.dragHandle = {mod: 'refrSource'};
      } else if (lab.ui.module === 'lens') {
        const d = p.dist(p.mouseX, p.mouseY, lab.state.lens.obj.x, lab.state.lens.obj.y);
        if (d < 14) lab.dragHandle = {mod: 'lensObj'};
      }
    };

    p.mouseDragged = () => {
      const lab = window.opticsLab;
      if (!lab.mouseDown || !lab.dragHandle) return;
      
      if (lab.dragHandle.mod === 'reflSource') {
        lab.state.refl.source.x = VivekaCore.clamp(p.mouseX, 60, lab.W - 200);
        lab.state.refl.source.y = VivekaCore.clamp(p.mouseY, 60, lab.H - 60);
      } else if (lab.dragHandle.mod === 'refrSource') {
        lab.state.refr.source.x = VivekaCore.clamp(p.mouseX, 60, lab.W - 200);
        lab.state.refr.source.y = VivekaCore.clamp(p.mouseY, 60, lab.state.refr.boundaryY - 40);
      } else if (lab.dragHandle.mod === 'lensObj') {
        lab.state.lens.obj.x = VivekaCore.clamp(p.mouseX, 60, lab.state.lens.lensX - 40);
        lab.state.lens.obj.y = VivekaCore.clamp(p.mouseY, 100, lab.H - 100);
      }
      
      lab.autosaveMaybe();
    };

    p.mouseReleased = () => {
      const lab = window.opticsLab;
      lab.mouseDown = false;
      lab.dragHandle = null;
    };
  };

  new p5(sketch);
});

// Rendering functions (simplified versions - full implementations would be in separate files)
function drawGrid(p, lab) {
  if (!lab.ui.grid) return;
  p.push();
  p.stroke(42, 47, 58);
  p.strokeWeight(1);
  for (let x = 0; x < lab.W; x += 40) p.line(x, 0, x, lab.H);
  for (let y = 0; y < lab.H; y += 40) p.line(0, y, lab.W, y);
  p.pop();
}

function glowLine(p, x1, y1, x2, y2, col, strength = 6, lab) {
  if (!lab.ui.glow) {
    p.stroke(col);
    p.line(x1, y1, x2, y2);
    return;
  }
  
  p.push();
  for (let i = strength; i >= 1; i--) {
    p.strokeWeight(i);
    p.stroke(p.red(col), p.green(col), p.blue(col), 40);
    p.line(x1, y1, x2, y2);
  }
  p.strokeWeight(1.5);
  p.stroke(col);
  p.line(x1, y1, x2, y2);
  p.pop();
}

function renderReflection(p, lab) {
  const s = lab.state.refl;
  
  // Mirror
  p.push();
  p.stroke(120, 160, 255);
  p.strokeWeight(3);
  p.line(s.mirrorX, 40, s.mirrorX, lab.H - 40);
  p.pop();
  
  drawGrid(p, lab);
  
  // Source
  if (lab.ui.guides) {
    p.noStroke();
    p.fill('#f0b35a');
    p.circle(s.source.x, s.source.y, 10);
    p.fill(255);
    p.text('Source', s.source.x + 8, s.source.y - 8);
  }
  
  // Incident ray
  const hitY = s.source.y + ((s.mirrorX - s.source.x)) * Math.tan(s.rayAngle);
  const hit = {x: s.mirrorX, y: hitY};
  glowLine(p, s.source.x, s.source.y, hit.x, hit.y, '#9ad1ff', 8, lab);
  
  // Reflected ray
  const reflAngle = Math.PI - s.rayAngle;
  const Rdir = {x: Math.cos(reflAngle), y: Math.sin(reflAngle)};
  const reflEnd = {x: hit.x + 500 * Rdir.x, y: hit.y + 500 * Rdir.y};
  glowLine(p, hit.x, hit.y, reflEnd.x, reflEnd.y, '#6ff0a0', 8, lab);
}

function renderRefraction(p, lab) {
  const s = lab.state.refr;
  const yB = s.boundaryY;
  
  // Media
  p.noStroke();
  p.fill(24, 30, 44);
  p.rect(0, 0, lab.W, yB);
  p.fill(16, 22, 16);
  p.rect(0, yB, lab.W, lab.H - yB);
  
  drawGrid(p, lab);
  
  // Boundary
  p.stroke('#8893aa');
  p.strokeWeight(2);
  p.line(0, yB, lab.W, yB);
  
  // Source and rays
  const src = s.source;
  const xHit = lab.W * 0.55;
  const theta1 = s.angleDeg * Math.PI / 180;
  const hit = {x: xHit, y: yB};
  
  glowLine(p, src.x, src.y, hit.x, hit.y, '#9ad1ff', 8, lab);
  
  // Snell's law calculation
  const result = VivekaOptics.snellsLaw(s.n1, s.n2, theta1);
  
  if (!result.TIR) {
    const dir2 = p.createVector(Math.sin(result.theta2), -Math.cos(result.theta2));
    const end = {x: hit.x + dir2.x * 600, y: hit.y + dir2.y * 600};
    glowLine(p, hit.x, hit.y, end.x, end.y, '#6ff0a0', 8, lab);
  } else {
    const dirR = p.createVector(-Math.sin(theta1), Math.cos(theta1));
    const end = {x: hit.x - dirR.x * 600, y: hit.y + dirR.y * 600};
    glowLine(p, hit.x, hit.y, end.x, end.y, '#ff9ea6', 8, lab);
  }
}

function renderLens(p, lab) {
  const s = lab.state.lens;
  
  drawGrid(p, lab);
  
  // Lens shape
  p.noFill();
  p.stroke('#6ea8fe');
  p.strokeWeight(2);
  
  const bulge = (s.lensType === 'convex') ? 30 : -30;
  
  // Left surface
  p.beginShape();
  for (let y = 80; y < lab.H - 80; y += 4) {
    const t = (y - lab.H / 2) / ((lab.H - 160) / 2);
    const xoff = bulge * (1 - t * t);
    p.vertex(s.lensX - xoff, y);
  }
  p.endShape();
  
  // Right surface
  p.beginShape();
  for (let y = 80; y < lab.H - 80; y += 4) {
    const t = (y - lab.H / 2) / ((lab.H - 160) / 2);
    const xoff = bulge * (1 - t * t);
    p.vertex(s.lensX + xoff, y);
  }
  p.endShape();
  
  // Object and image calculation
  const O = s.obj;
  const objH = -(s.obj.y - lab.H / 2);
  
  // Draw object
  p.stroke('#f0b35a');
  p.strokeWeight(3);
  p.line(O.x, lab.H / 2, O.x, lab.H / 2 + objH);
  
  // Lens equation
  const do_ = s.lensX - O.x;
  const fSigned = (s.lensType === 'convex') ? s.f : -s.f;
  const result = VivekaOptics.thinLensEquation(fSigned, do_);
  
  const imageX = s.lensX + result.di;
  const imageH = result.magnification * objH;
  
  // Draw image
  p.stroke('#6ff0a0');
  p.strokeWeight(3);
  p.line(imageX, lab.H / 2, imageX, lab.H / 2 + imageH);
}

function renderDoubleSlit(p, lab) {
  const s = lab.state.dbl;
  
  drawGrid(p, lab);
  
  // Screen
  const screenX = lab.W - 140;
  p.noStroke();
  p.fill(14, 16, 22);
  p.rect(screenX, 40, 80, lab.H - 80, 6);
  
  // Interference pattern
  const λ = s.wavelengthNm * 1e-9;
  const d = s.slitSepMm * 1e-3;
  const a = s.slitWidthMm * 1e-3;
  
  p.push();
  p.translate(screenX, 40);
  
  for (let yy = 0; yy < lab.H - 80; yy++) {
    const y_phys = (yy + 40 - lab.H / 2);
    const I = VivekaOptics.doubleSlit(λ, d, a, s.screenDistM, y_phys);
    const intensity = Math.pow(I, 0.7) * s.intensityScale;
    
    const rgb = VivekaOptics.wavelengthToRGB(s.wavelengthNm);
    p.stroke(rgb.r, rgb.g, rgb.b, VivekaCore.clamp(30 + intensity * 225, 30, 255));
    p.line(0, yy, 80, yy);
  }
  
  p.pop();
  
  // Slits
  const slitsX = 200, slitsY = lab.H / 2, gapPix = s.slitSepMm * 150;
  const slitW = 4, slitH = Math.max(18, s.slitWidthMm * 150);
  
  p.fill('#d9e1ff');
  p.noStroke();
  p.rect(slitsX - 2, slitsY - gapPix / 2 - slitH / 2, slitW, slitH, 2);
  p.rect(slitsX - 2, slitsY + gapPix / 2 - slitH / 2, slitW, slitH, 2);
}

function renderSingleSlit(p, lab) {
  const s = lab.state.sgl;
  
  drawGrid(p, lab);
  
  // Screen
  const screenX = lab.W - 140;
  p.noStroke();
  p.fill(14, 16, 22);
  p.rect(screenX, 40, 80, lab.H - 80, 6);
  
  // Diffraction pattern
  const λ = s.wavelengthNm * 1e-9;
  const a = s.slitWidthMm * 1e-3;
  
  p.push();
  p.translate(screenX, 40);
  
  for (let yy = 0; yy < lab.H - 80; yy++) {
    const y_phys = (yy + 40 - lab.H / 2);
    const I = VivekaOptics.singleSlit(λ, a, y_phys, s.screenDistM);
    const intensity = Math.pow(I, 0.7) * s.intensityScale;
    
    const rgb = VivekaOptics.wavelengthToRGB(s.wavelengthNm);
    p.stroke(rgb.r, rgb.g, rgb.b, VivekaCore.clamp(30 + intensity * 225, 30, 255));
    p.line(0, yy, 80, yy);
  }
  
  p.pop();
  
  // Slit
  const slitX = 220, slitH = Math.max(24, s.slitWidthMm * 220);
  p.noStroke();
  p.fill('#d9e1ff');
  p.rect(slitX - 2, lab.H / 2 - slitH / 2, 4, slitH, 2);
}

function renderPolarization(p, lab) {
  const s = lab.state.pol;
  
  drawGrid(p, lab);
  
  const cx = lab.W * 0.55, cy = lab.H * 0.52, R = 120;
  
  // Polarizer
  p.noFill();
  p.stroke('#2b89ff');
  p.strokeWeight(10);
  p.line(cx - R, cy, cx + R, cy);
  
  // Analyzer
  const th = s.theta * Math.PI / 180;
  p.stroke('#f0b35a');
  p.strokeWeight(10);
  p.line(cx - R * Math.cos(th), cy - R * Math.sin(th), 
         cx + R * Math.cos(th), cy + R * Math.sin(th));
  
  // Transmitted beam
  const I = VivekaOptics.malusLaw(s.I0, th);
  const len = 260;
  const dir = p.createVector(Math.cos(th), Math.sin(th));
  const start = p.createVector(cx, cy);
  const end = p.createVector(cx + dir.x * len, cy + dir.y * len);
  
  glowLine(p, start.x, start.y, end.x, end.y, '#6ff0a0', 10, lab);
  
  // Intensity plot
  if (s.showPlot) {
    p.push();
    p.translate(cx, cy);
    p.noFill();
    p.stroke('#2b3240');
    p.circle(0, 0, 2 * R + 40);
    
    p.stroke('#9ad1ff');
    p.beginShape();
    for (let a = 0; a <= 360; a += 3) {
      const rad = a * Math.PI / 180;
      const rr = (R + 20) * Math.max(0, Math.pow(Math.cos(rad), 2));
      p.vertex((R + 20 + rr / 3) * Math.cos(rad), (R + 20 + rr / 3) * Math.sin(rad));
    }
    p.endShape();
    p.pop();
  }
}

function renderRGB(p, lab) {
  const s = lab.state.rgb;
  
  drawGrid(p, lab);
  
  const cx = lab.W * 0.38, cy = lab.H * 0.52;
  
  // Additive spots
  if (s.addSpots) {
    const spots = [
      {x: cx - 90, y: cy, color: p.color(255, 0, 0, 180)},
      {x: cx + 90, y: cy, color: p.color(0, 255, 0, 180)},
      {x: cx, y: cy - 100, color: p.color(0, 120, 255, 180)}
    ];
    
    p.noStroke();
    spots.forEach(sp => {
      for (let r = 140; r > 0; r -= 6) {
        const a = 10 + 180 * (r / 140);
        p.fill(p.red(sp.color), p.green(sp.color), p.blue(sp.color), a * 0.35);
        p.circle(sp.x, sp.y, r * 2);
      }
    });
  }
  
  // Mixed color display
  const blend = p.color(s.r, s.g, s.b);
  p.noStroke();
  p.fill(blend);
  p.rect(lab.W * 0.62, lab.H * 0.24, 280, 240, 10);
  
  p.stroke('#2b3240');
  p.noFill();
  p.rect(lab.W * 0.62, lab.H * 0.24, 280, 240, 10);
}