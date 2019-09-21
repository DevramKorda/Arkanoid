function Blocks() {
  
  this.blocks = [];

  // порядковые номера телепортов в массиве блоков
  // массив заполняется в блоке Main в функции createLevel
  this.numbersOfTeleports = []; 

  // номера игровых блоков (для запила экстра баллов)
  this.numbersOfPlayingBlocks = []; 
  this.amountOfExtraScoreBlocks = 3; // было 5

  // количество телепортов на карте; задается в Main в функции createLevel
  this.teleportsQuantity = null;

  this.activity = []; // массив для отслеживания времени блокировки телепортов
  this.telepTime = 700; // время блокировки (задается пользователем)

  this.lib = {
    11: {type: 'bone', hp: 1, /*color: 'white',*/ name: 'boneYellow'},
    12: {type: 'bone', hp: 1, /*color: 'SeaGreen',*/ name: 'boneGreen'},
    13: {type: 'bone', hp: 1, /*color: 'red',*/ name: 'boneRed'},

    21: {type: 'wood', hp: 2, /*color: 'Sienna',*/ name: 'wood'},

    31: {type: 'stone', hp: 3, /*color: 'DimGrey',*/ name: 'stone'},

    41: {type: 'iron', hp: null, /*color: 'SandyBrown',*/ name: 'iron'},

    51: {type: 'mine', hp: 1, /*color: 'Salmon',*/ name: 'mine'},

    61: {type: 'teleport', hp: null, /*color: 'Cyan',*/ name: 'teleport'},

    10: {type: 'empty', hp: null /*color: 'white'*/}
  };

  this.BlockObject = function(element) {
    this.x = element.x;
    this.y = element.y;
    this.w = element.w;
    this.h = element.h;

    this.hp = element.hp;
    this.type = element.type;    
    //this.color = element.color;
    this.name = element.name;

    this.powerap = null;
    this.isAlive = true; // флаг для теста на столкновение и для отрисовки
    this.isActive = true; // для телепортов - если истина - мяч телепортируется, если ложь - нет
    this.isUnderAttack = false; // для маркировки прохождения сквозь блоки мяча под аннигиляцией
  };

  

  this.update = function() {
    if (this.activity.length != 0) {
      this.activityControl();
    }
  };



  this.render = function() {
    for (var i in this.blocks) {
      var element = this.blocks[i];
 
      if (element.isAlive) {

        // КОСТЬ, ЖЕЛЕЗО, МИНА
        if (element.type == 'bone' || element.type == 'iron' || element.type == 'mine') {
          ctx.drawImage(sprites[element.name], element.x, element.y);
        }

        // ДЕРЕВО
        else if (element.type == 'wood') {
          if (element.hp == 2) ctx.drawImage(sprites[element.name], element.x, element.y);
          else ctx.drawImage(sprites["woodBroken1"], element.x, element.y);
        }

        // КАМЕНЬ
        else if (element.type == 'stone') {
          if (element.hp == 3) ctx.drawImage(sprites[element.name], element.x, element.y);
          else if (element.hp == 2) ctx.drawImage(sprites["stoneBroken1"], element.x, element.y);
          else ctx.drawImage(sprites["stoneBroken2"], element.x, element.y);
        }

        // ТЕЛЕПОРТ
        else if (element.type == 'teleport') {
          if (element.isActive) ctx.drawImage(sprites[element.name], element.x, element.y);
          else ctx.drawImage(sprites["teleportClosed"], element.x, element.y);
        }
      }
    }
  };



  this.collisionControl = function(block, ball) {

    // КОСТЬ, ДЕРЕВО, КАМЕНЬ
    if (block.type == 'bone' || block.type == 'wood' || block.type == 'stone') {

      if (!block.isUnderAttack) {
        this.breakControl(block);
        soundControl('hit_all');
      }

      if (pup.status.annihilation) {
        if (!block.isUnderAttack) block.isUnderAttack = true;
      }
    }


    // ЖЕЛЕЗО
    else if (block.type == 'iron') {
      soundControl('hit_all');
    }


    // МИНА
    else if (block.type == 'mine') {
      for (var i = 0; i < this.blocks.length; i++) {

        var element = this.blocks[i];

        if (element.isAlive) {
          if (
              ((element.y == (block.y - indent - element.h)) && (element.x == block.x)) ||
              ((element.y == (block.y + block.h + indent)) && (element.x == block.x)) ||
              ((element.x == (block.x - indent - element.w)) && (element.y == block.y)) ||
              ((element.x == (block.x + block.w + indent)) && (element.y == block.y))
              ) {

            if (element.type != 'iron') this.breakControl(element);            
          }
        }
      }

      this.breakControl(block);

      soundControl('explosion');
    }


    // ТЕЛЕПОРТ мяч направляется в случайный телепорт    
    else if (block.type == 'teleport' && ball.type != 'bullet') {

      if (!block.isActive) {
        soundControl('hit_all');
        return;
      }

      soundControl('teleport');

      var numOfThis = this.blocks.indexOf(block);
      var newRand = null;
      var numToTelep = null;

      do {
        newRand = this.randomize(this.teleportsQuantity);
        numToTelep = this.numbersOfTeleports[newRand];
      }
      while (numToTelep == numOfThis);

      //console.log('teleport to: ' + numToTelep);

      var hostBlock = this.blocks[numToTelep];
      var side = this.defineSide(block, ball);


      if (side == 'bottom') {
        ball.x = hostBlock.x + hostBlock.w/2;
        ball.y = hostBlock.y - ball.r - 1;
      }
      else if (side == 'top') {
        ball.x = hostBlock.x + hostBlock.w/2;
        ball.y = hostBlock.y + hostBlock.h + ball.r + 1;
      }
      else if (side == 'left') {
        ball.x = hostBlock.x + hostBlock.w + ball.r + 1;
        ball.y = hostBlock.y + hostBlock.h/2;
      }
      else {
        ball.x = hostBlock.x - ball.r - 1;
        ball.y = hostBlock.y + hostBlock.h/2;
      }

      
      // чистка массива контроля времени активности, если в него загружаются данные
      // по элементу, который уже есть в массиве
      for (var k = 0; k < this.activity.length; k++) {
        if (this.activity[k].blockNum == numToTelep) this.activity.splice(k, 1);
      }

      // добавление в массив данных по телепорту-хосту
      this.activity.push({blockNum: numToTelep, timer: this.telepTime});
      hostBlock.isActive = false;
    }

  };



  this.randomize = function(num) {    
    return Math.floor(Math.random()*num);
  };



  this.implementExtraScore = function() {
    var randomNumbers = [];
    var rand = null;

    for (var i = 1; i <= this.amountOfExtraScoreBlocks; i++) {
      do {
        rand = this.randomize(quantityOfPlayingBlocks);        
      }
      while (this.test(randomNumbers, rand))

      randomNumbers.push(rand);
    }

    for (var r = 0; r < randomNumbers.length; r++) {
      var numberOfBlockToImplement = this.numbersOfPlayingBlocks[randomNumbers[r]];

      this.blocks[numberOfBlockToImplement].powerap = 'extraScore';
      //this.blocks[numberOfBlockToImplement].color = 'yellow';
    }
  };



  this.test = function(randomNumbers, rand) {
    for (var n = 0; n < randomNumbers.length; n++) {
      if (rand == randomNumbers[n]) return true;
    }
    return false;
  };



  this.defineSide = function(block, ball) {
    var x1 = ball.x + ball.dx;
    var y1 = ball.y + ball.dy; 
    var nearestX = Math.max(block.x, Math.min(x1, block.x + block.w));
    var nearestY = Math.max(block.y, Math.min(y1, block.y + block.h));

    if ((nearestX == block.x) && (nearestY > block.y && nearestY < block.y + block.h)) return 'left';
    if ((nearestX == block.x+block.w) && (nearestY > block.y && nearestY < block.y + block.h)) return 'right';
    if ((nearestY == block.y) && (nearestX > block.x && nearestX < block.x+block.w)) return 'top';
    if ((nearestY == block.y+block.h) && (nearestX > block.x && nearestX < block.x+block.w)) return 'bottom';
  };



  this.activityControl = function() {
    for (var r = 0; r < this.activity.length; r++) {
      var element = this.activity[r];

      if (element.timer > 0) {
        element.timer--;
      }
      else {
        this.blocks[element.blockNum].isActive = true;
        this.activity.splice(r, 1);
        r--;
      }
    }
  };



  this.breakControl = function(block) {
    block.hp--;

    if (block.hp == 0) {
      block.isAlive = false;
      score += addedScores;

      if (block.powerap == 'extraScore') pup.makeNew(block);
      else dropPowerup(block);
    }
  };
};