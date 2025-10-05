/**
 * Viveka Simulation UI Components
 * Reusable UI components for simulations
 */

class VivekaSimulationUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.state = {};
    this.callbacks = {};
  }

  createHeader(title, modules = []) {
    const header = document.createElement('div');
    header.className = 'viveka-sim-header';
    
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    header.appendChild(titleEl);

    if (modules.length > 0) {
      const moduleSelect = document.createElement('select');
      moduleSelect.className = 'viveka-module-select';
      
      modules.forEach(mod => {
        const option = document.createElement('option');
        option.value = mod.value;
        option.textContent = mod.label;
        moduleSelect.appendChild(option);
      });
      
      header.appendChild(moduleSelect);
      this.moduleSelect = moduleSelect;
    }

    return header;
  }

  createToggleGroup(toggles) {
    const group = document.createElement('div');
    group.className = 'viveka-toggle-group';
    
    toggles.forEach(toggle => {
      const btn = document.createElement('button');
      btn.className = `viveka-toggle ${toggle.active ? 'active' : ''}`;
      btn.textContent = toggle.label;
      btn.onclick = () => {
        btn.classList.toggle('active');
        if (toggle.callback) toggle.callback(btn.classList.contains('active'));
      };
      group.appendChild(btn);
    });
    
    return group;
  }

  createControlPanel() {
    const panel = document.createElement('div');
    panel.className = 'viveka-control-panel';
    return panel;
  }

  createSliderControl(label, min, max, value, step = 1, callback) {
    const slider = VivekaCore.createSlider(min, max, value, step);
    const { row, valueEl } = VivekaCore.createRow(label, slider, null);
    
    valueEl.textContent = value;
    
    slider.oninput = (e) => {
      const val = parseFloat(e.target.value);
      valueEl.textContent = step < 1 ? val.toFixed(2) : val;
      if (callback) callback(val);
    };
    
    return { row, slider, valueEl };
  }

  createCheckboxControl(label, checked, callback) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'viveka-checkbox-row';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    
    wrapper.appendChild(labelEl);
    wrapper.appendChild(checkbox);
    
    checkbox.onchange = () => {
      if (callback) callback(checkbox.checked);
    };
    
    return { wrapper, checkbox };
  }

  createSelectControl(label, options, value, callback) {
    const select = document.createElement('select');
    
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });
    
    select.value = value;
    const { row } = VivekaCore.createRow(label, select, null);
    
    select.onchange = (e) => {
      if (callback) callback(e.target.value);
    };
    
    return { row, select };
  }

  createActionButtons(buttons) {
    const group = document.createElement('div');
    group.className = 'viveka-action-buttons';
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = `viveka-btn ${btn.type || ''}`;
      button.textContent = btn.label;
      button.onclick = btn.callback;
      group.appendChild(button);
    });
    
    return group;
  }

  addHint(parent, text) {
    const hint = document.createElement('div');
    hint.className = 'viveka-hint';
    hint.textContent = text;
    parent.appendChild(hint);
  }
}