const fridge = document.querySelector('#fridge');
const door = document.querySelector('#main-door');
const drawer = document.querySelector('#vegetable-drawer');
const dragLayer = document.querySelector('#drag-layer');
const toast = document.querySelector('#toast');
const topCap = document.querySelector('.top-cap');
const doorFront = document.querySelector('.door-front');
const clockTime = document.querySelector('#clock-time');
const clockDate = document.querySelector('#clock-date');
const settingsButton = document.querySelector('#settings-button');
const settingsPanel = document.querySelector('#settings-panel');
const settingsList = document.querySelector('#settings-list');
const foodZone = document.querySelector('#food-zone');
const doorInside = document.querySelector('.door-inside');
const greenNote = document.querySelector('[data-memory-key="cool-vibes"]');
const yellowNote = document.querySelector('[data-memory-key="snack-note"]');

const INVENTORY = [
  { key: 'milk', category: 'Dairy & breakfast', label: 'Milk', detail: 'Milk cartons', className: 'food milk', content: 'MILK', parent: 'body', x: 32, y: 48 },
  { key: 'eggs', category: 'Dairy & breakfast', label: 'Eggs', detail: 'Egg cartons', className: 'food eggs', content: '&#129370;&#129370;', parent: 'body', x: 207, y: 84 },
  { key: 'cheese', category: 'Dairy & breakfast', label: 'Cheese', detail: 'Cheese blocks', className: 'food cheese', content: 'CHEESE', parent: 'body', x: 116, y: 190 },
  { key: 'yogurt', category: 'Dairy & breakfast', label: 'Yogurt', detail: 'Yogurt cups', className: 'food yogurt', content: 'YOGURT', parent: 'body', x: 150, y: 307 },
  { key: 'cake', category: 'Meals & treats', label: 'Cake', detail: 'Cake slices', className: 'food cake', content: '&#127856;', parent: 'body', x: 123, y: 55 },
  { key: 'bowl', category: 'Meals & treats', label: 'Noodle bowl', detail: 'Prepared bowls', className: 'food bowl', content: '&#127836;', parent: 'body', x: 218, y: 195 },
  { key: 'jam', category: 'Meals & treats', label: 'Jam', detail: 'Strawberry jam jars', className: 'food jar', content: 'JAM', parent: 'body', x: 35, y: 177 },
  { key: 'apples', category: 'Fruit', label: 'Apples', detail: 'Red and green apple packs', className: 'food apple-pack', content: '&#127822; &#127823;', parent: 'body', x: 33, y: 302 },
  { key: 'grape', category: 'Fruit', label: 'Grapes', detail: 'Fresh grape packs', className: 'food grapes', content: '&#127815;', parent: 'body', x: 231, y: 303 },
  { key: 'cola', category: 'Door rack drinks', label: 'Cola', detail: 'POP cans', className: 'drink can cola', content: '<b>POP</b>', parent: 'door', x: 52, y: 105 },
  { key: 'juice', category: 'Door rack drinks', label: 'Orange juice', detail: 'Orange bottles', className: 'drink bottle juice', content: '<span>&#127818;</span>', parent: 'door', x: 120, y: 91 },
  { key: 'lime', category: 'Door rack drinks', label: 'Lime soda', detail: 'Lime cans', className: 'drink can lime', content: '<b>LIME</b>', parent: 'door', x: 54, y: 235 },
  { key: 'water', category: 'Door rack drinks', label: 'Water', detail: 'Water bottles', className: 'drink bottle water', content: '<span>&#128167;</span>', parent: 'door', x: 128, y: 217 },
  { key: 'grapeSoda', category: 'Door rack drinks', label: 'Grape soda', detail: 'Grape cans', className: 'drink can grape-soda', content: '<b>GRAPE</b>', parent: 'door', x: 55, y: 374 },
  { key: 'tea', category: 'Door rack drinks', label: 'Tea', detail: 'Tea bottles', className: 'drink bottle tea', content: '<span>&#127861;</span>', parent: 'door', x: 130, y: 357 }
];

let doorOpen = false;
let drawerOpen = false;
let toastTimer;
let drinkDrag = null;
let fridgeDrag = null;
let drawerDrag = null;
let magnetDrag = null;
let suppressDoorClick = false;
let suppressDrawerClick = false;
let settingsOpen = false;
let currentSettings = Object.fromEntries(INVENTORY.map(item => [item.key, 0]));
let noteSettings = {
  green: 'COOL\nVIBES',
  yellow: "DON'T\nFORGET\nTHE SNACKS!"
};
const MEMORY_KEY = 'chilly-fridge-layout-v1';

async function readMemory() {
  try {
    const fileMemory = await window.desktopFridge?.loadLayout();
    if (fileMemory && (
      Object.keys(fileMemory.items || {}).length ||
      Object.keys(fileMemory.magnets || {}).length ||
      Object.keys(fileMemory.settings || {}).length
    )) {
      return fileMemory;
    }
    return JSON.parse(localStorage.getItem(MEMORY_KEY)) || { items: {}, magnets: {}, settings: {} };
  } catch {
    return { items: {}, magnets: {}, settings: {} };
  }
}

async function saveMemory() {
  const memory = {
    items: {},
    magnets: {},
    settings: { ...currentSettings, notes: noteSettings }
  };
  dragLayer.querySelectorAll('.draggable[data-name]').forEach(item => {
    memory.items[item.dataset.name] = {
      left: item.style.left,
      top: item.style.top,
      width: item.style.width,
      height: item.style.height
    };
  });
  document.querySelectorAll('.door-movable[data-memory-key]').forEach(item => {
    if (!item.style.left || !item.style.top) return;
    memory.magnets[item.dataset.memoryKey] = {
      left: item.style.left,
      top: item.style.top
    };
  });
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  try {
    await window.desktopFridge?.saveLayout(memory);
  } catch (error) {
    console.error('Could not save fridge layout file:', error);
  }
}

async function restoreMemory() {
  const memory = await readMemory();
  currentSettings = Object.fromEntries(
    INVENTORY.map(item => [item.key, clampCount(memory.settings?.[item.key] ?? 0)])
  );
  noteSettings = {
    green: String(memory.settings?.notes?.green ?? 'COOL\nVIBES'),
    yellow: String(memory.settings?.notes?.yellow ?? "DON'T\nFORGET\nTHE SNACKS!")
  };
  applyNoteText();
  renderStock();
  Object.entries(memory.items || {}).forEach(([name, position]) => {
    const item = document.querySelector(`.draggable[data-name="${CSS.escape(name)}"]`);
    if (!item) return;
    item.classList.add('floating-drink');
    item.style.left = position.left;
    item.style.top = position.top;
    item.style.width = position.width || '';
    item.style.height = position.height || '';
    dragLayer.appendChild(item);
  });
  Object.entries(memory.magnets || {}).forEach(([key, position]) => {
    const item = document.querySelector(`.door-movable[data-memory-key="${CSS.escape(key)}"]`);
    if (!item) return;
    item.style.left = position.left;
    item.style.top = position.top;
    item.style.right = 'auto';
    item.style.bottom = 'auto';
  });
  await saveMemory();
}

function clampCount(value) {
  return Math.max(0, Math.min(15, Number.parseInt(value, 10) || 0));
}

function applyNoteText() {
  greenNote.textContent = noteSettings.green;
  yellowNote.textContent = noteSettings.yellow;
  greenNote.style.fontSize = noteSettings.green.length > 55
    ? '8px'
    : noteSettings.green.length > 28 ? '10px' : '12px';
  yellowNote.style.fontSize = noteSettings.yellow.length > 90
    ? '8px'
    : noteSettings.yellow.length > 55 ? '10px' : '12px';
}

function renderStock() {
  INVENTORY.forEach(definition => {
    const count = currentSettings[definition.key];

    document.querySelectorAll(`[data-stock-type="${definition.key}"]`).forEach(item => {
      const itemNumber = Number.parseInt(item.dataset.name.slice(definition.key.length + 1), 10);
      if (itemNumber > count) item.remove();
    });

    for (let index = 0; index < count; index += 1) {
      const itemName = `${definition.key}-${index + 1}`;
      const existingItem = document.querySelector(`.draggable[data-name="${itemName}"]`);
      if (existingItem) continue;

      const item = document.createElement('div');
      item.className = `${definition.className} draggable`;
      item.dataset.name = itemName;
      item.dataset.stockType = definition.key;
      item.innerHTML = definition.content;
      const columnOffset = (index % 5) * 8;
      const rowOffset = Math.floor(index / 5) * 8;
      item.style.left = `${definition.x + columnOffset}px`;
      item.style.top = `${definition.y + rowOffset}px`;
      (definition.parent === 'door' ? doorInside : foodZone).appendChild(item);
      wireDraggable(item);
    }
  });
}

function renderSettingsForm() {
  settingsList.replaceChildren();
  let lastCategory = '';
  INVENTORY.forEach(definition => {
    if (definition.category !== lastCategory) {
      const heading = document.createElement('div');
      heading.className = 'settings-category';
      heading.textContent = definition.category;
      settingsList.appendChild(heading);
      lastCategory = definition.category;
    }

    const row = document.createElement('label');
    row.className = 'stock-row';
    row.innerHTML = `<span><b>${definition.label}</b><small>${definition.detail}</small></span>`;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '15';
    input.value = String(currentSettings[definition.key]);
    input.dataset.settingKey = definition.key;
    row.appendChild(input);
    settingsList.appendChild(row);
  });

  const heading = document.createElement('div');
  heading.className = 'settings-category';
  heading.textContent = 'Door notes';
  settingsList.appendChild(heading);

  [
    { key: 'green', label: 'Green note', value: noteSettings.green },
    { key: 'yellow', label: 'Yellow note', value: noteSettings.yellow }
  ].forEach(note => {
    const editor = document.createElement('label');
    editor.className = 'note-editor';
    const label = document.createElement('b');
    label.textContent = note.label;
    const textarea = document.createElement('textarea');
    textarea.maxLength = 120;
    textarea.value = note.value;
    textarea.dataset.noteKey = note.key;
    editor.append(label, textarea);
    settingsList.appendChild(editor);
  });
}

function setSettingsOpen(open) {
  settingsOpen = open;
  settingsPanel.classList.toggle('open', open);
  settingsButton.classList.toggle('active', open);
  fridge.classList.toggle('settings-state', open);
  dragLayer.classList.toggle('settings-hidden', open);
  settingsButton.setAttribute('aria-label', open ? 'Close fridge settings' : 'Open fridge settings');
  if (open) renderSettingsForm();
}

function message(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function setDoor(open) {
  if (!open && settingsOpen) setSettingsOpen(false);
  doorOpen = open;
  door.classList.toggle('open', open);
  door.classList.toggle('closed', !open);
  fridge.classList.toggle('open-state', open);
  dragLayer.classList.toggle('items-hidden', !open);
  dragLayer.setAttribute('aria-hidden', String(!open));
  door.setAttribute('aria-label', open ? 'Close refrigerator' : 'Open refrigerator');
}

function toggleDoor(event) {
  if (suppressDoorClick || drinkDrag || event.target.closest('.drink')) {
    suppressDoorClick = false;
    return;
  }
  if (doorOpen && drawerOpen) {
    message('Close the veggie drawer first! 🥕');
    fridge.classList.remove('blocked');
    void fridge.offsetWidth;
    fridge.classList.add('blocked');
    return;
  }
  setDoor(!doorOpen);
}

function toggleDrawer(event) {
  event.stopPropagation();
  if (suppressDrawerClick) {
    suppressDrawerClick = false;
    return;
  }
  if (!doorOpen) {
    message('Open the fridge door first!');
    return;
  }
  drawerOpen = !drawerOpen;
  drawer.classList.toggle('open', drawerOpen);
  drawer.classList.toggle('closed', !drawerOpen);
  drawer.setAttribute('aria-label', drawerOpen ? 'Close vegetable drawer' : 'Open vegetable drawer');
  message(drawerOpen ? 'Fresh veggies! 🥦' : 'Drawer closed ✓');
}

door.addEventListener('dblclick', event => {
  if (event.target.closest('.door-movable') || event.target.closest('.draggable')) return;
  toggleDoor(event);
});
drawer.addEventListener('click', toggleDrawer);
drawer.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') toggleDrawer(event);
});

function startDrinkDrag(event) {
  if (!doorOpen) return;
  event.preventDefault();
  event.stopPropagation();
  const item = event.currentTarget;
  const rect = item.getBoundingClientRect();
  const origin = {
    parent: item.parentElement,
    left: item.style.left,
    top: item.style.top,
    width: item.style.width,
    height: item.style.height
  };
  item.classList.add('floating-drink');
  item.style.left = `${rect.left}px`;
  item.style.top = `${rect.top}px`;
  item.style.width = `${rect.width}px`;
  item.style.height = `${rect.height}px`;
  dragLayer.appendChild(item);
  drinkDrag = {
    item,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
    origin
  };
  item.setPointerCapture?.(event.pointerId);
}

function wireDraggable(item) {
  item.addEventListener('pointerdown', startDrinkDrag);
}
document.querySelectorAll('.draggable').forEach(wireDraggable);

window.addEventListener('pointermove', event => {
  if (magnetDrag) {
    const frontRect = doorFront.getBoundingClientRect();
    const itemRect = magnetDrag.item.getBoundingClientRect();
    const x = Math.max(8, Math.min(frontRect.width - itemRect.width - 8, event.clientX - frontRect.left - magnetDrag.offsetX));
    const y = Math.max(8, Math.min(frontRect.height - itemRect.height - 8, event.clientY - frontRect.top - magnetDrag.offsetY));
    magnetDrag.item.style.left = `${x}px`;
    magnetDrag.item.style.top = `${y}px`;
    magnetDrag.item.style.right = 'auto';
    magnetDrag.item.style.bottom = 'auto';
    magnetDrag.moved = true;
    return;
  }
  if (drawerDrag) {
    const delta = event.clientY - drawerDrag.startY;
    const distance = Math.max(0, Math.min(70, drawerDrag.startOffset + delta));
    drawer.style.transform = `translateY(${distance}px)`;
    if (Math.abs(delta) > 4) {
      drawerDrag.moved = true;
      suppressDrawerClick = true;
    }
    return;
  }
  if (drinkDrag) {
    const fridgeRect = fridge.getBoundingClientRect();
    const itemRect = drinkDrag.item.getBoundingClientRect();
    const minX = Math.max(8, fridgeRect.left - 340);
    const maxX = Math.min(900 - itemRect.width - 8, fridgeRect.right + 190 - itemRect.width);
    const minY = Math.max(8, fridgeRect.top - 20);
    const maxY = Math.min(800 - itemRect.height - 35, fridgeRect.bottom + 35 - itemRect.height);
    const x = Math.max(minX, Math.min(maxX, event.clientX - drinkDrag.offsetX));
    const y = Math.max(minY, Math.min(maxY, event.clientY - drinkDrag.offsetY));
    drinkDrag.item.style.left = `${x}px`;
    drinkDrag.item.style.top = `${y}px`;
    if (Math.hypot(event.clientX - drinkDrag.startX, event.clientY - drinkDrag.startY) > 4) {
      drinkDrag.moved = true;
      suppressDoorClick = true;
    }
    return;
  }
  if (fridgeDrag) {
    const dx = event.screenX - fridgeDrag.screenX;
    const dy = event.screenY - fridgeDrag.screenY;
    if (dx || dy) {
      window.desktopFridge?.moveWindow(dx, dy);
      fridgeDrag.screenX = event.screenX;
      fridgeDrag.screenY = event.screenY;
      fridgeDrag.moved = true;
    }
  }
});

window.addEventListener('pointerup', event => {
  if (magnetDrag) {
    if (magnetDrag.moved) saveMemory();
    magnetDrag = null;
  }
  if (drawerDrag) {
    const transform = drawer.style.transform;
    const match = transform.match(/translateY\(([\d.]+)px\)/);
    const distance = match ? Number(match[1]) : (drawerOpen ? 70 : 0);
    drawerOpen = distance >= 30;
    drawer.classList.remove('dragging');
    drawer.classList.toggle('open', drawerOpen);
    drawer.classList.toggle('closed', !drawerOpen);
    drawer.style.transform = '';
    drawer.setAttribute('aria-label', drawerOpen ? 'Close vegetable drawer' : 'Open vegetable drawer');
    if (drawerDrag.moved) message(drawerOpen ? 'Drawer pulled open 🥦' : 'Drawer pushed closed ✓');
    drawerDrag = null;
  }
  if (drinkDrag) {
    const moved = drinkDrag.moved;
    if (!moved) {
      const { item, origin } = drinkDrag;
      item.classList.remove('floating-drink');
      item.style.left = origin.left;
      item.style.top = origin.top;
      item.style.width = origin.width;
      item.style.height = origin.height;
      origin.parent.appendChild(item);
    }
    drinkDrag = null;
    if (moved) {
      saveMemory();
      message('Position saved! It will be here next time ✨');
    }
  }
  if (fridgeDrag) {
    fridgeDrag = null;
  }
});

topCap.addEventListener('pointerdown', event => {
  if (event.target.closest('#quit') || event.target.closest('#settings-button')) return;
  event.preventDefault();
  fridgeDrag = { screenX: event.screenX, screenY: event.screenY, moved: false };
});

settingsButton.addEventListener('click', event => {
  event.stopPropagation();
  setSettingsOpen(!settingsOpen);
});

document.querySelector('#cancel-settings').addEventListener('click', () => setSettingsOpen(false));
document.querySelector('#save-settings').addEventListener('click', async () => {
  settingsList.querySelectorAll('[data-setting-key]').forEach(input => {
    currentSettings[input.dataset.settingKey] = clampCount(input.value);
  });
  settingsList.querySelectorAll('[data-note-key]').forEach(textarea => {
    noteSettings[textarea.dataset.noteKey] = textarea.value.trim() || ' ';
  });
  applyNoteText();
  renderStock();
  await saveMemory();
  setSettingsOpen(false);
  message('Fridge stock saved ✓');
});

drawer.addEventListener('pointerdown', event => {
  if (!doorOpen) return;
  event.preventDefault();
  event.stopPropagation();
  drawer.classList.add('dragging');
  drawerDrag = {
    startY: event.clientY,
    startOffset: drawerOpen ? 70 : 0,
    moved: false
  };
  drawer.setPointerCapture?.(event.pointerId);
});

document.querySelectorAll('.door-movable').forEach(item => {
  item.addEventListener('pointerdown', event => {
    if (doorOpen) return;
    event.preventDefault();
    event.stopPropagation();
    const itemRect = item.getBoundingClientRect();
    magnetDrag = {
      item,
      offsetX: event.clientX - itemRect.left,
      offsetY: event.clientY - itemRect.top,
      moved: false
    };
    item.setPointerCapture?.(event.pointerId);
  });
  item.addEventListener('dblclick', event => event.stopPropagation());
});

function updateClock() {
  const now = new Date();
  clockTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  clockDate.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
updateClock();
setInterval(updateClock, 1000);
restoreMemory();

document.querySelector('#quit').addEventListener('click', event => {
  event.stopPropagation();
  window.desktopFridge?.closeApp();
});

setDoor(false);
