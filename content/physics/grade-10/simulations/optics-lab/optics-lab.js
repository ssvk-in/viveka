/**
 * Optics Laboratory - Main Controller
 * Manages all simulation modules
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

    this.W = 1024;
    this.H = 600;
    this.mouseDown = false;
    this.dragHandle = null;
    
    // Initialize modules
    this.modules = {
      reflection: new ReflectionModule()
      // Add more modules here as they're created
    };
    
    this.initializeUI();
  }

  initializeUI() {
    this.attachHeaderEvents();
    this.attachFileHandlers();
    this.restoreAutosave();
  }

  attachHeaderEvents() {
    const moduleSelect = document.getElementById('module');
    moduleSelect.value = this.ui.module;
    moduleSelect.onchange = (e) => {
      this.ui.module = e.target.value;
      this.buildControls();
      this.updateLegend();
      this.autosaveMaybe();
    };

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
    
    const currentModule = this.modules[this.ui.module];
    if (currentModule && currentModule.buildControls) {
      currentModule.buildControls(container, this);
    }
  }

  updateLegend() {
    const legendDiv = document.getElementById('legend');
    const currentModule = this.modules[this.ui.module];
    
    if (currentModule && currentModule.getLegend) {
      const legend = currentModule.getLegend();
      let html = `<h2>${legend.title}</h2>`;
      legend.content.forEach(line => {
        html += `<p>${line}</p>`;
      });
      legendDiv.innerHTML = html;
    }
  }

  render(p) {
    if (this.ui.perf) {
      p.noSmooth();
    } else {
      if (this.ui.aa) p.smooth();
      else p.noSmooth();
    }
    
    p.background('#0f1116');
    
    const currentModule = this.modules[this.ui.module];
    if (currentModule && currentModule.render) {
      currentModule.render(p, this.ui, this.W, this.H);
    }
  }

  handleMousePressed(p, mouseX, mouseY) {
    this.mouseDown = true;
    this.dragHandle = null;
    
    const currentModule = this.modules[this.ui.module];
    if (currentModule && currentModule.handleMousePressed) {
      this.dragHandle = currentModule.handleMousePressed(p, mouseX, mouseY);
    }
  }

  handleMouseDragged(mouseX, mouseY) {
    if (!this.mouseDown || !this.dragHandle) return;
    
    const currentModule = this.modules[this.ui.module];
    if (currentModule && currentModule.handleMouseDragged) {
      currentModule.handleMouseDragged(mouseX, mouseY, this.W, this.H);
    }
    
    this.autosaveMaybe();
  }

  handleMouseReleased() {
    this.mouseDown = false;
    this.dragHandle = null;
  }

  // File operations
  snapshot() {
    const moduleStates = {};
    Object.keys(this.modules).forEach(key => {
      if (this.modules[key].state) {
        moduleStates[key] = JSON.parse(JSON.stringify(this.modules[key].state));
      }
    });
    
    return {
      version: 1,
      ui: {...this.ui},
      modules: moduleStates
    };
  }

  exportPNG() {
    const legend = document.getElementById('legend');
    const prevDisplay = legend.style.display;
    legend.style.display = 'none';
    
    if (window.p5Instance) {
      window.p5Instance.redraw();
      window.p5Instance.saveCanvas(`viveka_optics_${this.timestamp()}`, 'png');
    }
    
    setTimeout(() => {
      legend.style.display = prevDisplay || '';
    }, 50);
  }

  saveJSON() {
    const data = JSON.stringify(this.snapshot(), null, 2);
    this.downloadBlob(data, `viveka_optics_${this.timestamp()}.json`, 'application/json');
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
    
    // Restore module states
    if (snap.modules && typeof snap.modules === 'object') {
      Object.keys(snap.modules).forEach(moduleKey => {
        if (this.modules[moduleKey] && this.modules[moduleKey].state) {
          Object.assign(this.modules[moduleKey].state, snap.modules[moduleKey]);
        }
      });
    }
    
    // Update UI
    const moduleSelect = document.getElementById('module');
    if (moduleSelect) moduleSelect.value = this.ui.module;
    
    this.buildControls();
    this.updateLegend();
    
    return true;
  }

  autosaveMaybe() {
    if (!this.ui.autosave) return;
    try {
      localStorage.setItem('viveka_optics_autosave', JSON.stringify(this.snapshot()));
    } catch(e) { /* ignore */ }
  }

  restoreAutosave() {
    try {
      const raw = localStorage.getItem('viveka_optics_autosave');
      if (raw) {
        const ok = this.restore(JSON.parse(raw));
        if (ok) console.log('Viveka: Autosaved session restored.');
      }
    } catch(e) { /* ignore */ }
  }

  // Utility methods
  timestamp() {
    const d = new Date();
    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${Y}-${M}-${D}_${h}-${m}-${s}`;
  }

  downloadBlob(data, filename, type = 'application/octet-stream') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  }
}