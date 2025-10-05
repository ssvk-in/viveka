/**
 * Viveka Core JavaScript Module
 * Shared utilities and base functionality for all simulations
 */

class VivekaCore {
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  static pad2(n) {
    return String(n).padStart(2, '0');
  }

  static timestamp() {
    const d = new Date();
    const Y = d.getFullYear(), M = this.pad2(d.getMonth() + 1), D = this.pad2(d.getDate());
    const h = this.pad2(d.getHours()), m = this.pad2(d.getMinutes()), s = this.pad2(d.getSeconds());
    return `${Y}-${M}-${D}_${h}-${m}-${s}`;
  }

  static downloadBlob(data, filename, type = 'application/octet-stream') {
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

  static createSlider(min, max, value, step = 1) {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    return slider;
  }

  static createRow(label, inputEl, valueId) {
    const row = document.createElement('div');
    row.className = 'viveka-control-row';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.className = 'viveka-control-label';
    
    const valueEl = document.createElement('div');
    valueEl.className = 'viveka-control-value';
    if (valueId) valueEl.id = valueId;
    
    row.appendChild(labelEl);
    row.appendChild(inputEl);
    row.appendChild(valueEl);
    
    return { row, valueEl };
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VivekaCore;
}