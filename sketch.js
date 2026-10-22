// ==========================================
// 1. 題目資料設定 (換題目只需改此陣列)
// ==========================================
const ITEMS = [
  { id: 'apple',      name: 'Apple',      color: '#FF4D6D' },
  { id: 'banana',     name: 'Banana',     color: '#FFB703' },
  { id: 'strawberry', name: 'Strawberry', color: '#FF2A6D' },
  { id: 'grape',      name: 'Grape',      color: '#7209B7' },
  { id: 'orange',     name: 'Orange',     color: '#FB8500' },
  { id: 'watermelon', name: 'Watermelon', color: '#2A9D8F' }
];

// ==========================================
// 全局狀態與變數
// ==========================================
let cards = [];
let labels = [];
let slots = [null, null, null, null, null, null];

// 背景飄浮雲朵與星星資料
let clouds = [];
let stars = [];

// 互動狀態
let draggedLabel = null;
let selectedLabel = null;
let pointerStartX = 0;
let pointerStartY = 0;
let isDragging = false;

// 計時與成績狀態
let startTime = 0;
let timeSpent = 0;
let isSubmitted = false;
let score = 0;
let results = [];

// UI 按鈕
let submitBtn = { x: 0, y: 0, w: 180, h: 52, hovered: false };
let restartBtn = { x: 0, y: 0, w: 160, h: 48, hovered: false };

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Helvetica, Arial, sans-serif');

  // 初始化背景動態元素
  initBackgroundElements();

  // 初始化測驗
  initQuiz();
}

// 初始化背景裝飾 (雲朵與星星)
function initBackgroundElements() {
  clouds = [
    { x: width * 0.1, y: 80, scale: 0.8, speed: 0.3 },
    { x: width * 0.5, y: 120, scale: 1.1, speed: 0.2 },
    { x: width * 0.85, y: 60, scale: 0.9, speed: 0.4 }
  ];

  stars = [];
  for (let i = 0; i < 15; i++) {
    stars.push({
      x: random(width),
      y: random(height * 0.7),
      size: random(6, 12),
      phase: random(TWO_PI)
    });
  }
}

// 初始化/重新開始遊戲
function initQuiz() {
  cards = [];
  labels = [];
  slots = [null, null, null, null, null, null];
  draggedLabel = null;
  selectedLabel = null;
  isDragging = false;
  isSubmitted = false;
  score = 0;
  results = [];
  startTime = millis();

  let shuffledItems = shuffle([...ITEMS]);
  calculateLayout(shuffledItems);
}

// 響應式版面計算
function calculateLayout(shuffledItems) {
  let isMobile = width < 650;
  let cols = isMobile ? 2 : 3;
  let rows = isMobile ? 3 : 2;

  let cardAreaW = min(width * 0.92, 900);
  let cardW = (cardAreaW - (cols - 1) * 16) / cols;
  let cardH = isMobile ? 125 : 140;
  let startX = (width - cardAreaW) / 2;
  let startY = isMobile ? 90 : 100;

  // 卡片與放置格
  cards = [];
  for (let i = 0; i < ITEMS.length; i++) {
    let r = floor(i / cols);
    let c = i % cols;
    let cx = startX + c * (cardW + 16);
    let cy = startY + r * (cardH + 16);
    cards.push({
      item: ITEMS[i],
      x: cx,
      y: cy,
      w: cardW,
      h: cardH,
      slotY: cy + cardH - 34
    });
  }

  // 下方單字標籤
  let labelW = isMobile ? (cardAreaW - 12) / 2 : 135;
  let labelH = 40;
  let trayY = startY + rows * (cardH + 16) + 15;
  let trayCols = isMobile ? 2 : 3;
  let trayStartX = (width - (trayCols * labelW + (trayCols - 1) * 12)) / 2;

  labels = [];
  for (let i = 0; i < shuffledItems.length; i++) {
    let item = shuffledItems[i];
    let r = floor(i / trayCols);
    let c = i % trayCols;
    let lx = trayStartX + c * (labelW + 12);
    let ly = trayY + r * (labelH + 12);

    let currentSlot = slots.indexOf(item.id);

    labels.push({
      id: item.id,
      text: item.name,
      x: currentSlot !== -1 ? cards[currentSlot].x + (cards[currentSlot].w - labelW) / 2 : lx,
      y: currentSlot !== -1 ? cards[currentSlot].slotY : ly,
      origX: lx,
      origY: ly,
      w: labelW,
      h: labelH,
      placedSlot: currentSlot
    });
  }

  // 交卷按鈕位置
  let lastTrayY = trayY + ceil(shuffledItems.length / trayCols) * (labelH + 12);
  submitBtn.x = width / 2 - submitBtn.w / 2;
  submitBtn.y = min(lastTrayY + 20, height - 75);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initBackgroundElements();
  let currentShuffled = labels.map(l => ITEMS.find(it => it.id === l.id));
  calculateLayout(currentShuffled);
}

// ==========================================
// 繪圖主流程 (每秒 60 幀)
// ==========================================
function draw() {
  if (!isSubmitted) {
    timeSpent = floor((millis() - startTime) / 1000);
  }

  // 1. 繪製精美豐富背景
  drawRichBackground();

  // 2. 頂部標題與計時器
  drawHeader();

  // 3. 水果卡片與目標格
  drawFruitCards();

  // 4. 單字標籤
  drawLabels();

  // 5. 交卷按鈕
  if (!isSubmitted) {
    drawSubmitButton();
  }

  // 6. 結算彈窗
  if (isSubmitted) {
    drawResultModal();
  }
}

// ==========================================
// 豐富童趣背景繪製
// ==========================================
function drawRichBackground() {
  // 天空漸層 (藍色到溫馨淺粉)
  for (let y = 0; y < height; y += 4) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color('#E0F2FE'), color('#FFF1F2'), inter);
    stroke(c);
    strokeWeight(4);
    line(0, y, width, y);
  }

  // 左上角夢幻彩虹
  noFill();
  strokeWeight(6);
  let rainbowX = 60, rainbowY = 60;
  stroke('rgba(255, 107, 107, 0.35)'); arc(rainbowX, rainbowY, 160, 160, -PI*0.2, PI*0.7);
  stroke('rgba(255, 217, 61, 0.35)');  arc(rainbowX, rainbowY, 146, 146, -PI*0.2, PI*0.7);
  stroke('rgba(78, 205, 196, 0.35)');  arc(rainbowX, rainbowY, 132, 132, -PI*0.2, PI*0.7);

  // 遠處綿延山丘
  noStroke();
  fill('#D1FAE5'); // 淺綠綠山
  ellipse(width * 0.2, height + 80, width * 0.7, 300);
  fill('#A7F3D0'); // 中綠山丘
  ellipse(width * 0.8, height + 100, width * 0.8, 320);

  // 飄浮星星閃爍
  for (let s of stars) {
    let alpha = map(sin(frameCount * 0.05 + s.phase), -1, 1, 80, 230);
    fill(255, 217, 61, alpha);
    push();
    translate(s.x, s.y);
    rotate(frameCount * 0.01 + s.phase);
    rect(-s.size/2, -s.size/2, s.size, s.size, 2);
    pop();
  }

  // 移動的白雲
  for (let cloud of clouds) {
    cloud.x += cloud.speed;
    if (cloud.x - 100 > width) cloud.x = -100;

    push();
    translate(cloud.x, cloud.y);
    scale(cloud.scale);
    fill('rgba(255, 255, 255, 0.85)');
    noStroke();
    ellipse(0, 0, 60, 40);
    ellipse(-20, 5, 40, 30);
    ellipse(20, 5, 45, 30);
    pop();
  }
}

// 頂部 UI
function drawHeader() {
  // 標題外框裝飾卡片
  rectMode(CORNER);
  stroke('rgba(255, 255, 255, 0.8)');
  strokeWeight(2);
  fill('rgba(255, 255, 255, 0.85)');
  rect(width / 2 - 180, 12, 360, 58, 30);

  fill('#1E293B');
  textAlign(CENTER, TOP);
  textSize(20);
  textStyle(BOLD);
  text("🍓 水果單字連連看 🍌", width / 2, 20);

  textSize(13);
  textStyle(NORMAL);
  fill('#64748B');
  let mins = nf(floor(timeSpent / 60), 2);
  let secs = nf(timeSpent % 60, 2);
  text(`⏱️ 時間：${mins}:${secs}`, width / 2, 45);
}

// 水果卡片繪製
function drawFruitCards() {
  let t = frameCount * 0.05;

  for (let i = 0; i < cards.length; i++) {
    let c = cards[i];

    // 卡片柔和陰影
    noStroke();
    fill('rgba(0, 0, 0, 0.04)');
    rect(c.x + 3, c.y + 4, c.w, c.h, 16);

    // 卡片背景
    stroke('#E2E8F0');
    strokeWeight(1.5);
    fill('#FFFFFF');
    rect(c.x, c.y, c.w, c.h, 16);

    // 動態水果圖案 (向量微動畫)
    push();
    translate(c.x + c.w / 2, c.y + (c.h - 38) / 2);
    let floatY = sin(t + i) * 4;
    translate(0, floatY);
    scale(c.w / 220);
    drawAnimatedFruit(c.item.id, t + i);
    pop();

    // 放置目標格 (點點虛線視覺感)
    if (selectedLabel !== null && slots[i] === null) {
      stroke('#3B82F6');
      strokeWeight(2);
      fill('#EFF6FF');
    } else {
      stroke('#CBD5E1');
      strokeWeight(1.5);
      fill('#F8FAFC');
    }
    rect(c.x + 8, c.slotY, c.w - 16, 28, 8);

    if (slots[i] === null) {
      noStroke();
      fill('#94A3B8');
      textAlign(CENTER, CENTER);
      textSize(12);
      text("放入單字", c.x + c.w / 2, c.slotY + 14);
    }
  }
}

// 單字標籤繪製
function drawLabels() {
  for (let l of labels) {
    if (l === draggedLabel) continue;

    let isSelected = (l === selectedLabel);

    // 標籤陰影
    noStroke();
    fill('rgba(0, 0, 0, 0.06)');
    rect(l.x + 2, l.y + 3, l.w, l.h, 10);

    // 標籤主體
    stroke(isSelected ? '#3B82F6' : '#E2E8F0');
    strokeWeight(isSelected ? 2.5 : 1);
    fill(isSelected ? '#E0F2FE' : '#FFFFFF');
    rect(l.x, l.y, l.w, l.h, 10);

    // 文字
    noStroke();
    fill('#1E293B');
    textAlign(CENTER, CENTER);
    textSize(15);
    textStyle(BOLD);
    text(l.text, l.x + l.w / 2, l.y + l.h / 2);
  }

  // 繪製拖曳中的標籤 (最頂層)
  if (draggedLabel) {
    let l = draggedLabel;
    noStroke();
    fill('rgba(59, 130, 246, 0.2)');
    rect(l.x + 4, l.y + 5, l.w, l.h, 10);

    stroke('#3B82F6');
    strokeWeight(2.5);
    fill('#FFFFFF');
    rect(l.x, l.y, l.w, l.h, 10);

    noStroke();
    fill('#1E293B');
    textAlign(CENTER, CENTER);
    textSize(15);
    textStyle(BOLD);
    text(l.text, l.x + l.w / 2, l.y + l.h / 2);
  }
}

// 交卷按鈕
function drawSubmitButton() {
  submitBtn.hovered = mouseX >= submitBtn.x && mouseX <= submitBtn.x + submitBtn.w &&
                     mouseY >= submitBtn.y && mouseY <= submitBtn.y + submitBtn.h;

  // 按鈕陰影
  noStroke();
  fill('rgba(37, 99, 235, 0.2)');
  rect(submitBtn.x + 2, submitBtn.y + 4, submitBtn.w, submitBtn.h, 26);

  stroke(submitBtn.hovered ? '#1D4ED8' : '#2563EB');
  strokeWeight(1.5);
  fill(submitBtn.hovered ? '#1E40AF' : '#3B82F6');
  rect(submitBtn.x, submitBtn.y, submitBtn.w, submitBtn.h, 26);

  noStroke();
  fill('#FFFFFF');
  textAlign(CENTER, CENTER);
  textSize(16);
  textStyle(BOLD);
  text("交卷看成績 🚀", submitBtn.x + submitBtn.w / 2, submitBtn.y + submitBtn.h / 2);
}

// ==========================================
// 拖曳與點擊事件處理 (Pointer Events)
// ==========================================
function mousePressed() { pointerDown(mouseX, mouseY); }
function touchStarted() { pointerDown(touches[0].x, touches[0].y); return false; }

function mouseDragged() { pointerMove(mouseX, mouseY); }
function touchMoved() { pointerMove(touches[0].x, touches[0].y); return false; }

function mouseReleased() { pointerUp(); }
function touchEnded() { pointerUp(); return false; }

function pointerDown(px, py) {
  if (isSubmitted) {
    if (px >= restartBtn.x && px <= restartBtn.x + restartBtn.w &&
        py >= restartBtn.y && py <= restartBtn.y + restartBtn.h) {
      initQuiz();
    }
    return;
  }

  if (px >= submitBtn.x && px <= submitBtn.x + submitBtn.w &&
      py >= submitBtn.y && py <= submitBtn.y + submitBtn.h) {
    checkAnswers();
    return;
  }

  for (let l of labels) {
    if (px >= l.x && px <= l.x + l.w && py >= l.y && py <= l.y + l.h) {
      draggedLabel = l;
      pointerStartX = px;
      pointerStartY = py;
      isDragging = false;
      return;
    }
  }

  if (selectedLabel) {
    for (let i = 0; i < cards.length; i++) {
      let c = cards[i];
      if (px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h) {
        placeLabelInSlot(selectedLabel, i);
        selectedLabel = null;
        return;
      }
    }
    selectedLabel = null;
  }
}

function pointerMove(px, py) {
  if (!draggedLabel) return;

  let distMoved = dist(px, py, pointerStartX, pointerStartY);
  if (distMoved > 6) {
    isDragging = true;
    selectedLabel = null;
  }

  if (isDragging) {
    draggedLabel.x = px - draggedLabel.w / 2;
    draggedLabel.y = py - draggedLabel.h / 2;
  }
}

function pointerUp() {
  if (!draggedLabel) return;

  if (!isDragging) {
    selectedLabel = (selectedLabel === draggedLabel) ? null : draggedLabel;
  } else {
    let targetSlotIndex = -1;
    for (let i = 0; i < cards.length; i++) {
      let c = cards[i];
      let centerX = draggedLabel.x + draggedLabel.w / 2;
      let centerY = draggedLabel.y + draggedLabel.h / 2;
      if (centerX >= c.x && centerX <= c.x + c.w && centerY >= c.y && centerY <= c.y + c.h) {
        targetSlotIndex = i;
        break;
      }
    }

    if (targetSlotIndex !== -1) {
      placeLabelInSlot(draggedLabel, targetSlotIndex);
    } else {
      if (draggedLabel.placedSlot !== -1) {
        slots[draggedLabel.placedSlot] = null;
        draggedLabel.placedSlot = -1;
      }
      draggedLabel.x = draggedLabel.origX;
      draggedLabel.y = draggedLabel.origY;
    }
  }

  draggedLabel = null;
  isDragging = false;
}

function placeLabelInSlot(labelObj, slotIndex) {
  let oldSlot = labelObj.placedSlot;
  let existingLabelId = slots[slotIndex];

  if (existingLabelId !== null && existingLabelId !== labelObj.id) {
    let existingLabel = labels.find(l => l.id === existingLabelId);
    if (oldSlot !== -1) {
      slots[oldSlot] = existingLabel.id;
      existingLabel.placedSlot = oldSlot;
      existingLabel.x = cards[oldSlot].x + (cards[oldSlot].w - existingLabel.w) / 2;
      existingLabel.y = cards[oldSlot].slotY;
    } else {
      existingLabel.placedSlot = -1;
      existingLabel.x = existingLabel.origX;
      existingLabel.y = existingLabel.origY;
    }
  } else if (oldSlot !== -1) {
    slots[oldSlot] = null;
  }

  slots[slotIndex] = labelObj.id;
  labelObj.placedSlot = slotIndex;
  labelObj.x = cards[slotIndex].x + (cards[slotIndex].w - labelObj.w) / 2;
  labelObj.y = cards[slotIndex].slotY;
}

// ==========================================
// 計算成績與彈窗
// ==========================================
function checkAnswers() {
  score = 0;
  results = [];
  for (let i = 0; i < cards.length; i++) {
    let correctId = cards[i].item.id;
    let userAns = slots[i];
    let isCorrect = (correctId === userAns);
    results.push(isCorrect);
    if (isCorrect) score += 1;
  }
  isSubmitted = true;
}

function drawResultModal() {
  fill('rgba(15, 23, 42, 0.65)');
  rect(0, 0, width, height);

  let modalW = min(width * 0.88, 440);
  let modalH = 390;
  let mx = width / 2 - modalW / 2;
  let my = height / 2 - modalH / 2;

  stroke('#E2E8F0');
  strokeWeight(1);
  fill('#FFFFFF');
  rect(mx, my, modalW, modalH, 24);

  let finalScore = round((score / ITEMS.length) * 100);
  fill('#1E293B');
  textAlign(CENTER, TOP);
  textSize(22);
  textStyle(BOLD);
  text(finalScore === 100 ? "🎉 全對太棒了！" : "👏 完成測驗！繼續加油！", width / 2, my + 24);

  // 得分圓圈
  noStroke();
  fill(finalScore >= 60 ? '#10B981' : '#F59E0B');
  ellipse(width / 2, my + 105, 80, 80);

  fill('#FFFFFF');
  textSize(28);
  text(`${finalScore}分`, width / 2, my + 92);

  fill('#64748B');
  textSize(14);
  textStyle(NORMAL);
  let mins = floor(timeSpent / 60);
  let secs = timeSpent % 60;
  text(`⏱️ 總用時：${mins > 0 ? mins + '分' : ''}${secs}秒`, width / 2, my + 160);

  // 答題清單
  let listY = my + 195;
  let itemH = 22;
  textAlign(LEFT, CENTER);
  textSize(13);

  for (let i = 0; i < cards.length; i++) {
    let item = cards[i].item;
    let isCorrect = results[i];
    let lx = width / 2 - 100;
    let ly = listY + i * itemH;

    fill(isCorrect ? '#10B981' : '#EF4444');
    text(isCorrect ? "✓" : "✕", lx, ly);

    fill('#334155');
    text(`${item.name}`, lx + 22, ly);

    fill('#94A3B8');
    let placedId = slots[i];
    let placedItem = ITEMS.find(it => it.id === placedId);
    text(placedItem ? `(${placedItem.name})` : '(未填)', lx + 120, ly);
  }

  // 重新開始按鈕
  restartBtn.x = width / 2 - restartBtn.w / 2;
  restartBtn.y = my + modalH - 60;

  restartBtn.hovered = mouseX >= restartBtn.x && mouseX <= restartBtn.x + restartBtn.w &&
                      mouseY >= restartBtn.y && mouseY <= restartBtn.y + restartBtn.h;

  stroke(restartBtn.hovered ? '#059669' : '#10B981');
  fill(restartBtn.hovered ? '#047857' : '#10B981');
  rect(restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h, 24);

  fill('#FFFFFF');
  textAlign(CENTER, CENTER);
  textSize(15);
  textStyle(BOLD);
  text("🔄 再試一次", restartBtn.x + restartBtn.w / 2, restartBtn.y + restartBtn.h / 2);
}

// ==========================================
// 6 種活潑動態水果繪製
// ==========================================
function drawAnimatedFruit(type, t) {
  noStroke();

  if (type === 'apple') {
    fill('#FF4D6D');
    ellipse(0, 0, 52, 48);
    stroke('#8B4513'); strokeWeight(3); line(0, -22, 0, -30);
    noStroke(); fill('#10B981'); ellipse(6, -28, 12, 6);
    fill('#1E293B'); ellipse(-10, -2, 5, 5); ellipse(10, -2, 5, 5);
    fill('rgba(255, 182, 193, 0.7)'); ellipse(-16, 4, 8, 5); ellipse(16, 4, 8, 5);

  } else if (type === 'banana') {
    rotate(sin(t * 2) * 0.12);
    fill('#FFB703');
    arc(0, -5, 58, 48, 0.2, PI - 0.2, CHORD);
    fill('#1E293B'); ellipse(-8, 5, 5, 5); ellipse(12, 5, 5, 5);
    fill('rgba(255, 182, 193, 0.7)'); ellipse(-14, 10, 6, 4); ellipse(18, 10, 6, 4);

  } else if (type === 'strawberry') {
    fill('#FF2A6D');
    triangle(-26, -10, 26, -10, 0, 30);
    arc(0, -10, 52, 22, PI, 0);
    fill('#10B981'); ellipse(0, -20, 32, 9);
    fill('#FFFFFF'); ellipse(-8, 0, 2, 4); ellipse(8, 2, 2, 4); ellipse(0, 14, 2, 4);
    fill('#1E293B'); ellipse(-7, -4, 4, 4); ellipse(7, -4, 4, 4);

  } else if (type === 'grape') {
    fill('#7209B7');
    ellipse(-10, -10, 18, 18); ellipse(10, -10, 18, 18);
    ellipse(0, -2, 18, 18); ellipse(-8, 10, 16, 16); ellipse(8, 10, 16, 16);
    ellipse(0, 20, 14, 14);
    stroke('#10B981'); strokeWeight(2.5); line(0, -18, 0, -26);
    noStroke(); fill('#1E293B'); ellipse(-4, -2, 3, 3); ellipse(4, -2, 3, 3);

  } else if (type === 'orange') {
    fill('#FB8500');
    ellipse(0, 0, 50, 50);
    fill('#10B981'); ellipse(0, -25, 10, 6);
    fill('#1E293B'); ellipse(-9, -2, 5, 5); ellipse(9, -2, 5, 5);
    fill('rgba(255, 255, 255, 0.8)'); ellipse(-14, -10, 7, 7);

  } else if (type === 'watermelon') {
    fill('#2A9D8F');
    arc(0, -5, 56, 52, 0, PI);
    fill('#FF4D6D');
    arc(0, -5, 48, 42, 0, PI);
    fill('#1E293B');
    ellipse(-10, 8, 4, 4); ellipse(10, 8, 4, 4);
    ellipse(-16, 4, 2, 4); ellipse(16, 4, 2, 4);
  }
}