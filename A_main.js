var cnv = null;
var ctx = null;
var pup = null;
var ball = null;
var blocks = null;
var musicEng = null;
var controller = null;

var startScreen   = null;   // режим игрового меню
var startScreen1  = null;   // флаг одного из двух вариантов картинки игрового меню
var victoryScreen = null;   // режим финального меню
var gameoverScreen = null;  // режим меню проигрыша
var gameoverScreen1 = null; // флаг одного из двух вариантов картинки меню проигрыша

var musicBtn = null;     // кнопка-включатель музыки в браузере (DOM)
var soundBtn = null;     // кнопка-включатель звуков в браузере (DOM)
var musicStatus = false; // флаг состояния музыки
var soundStatus = false; // флаг состояния звуков

var xOffset = null;      // отступ канваса от левого края окна браузера
var yOffset = null;      // отступ канваса от верхнего края окна браузера

var paused = false;      // состояние игры - на паузе/снята с паузы
var maxScore = null;     // максимальное количество баллов на уровне
var score = 0;           // текущее количество баллов

var levelsQuantity = null; // количество уровней

var X = null;            // координаты курсора мыши в окне браузера
var Y = null;

var quantityOfPlayingBlocks = 0; // количество игровых блоков (для контроля победы)



// ЗАДАВАЕМЫЕ ПАРАМЕТРЫ НАЧАЛО //

var level = 0;               // начальный уровень (порядковый номер из A_levels.js)
var lifes = 3;               // начальное количество жизней

var musicVolume  = 0.02;     // громкость музыки от 0.0 до 1.0 
var soundVolume  = 0.10;     // громкость звуков от 0.0 до 1.0
var openTrackNum = 1;        // первый трек (от 0 до последнего номера в musicEng.playList)

var indent = 3;              // отступ между блоками
var addedScores = 10;        // количество добавляемых баллов (одинаково для всего)
var powerupProbability = 0.2 // вероятность 0.1 = 10%

// ЗАДАВАЕМЫЕ ПАРАМЕТРЫ КОНЕЦ //



// ИНИЦИАЛИЗАЦИЯ //
window.onload = init;
function init() {

  // КАНВАС //
  cnv = document.getElementById('canvas');
  ctx = cnv.getContext('2d');
  cnv.width = 692;
  cnv.height = 400; //window.innerHeight

  yOffset = (window.innerHeight - cnv.height)/2;
  xOffset = (window.innerWidth - cnv.width)/2;

  cnv.style.left = xOffset + "px";
  cnv.style.top = yOffset + "px";
  cnv.style.position = "fixed";
  // КАНВАС КОНЕЦ //  


  // АУДИО //
  musicEng = new Audio(musicVolume, soundVolume, openTrackNum);
  musicEng.makePlayList();
  //musicEng.playList[openTrackNum].asset.autoplay = true;
  // АУДИО КОНЕЦ //

  
  window.onmousemove = takeCoords;
  cnv.onclick = startButton.startGame;


  // КНОПКИ //
  musicBtn = document.getElementById('musicBtn');
  soundBtn = document.getElementById('soundBtn');

  musicBtn.value = "Music: ON";
  soundBtn.value = "Sound: ON";

  musicBtn.onclick = audioController;
  soundBtn.onclick = audioController;
  // КНОПКИ КОНЕЦ //

  
  loadSprites();  

  startScreen = true;
  startScreen1 = true;
  victoryScreen = false;
  gameoverScreen = false;
  gameoverScreen1 = false;

  levelsQuantity = levels.length;

  gameLoop();  
};


function audioController(event) {
  
  var btn = event.target;
  var curTrack = musicEng.playList[openTrackNum].asset;
  var curSound = musicEng.soundList.hit_all;
  
  if (btn.id == 'musicBtn') {
    if (musicStatus) {
      if (curTrack.paused) {
        curTrack.play();
        musicBtn.value = "Music: OFF";
      }
      else {
        curTrack.pause();
        musicBtn.value = "Music: ON";
      }      
    }

    else {
      curTrack.play();
      musicBtn.value = "Music: OFF";
      musicStatus = true;
    }
  }
  

  else if (btn.id == 'soundBtn') {
    if (soundStatus) {
      soundStatus = false;
      soundBtn.value = "Sound: ON";
    }

    else {
      soundStatus = true;
      soundBtn.value = "Sound: OFF";
    }
  }

  curSound.play();
  btn.blur(); // снятие фокуса с кнопки, а то начинает реагировать на пробел
};


function soundControl(soundType) {
  if (soundStatus) musicEng.soundList[soundType].play();
};



function initGame() {
  pup = new Pup();
  ball = new Ball();
  ball.balls.push(new ball.ballObject());
  blocks = new Blocks();

  window.addEventListener('keydown', controller.keyPress);
  window.addEventListener('keyup', controller.keyRelease);

  platform.init();
  createLevel(level);
};


function loadSprites() {
  for (var prop in sprites) {
    sprites[prop] = new Image();
    sprites[prop].src = "images/" + prop + ".png";
  }
};

function takeCoords(e) {
  X = e.clientX - xOffset;
  Y = e.clientY - yOffset;
};


function gameLoop() {
  update();
  render();

  if (!paused) requestAnimationFrame(gameLoop);
};

function update() {

  musicEng.update();

  //РЕЖИМ ИГРОВОГО МЕНЮ//
  if (startScreen) {
    startButton.update();
  }

  //РЕЖИМ МЕНЮ ПРОИГРЫША//
  else if (gameoverScreen) {
    gameoverButton.update();
  }

  //РЕЖИМ ПОБЕДНОГО МЕНЮ//
  else if (victoryScreen) return;

  //РЕЖИМ ИГРЫ//
  else {
    blocks.update();
    pup.update();
    platform.update(); //сначала обновл платформу, потом мяч - иначе на отрисовке мяч отстает от платформы
    ball.update();   

    // контроль победы
    if (countBrokenBlocks() == quantityOfPlayingBlocks) gameStatus('win');        
  }
};

function render() {

  ctx.clearRect(0, 0, cnv.width, cnv.height);

  //РЕЖИМ ИГРОВОГО МЕНЮ//
  if (startScreen) {
    if (startScreen1)
      ctx.drawImage(sprites["startScreen1"], 0, 0);
    else
      ctx.drawImage(sprites["startScreen2"], 0, 0);

    //startButton.render();
  }

  //РЕЖИМ МЕНЮ ПРОИГРЫША//
  else if (gameoverScreen) {
    if (gameoverScreen1)
      ctx.drawImage(sprites["gameoverScreen1"], 0, 0);
    else
      ctx.drawImage(sprites["gameoverScreen2"], 0, 0);

    //gameoverButton.render();
  } 

  //РЕЖИМ ПОБЕДНОГО МЕНЮ//
  else if (victoryScreen) {
    ctx.drawImage(sprites["victoryScreen"], 0, 0);
  }

  //РЕЖИМ ИГРЫ//
  else {
    ctx.drawImage(sprites["background"], 0, 0);
    blocks.render();
    pup.render();
    platform.render(); 
    ball.render();

    // вывод информации на экран
    statusPanel();
  }  
};

var startButton = {
  x: 270,
  y: 225,
  w: 185,
  h: 45,

  update: function() {
    if (X >= this.x && X <= this.x+this.w && Y >= this.y && Y <= this.y+this.h) {

      if (startScreen1) {
        startScreen1 = false;
        soundControl('hit_all');
      }
      
    }
    else {
      startScreen1 = true;
    }
  },

  startGame: function() {
    if (!startScreen1) {
      soundControl('hit_all');
      initGame();
      startScreen = false;
      startScreen1 = true;
      cnv.onclick = null;
    }
  },

  render: function() {
    ctx.strokeStyle = "red";
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
};



var gameoverButton = {
  x: 255,
  y: 210,
  w: 210,
  h: 35,

  update: function() {
    if (X >= this.x && X <= this.x+this.w && Y >= this.y && Y <= this.y+this.h) {

      if (gameoverScreen1) {
        gameoverScreen1 = false;
        soundControl('hit_all');
      }
      
    }
    else {
      gameoverScreen1 = true;
    }
  },

  restartGame: function() {
    if (!gameoverScreen1) {
      soundControl('hit_all');
      gameoverScreen = false;
      gameoverScreen1 = true;
      cnv.onclick = null;
      
      createLevel(level);      
    }
  },

  render: function() {
    ctx.strokeStyle = "red";
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
};




function makePowerup() {
  var numb = Math.random();

  if (numb < powerupProbability) return true;
  else return false;
};

function dropPowerup(block) {
  var X = block.x;
  var Y = block.y;

  if (makePowerup()) {    
    var type = choosePowerup();

    pup.makeNew({x: X, y: Y, powerap: type});
  }
};

function choosePowerup() {
  // все бусты будут выпадать с одинаковой вероятностью
  var powerupsQuantity = pup.powerupsLib.length - 1;       // -1 потому что 1 лишний
  var eachPowerupProbability = (100/powerupsQuantity)/100; // вероятность выпадения любого паверапа

  //console.log('eachPowerupProbability ' + eachPowerupProbability);

  var num = Math.random();

  for (var i = 1; i <= powerupsQuantity; i++) {
    if ((num >= (i - 1) * eachPowerupProbability) && (num <= i * eachPowerupProbability)) {

      var chosenOne = pup.powerupsLib[i - 1];
      return chosenOne;      
    }
  }
};


function createLevel(lvl) {
  score = 0;
  quantityOfPlayingBlocks = 0;

  var map = levels[lvl];
  //i - строка; j - столбец
  for (var i in map) {
    for (var j in map[i]) {
      //console.log(i + ', ' + j);
      blocks.blocks.push(new blocks.BlockObject({
        x: (50 + indent)*j + indent, //полсе плюса - отступ от левого края 70
        y: (25 + indent)*i + indent, //50
        w: 50,
        h: 25,
        type: blocks.lib[map[i][j]].type,
        hp: blocks.lib[map[i][j]].hp,
        //color: blocks.lib[map[i][j]].color,
        name: blocks.lib[map[i][j]].name
      }));      
    }
  }
  
  
  for (var t = 0; t < blocks.blocks.length; t++) {
    var curBlock = blocks.blocks[t];

    // номера блоков-телепортов
    if (curBlock.type == 'teleport') {
      blocks.numbersOfTeleports.push(t);
    }

    // задание флагу isAlive пустых блоков значения false
    if (curBlock.type == 'empty') {
      curBlock.isAlive = false;
    }

    // подсчет игровых блоков для контроля победы
    if (curBlock.type == 'bone' || curBlock.type == 'wood' || 
        curBlock.type == 'stone' || curBlock.type == 'mine') {

      quantityOfPlayingBlocks++;
      blocks.numbersOfPlayingBlocks.push(t);
    }
  }

  blocks.teleportsQuantity = blocks.numbersOfTeleports.length;
  
  blocks.implementExtraScore(); // вставка доп баллов в блоки
  maxScore = (quantityOfPlayingBlocks + blocks.amountOfExtraScoreBlocks) * addedScores;   
};



function gameStatus (status) {
  if (status == 'win') {
    level += 1;     

    // учет выпавших контейнеров с экстрабаллами
    for (var b in pup.powerups) {
      if (pup.powerups[b].type == 'extraScore') {
        score += addedScores;
      }
    }

    soundControl('victory');

         
    // ПЕРЕКЛЮЧЕНИЕ НА СЛЕДУЮЩИЙ УРОВЕНЬ
    if (level < levels.length) {
      alert('Победа!' + '\n' + 'Набрано баллов: ' + score + ' из ' + maxScore)

      blocks = new Blocks();
      createLevel(level);
      reload();
      pup.powerups = [];
      pup.machinegunController.bullets = [];
    }

    // ПЕРЕКЛЮЧЕНИЕ НА ЭКРАН ПОБЕДЫ
    else {
      victoryScreen = true;

      blocks = new Blocks();
      reload();
      pup.powerups = [];
      pup.machinegunController.bullets = [];

      musicEng.playList[musicEng.curTrackNum].asset.pause();
      musicEng.soundList.victory_final.volume = 0.25; // сам трек очень тихий
      soundControl('victory_final');
    }
  }


  // ПЕРЕКЛЮЧЕНИЕ НА ЭКРАН ПРОИГРЫША
  else {
    gameoverScreen = true;    

    blocks = new Blocks();
    reload();
    pup.powerups = [];
    pup.machinegunController.bullets = [];

    lifes = 3;
    level = 0;

    cnv.onclick = gameoverButton.restartGame;
  }
};


function countBrokenBlocks() {
  var quantityOfBrokenBlocks = 0;

  for (var b = 0; b < blocks.blocks.length; b++) {
    var curBlock = blocks.blocks[b];

    if ((curBlock.type == 'bone' || curBlock.type == 'wood' || 
        curBlock.type == 'stone' || curBlock.type == 'mine') && !curBlock.isAlive) quantityOfBrokenBlocks++;
  }

  return quantityOfBrokenBlocks;
};


function statusPanel() {
  ctx.font = "19px Comic Sans MS"; //Arial
  ctx.fillStyle = "White";
  ctx.fillText("Уровень: " + (level+1) + "/" + levelsQuantity, 10, cnv.height - 15);
  ctx.fillText("Жизни: " + lifes, cnv.width - 260, cnv.height - 15);
  ctx.fillText("Баллы: " + score + "/" + maxScore, cnv.width - 160, cnv.height - 15);
};


// используется при потере мяча
function reload() {
  // платформа
  platform.w = platform.wOrigin;
  platform.x = cnv.width/2 - platform.w/2;
  platform.isVisible = true;
  platform.moveRight = false;
  platform.moveLeft = false;

  // мяч
  ball.balls = [];
  ball.balls.push(new ball.ballObject());

  // паверапы
  pup.activePups = [];
  //pup.powerups = []; // падающие контейнеры. Не удалять строку, если надо - комментировать
  for (var property in pup.status) {
    pup.status[property] = false;
  }
};



controller = {
  keyPress: function(e) {

    if (e.keyCode == 37) platform.keyControl('pushLeft');
    if (e.keyCode == 39) platform.keyControl('pushRight');
    if (e.keyCode == 32) ball.keyControl('pushSpace');
    if (e.keyCode == 27) {
      if (paused == false) {
        paused = true;
      }
      else {
        paused = false;
        gameLoop();
      }
    }

    /*
    // T
    if (e.keyCode == 84) pup.makeNew({x: X, y: Y, powerap: 'speedBoost'});
    // Y
    if (e.keyCode == 89) pup.makeNew({x: X, y: Y, powerap: 'speedSlow'});
    // G
    if (e.keyCode == 71) pup.makeNew({x: X, y: Y, powerap: 'annihilation'});
    // H
    if (e.keyCode == 72) pup.makeNew({x: X, y: Y, powerap: 'addBall'});
    // B
    if (e.keyCode == 66) pup.makeNew({x: X, y: Y, powerap: 'orbs'});
    // N
    if (e.keyCode == 78) pup.makeNew({x: X, y: Y, powerap: 'guidance'});
    // M
    if (e.keyCode == 77) pup.makeNew({x: X, y: Y, powerap: 'machinegun'});
    */
  },

  keyRelease: function(e) {
    if (e.keyCode == 37) platform.keyControl('releaseLeft');
    if (e.keyCode == 39) platform.keyControl('releaseRight');
  }
};