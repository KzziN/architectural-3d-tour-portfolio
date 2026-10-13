// Mock data para prototipagem rápida

export const mockPlantAnalysis = {
  rooms: [
    { id: 1, name: 'Suite A', area: 40.37, x: -7, z: 4, width: 8, depth: 5.5 },
    { id: 2, name: 'Suite B', area: 34.64, x: 0, z: 4, width: 7.5, depth: 4.6 },
    { id: 3, name: 'Suite C', area: 26.91, x: 8, z: 4, width: 6.5, depth: 4.1 },
  ],
  windows: [
    { room: 1, x: -7, z: 8, width: 2 },
    { room: 2, x: 0, z: 8, width: 2 },
  ],
  doors: [
    { room: 1, x: -3, z: 8.5 },
    { room: 2, x: 3, z: 8.5 },
  ],
  materials: {
    floor: 'polished concrete',
    walls: 'white plaster',
    trim: 'aluminum'
  },
  confidence: 0.92
};

export const mockSpaceDescriptions = [
  {
    name: 'Office Moderno',
    description: 'Espaço 50m², 2 janelas, piso madeira, móveis minimalistas',
    furniture: ['desk', 'chair', 'shelving', 'plant'],
    colors: ['#e8e4d9', '#3a535c', '#7d6e60'],
    lighting: 'daylight'
  },
  {
    name: 'Suite de Reunião',
    description: 'Mesa de vidro 12 lugares, paredes cinza, iluminação moderna',
    furniture: ['conference_table', 'chairs', 'whiteboard'],
    colors: ['#c7c5b9', '#263740', '#ddd9ce'],
    lighting: 'warm_led'
  },
  {
    name: 'Lounge Corporativo',
    description: 'Sofás modernos, tapete cinza, parede verde, plantas',
    furniture: ['sofa', 'lounge_chair', 'coffee_table', 'plants'],
    colors: ['#567447', '#677277', '#eeeae0'],
    lighting: 'ambient'
  },
  {
    name: 'Cafeteria',
    description: 'Bancadas altas, bancos, máquina de café, piso cinza',
    furniture: ['counter', 'high_stools', 'plants'],
    colors: ['#677277', '#b8aa8c', '#567447'],
    lighting: 'neutral'
  }
];

export const mockDecorationOptions = [
  {
    style: 'Moderno Minimalista',
    furniture: ['desk', 'lounge_chair', 'shelving'],
    colors: ['#3a535c', '#eeeae0', '#7d6e60'],
    description: 'Limpo, funcional, cores neutras'
  },
  {
    style: 'Corporativo Elegante',
    furniture: ['desk', 'leather_chair', 'cabinet', 'plants'],
    colors: ['#263740', '#c7c5b9', '#bc976d'],
    description: 'Profissional, aquecido, natureza'
  },
  {
    style: 'Criativo & Descontraído',
    furniture: ['standing_desk', 'gaming_chair', 'plants', 'bean_bag'],
    colors: ['#567447', '#9d6b43', '#eeeae0'],
    description: 'Dinâmico, colorido, aconchegante'
  },
  {
    style: 'Zen & Wellness',
    furniture: ['low_table', 'meditation_cushion', 'plants', 'water_feature'],
    colors: ['#567447', '#81925b', '#7e9daa'],
    description: 'Calmo, natural, bem-estar'
  }
];

export const mockTourFloors = [
  {
    floor: 1,
    name: '1º Andar - Térreo Comercial',
    spaces: [
      { id: 'l1', name: 'Retail 01', area: 73.29, featured: true },
      { id: 'l2', name: 'Retail 02', area: 69.54 },
      { id: 'l3', name: 'Retail 03', area: 56.46 },
    ]
  },
  {
    floor: 22,
    name: '22º Andar - Duplex Cobertura',
    spaces: [
      { id: 'dp1', name: 'Suite 2201', area: 42.0, featured: true },
      { id: 'dp2', name: 'Mezanino', area: 35.0 },
    ]
  }
];

// Feature 1: Upload e análise de planta
export function initFeature1_UploadPlant() {
  const html = `
    <div class="feature-panel" id="feature1">
      <h3>📸 Analisar Planta</h3>
      <input type="file" id="plantUpload" accept="image/*" style="margin: 10px 0;">
      <button id="analyzePlantBtn" class="btn-feature">Analisar</button>
      <div id="plantResult" style="margin-top: 15px; font-size: 12px;"></div>
    </div>
  `;
  return html;
}

export function setupFeature1Listeners() {
  const analyzeBtn = document.getElementById('analyzePlantBtn');
  const upload = document.getElementById('plantUpload');
  const result = document.getElementById('plantResult');

  analyzeBtn?.addEventListener('click', () => {
    if (!upload.files[0]) {
      result.innerHTML = '❌ Selecione uma imagem';
      return;
    }

    result.innerHTML = `
      <div style="background: #f0f4f8; padding: 10px; border-radius: 4px;">
        <strong>✅ Planta Analisada</strong><br/>
        Salas detectadas: ${mockPlantAnalysis.rooms.length}<br/>
        Confiança: ${(mockPlantAnalysis.confidence * 100).toFixed(0)}%<br/>
        <small>Janelas: ${mockPlantAnalysis.windows.length} | Portas: ${mockPlantAnalysis.doors.length}</small>
      </div>
    `;
  });
}

// Feature 2: Descrever espaço e gerar 3D
export function initFeature2_DescribeSpace() {
  const html = `
    <div class="feature-panel" id="feature2">
      <h3>🏢 Descrever Espaço</h3>
      <select id="spaceSelect" style="width: 100%; padding: 8px; margin: 10px 0;">
        <option>Escolha um espaço...</option>
        ${mockSpaceDescriptions.map((s, i) =>
          `<option value="${i}">${s.name}</option>`
        ).join('')}
      </select>
      <button id="generateSpaceBtn" class="btn-feature">Gerar 3D</button>
      <div id="spaceResult" style="margin-top: 15px; font-size: 12px;"></div>
    </div>
  `;
  return html;
}

export function setupFeature2Listeners() {
  const generateBtn = document.getElementById('generateSpaceBtn');
  const select = document.getElementById('spaceSelect');
  const result = document.getElementById('spaceResult');

  generateBtn?.addEventListener('click', () => {
    const idx = select.value;
    if (idx === '' || isNaN(idx)) {
      result.innerHTML = '❌ Selecione um espaço';
      return;
    }

    const space = mockSpaceDescriptions[parseInt(idx)];
    result.innerHTML = `
      <div style="background: #f0f4f8; padding: 10px; border-radius: 4px;">
        <strong>✅ Renderização Gerada</strong><br/>
        ${space.name}<br/>
        <small>${space.description}</small><br/>
        <div style="margin-top: 8px; display: flex; gap: 4px;">
          ${space.colors.map(c => `<div style="width: 20px; height: 20px; background: ${c}; border-radius: 2px;"></div>`).join('')}
        </div>
      </div>
    `;
  });
}

// Feature 3: Simulador de decoração
export function initFeature3_Decoration() {
  const html = `
    <div class="feature-panel" id="feature3">
      <h3>🎨 Simulador Decoração</h3>
      <select id="decorSelect" style="width: 100%; padding: 8px; margin: 10px 0;">
        <option>Escolha um estilo...</option>
        ${mockDecorationOptions.map((d, i) =>
          `<option value="${i}">${d.style}</option>`
        ).join('')}
      </select>
      <button id="simulateDecorBtn" class="btn-feature">Visualizar</button>
      <div id="decorResult" style="margin-top: 15px; font-size: 12px;"></div>
    </div>
  `;
  return html;
}

export function setupFeature3Listeners() {
  const simulateBtn = document.getElementById('simulateDecorBtn');
  const select = document.getElementById('decorSelect');
  const result = document.getElementById('decorResult');

  simulateBtn?.addEventListener('click', () => {
    const idx = select.value;
    if (idx === '' || isNaN(idx)) {
      result.innerHTML = '❌ Selecione um estilo';
      return;
    }

    const decor = mockDecorationOptions[parseInt(idx)];
    result.innerHTML = `
      <div style="background: #f0f4f8; padding: 10px; border-radius: 4px;">
        <strong>✅ Ambientação Simulada</strong><br/>
        <strong>${decor.style}</strong><br/>
        <small>${decor.description}</small><br/>
        Móveis: ${decor.furniture.join(', ')}<br/>
        <div style="margin-top: 8px; display: flex; gap: 4px;">
          ${decor.colors.map(c => `<div style="width: 25px; height: 25px; background: ${c}; border-radius: 2px; border: 1px solid #999;"></div>`).join('')}
        </div>
      </div>
    `;
  });
}

// Feature 4: Tour 360
export function initFeature4_Tour() {
  const html = `
    <div class="feature-panel" id="feature4">
      <h3>🌐 Tour 360°</h3>
      <select id="floorSelect" style="width: 100%; padding: 8px; margin: 10px 0;">
        <option>Escolha um andar...</option>
        ${mockTourFloors.map((f, i) =>
          `<option value="${i}">${f.name}</option>`
        ).join('')}
      </select>
      <button id="startTourBtn" class="btn-feature">Iniciar Tour</button>
      <div id="tourResult" style="margin-top: 15px; font-size: 12px;"></div>
    </div>
  `;
  return html;
}

export function setupFeature4Listeners() {
  const tourBtn = document.getElementById('startTourBtn');
  const select = document.getElementById('floorSelect');
  const result = document.getElementById('tourResult');

  tourBtn?.addEventListener('click', () => {
    const idx = select.value;
    if (idx === '' || isNaN(idx)) {
      result.innerHTML = '❌ Selecione um andar';
      return;
    }

    const floor = mockTourFloors[parseInt(idx)];
    const featured = floor.spaces.find(s => s.featured);
    result.innerHTML = `
      <div style="background: #f0f4f8; padding: 10px; border-radius: 4px;">
        <strong>✅ Tour Iniciado</strong><br/>
        ${floor.name}<br/>
        Espaços disponíveis: ${floor.spaces.length}<br/>
        <small>Visualizando: ${featured.name} (${featured.area}m²)</small><br/>
        <div style="margin-top: 8px; padding: 8px; background: #e0e8f0; border-radius: 3px; font-style: italic;">
          Navegação 360°: Use mouse ou toque para explorar
        </div>
      </div>
    `;
  });
}
