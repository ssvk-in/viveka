/**
 * Reflection Module - Optics Lab
 * Handles reflection physics and rendering
 */

class ReflectionModule {
  constructor() {
    this.state = {
      source: {x: 260, y: 300},
      mirrorX: 650,
      rayAngle: -20 * Math.PI/180
    };
  }

  buildControls(container, ui) {
    const s1 = document.createElement('input');
    s1.type = 'range';
    s1.min = 400;
    s1.max = 900;
    s1.step = 1;
    s1.value = this.state.mirrorX;
    
    const r1 = this.createRow('Mirror X (px)', s1);
    r1.valueEl.textContent = this.state.mirrorX.toFixed(0);
    s1.oninput = (e) => {
      this.state.mirrorX = +e.target.value;
      r1.valueEl.textContent = e.target.value;
      ui.autosaveMaybe();
    };
    container.appendChild(r1.row);

    const s2 = document.createElement('input');
    s2.type = 'range';
    s2.min = -80;
    s2.max = 80;
    s2.step = 1;
    s2.value = (this.state.rayAngle * 180/Math.PI).toFixed(0);
    
    const r2 = this.createRow('Incident Angle (deg)', s2);
    r2.valueEl.textContent = s2.value;
    s2.oninput = (e) => {
      this.state.rayAngle = (+e.target.value) * Math.PI/180;
      r2.valueEl.textContent = e.target.value;
      ui.autosaveMaybe();
    };
    container.appendChild(r2.row);

    this.addHint(container, 'Drag the source dot; the law of reflection enforces equal angles with the normal.');
  }

  render(p, ui, W, H) {
    const S = this.state;
    
    // Mirror
    p.push();
    p.stroke(120, 160, 255);
    p.strokeWeight(3);
    p.line(S.mirrorX, 40, S.mirrorX, H - 40);
    p.pop();
    
    this.drawGrid(p, ui, W, H);
    
    // Source
    if (ui.guides) {
      p.noStroke();
      p.fill('#f0b35a');
      p.circle(S.source.x, S.source.y, 10);
      p.fill(255);
      p.text('Source', S.source.x + 8, S.source.y - 8);
    }
    
    // Incident ray
    const hitY = S.source.y + ((S.mirrorX - S.source.x)) * Math.tan(S.rayAngle);
    const hit = {x: S.mirrorX, y: hitY};
    this.glowLine(p, S.source.x, S.source.y, hit.x, hit.y, '#9ad1ff', 8, ui);
    
    // Reflected ray
    const reflAngle = Math.PI - S.rayAngle;
    const Rdir = {x: Math.cos(reflAngle), y: Math.sin(reflAngle)};
    const reflEnd = {x: hit.x + 500 * Rdir.x, y: hit.y + 500 * Rdir.y};
    this.glowLine(p, hit.x, hit.y, reflEnd.x, reflEnd.y, '#6ff0a0', 8, ui);
  }

  handleMousePressed(p, mouseX, mouseY) {
    const d = p.dist(mouseX, mouseY, this.state.source.x, this.state.source.y);
    if (d < 14) return {mod: 'reflSource'};
    return null;
  }

  handleMouseDragged(mouseX, mouseY, W, H) {
    this.state.source.x = this.clamp(mouseX, 60, W - 200);
    this.state.source.y = this.clamp(mouseY, 60, H - 60);
  }

  getLegend() {
    return {
      title: 'Reflection',
      content: [
        'Law: angle of incidence equals angle of reflection relative to the surface normal.',
        '<code>θi = θr</code>. Move the source to explore rays.',
        'Normal and angle guides help visualize geometry.'
      ]
    };
  }

  // Helper methods
  createRow(label, inputEl) {
    const row = document.createElement('div');
    row.className = 'control-row';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const valueEl = document.createElement('div');
    valueEl.className = 'val';
    row.appendChild(labelEl);
    row.appendChild(inputEl);
    row.appendChild(valueEl);
    return {row, valueEl};
  }

  addHint(container, text) {
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = text;
    container.appendChild(hint);
  }

  drawGrid(p, ui, W, H) {
    if (!ui.grid) return;
    p.push();
    p.stroke(42, 47, 58);
    p.strokeWeight(1);
    for (let x = 0; x < W; x += 40) p.line(x, 0, x, H);
    for (let y = 0; y < H; y += 40) p.line(0, y, W, y);
    p.pop();
  }

  glowLine(p, x1, y1, x2, y2, col, strength, ui) {
    if (!ui.glow) {
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

  clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
}