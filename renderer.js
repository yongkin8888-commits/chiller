const fridge = document.querySelector('#fridge');
const door = document.querySelector('#main-door');
const drawer = document.querySelector('#vegetable-drawer');
const dragLayer = document.querySelector('#drag-layer');
const toast = document.querySelector('#toast');
const topCap = document.querySelector('.top-cap');
const doorFront = document.querySelector('.door-front');
const clockTime = document.querySelector('#clock-time');
const clockDate = document.querySelector('#clock-date');

let doorOpen = false;
let drawerOpen = false;
let toastTimer;
let drinkDrag = null;
let fridgeDrag = null;
let drawerDrag = null;
let magnetDrag = null;
let suppressDoorClick = false;
let suppressDrawerClick = false;
const MEMORY_KEY = 'chilly-fridge-layout-v1';

async function readMemory() {
  try {
    const fileMemory = await window.desktopFridge?.loadLayout();
    if (fileMemory && (Object.keys(fileMemory.items || {}).length || Object.keys(fileMemory.magnets || {}).length)) {
      return fileMemory;
    }
    return JSON.parse(localStorage.getItem(MEMORY_KEY)) || { items: {}, magnets: {} };
  } catch {
    return { items: {}, magnets: {} };
  }
}

async function saveMemory() {
  const memory = { items: {}, magnets: {} };
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

function message(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function setDoor(open) {
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
  if (event.target.closest('#quit')) return;
  event.preventDefault();
  fridgeDrag = { screenX: event.screenX, screenY: event.screenY, moved: false };
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
