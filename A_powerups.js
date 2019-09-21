function Pup() {
  //просто библиотека эталонных наименований паверапов
  this.powerupsLib = ['speedBoost', 'speedSlow', 'annihilation', 'addBall', 'orbs', 'guidance',
  'platformLengthIncrease', 'platformLengthDecrease', 'invisPlatform', 'machinegun',
  'addLife', 'extraScore'];

  //вываливающиеся из сбитых блоков контейнеры с паверапами
  //элементы из массива удаляются
  this.powerups = [];

  //активированные паверапы (активные и выключенные) для контроля времени 
  //элементы из массива не удаляются, а помечаются флагом (удобно для тестов, потом омжено переделать,
  //чтобы удалялись)
  this.activePups = []; 

  //модификаторы скорости мяча паверапов 'speedBoost' и 'speedSlow'
  this.ballSpeedModif = {
    normal: 1,
    speedBoost: 1.5,
    speedSlow: 0.5
  };

  //длительность действия паверапов задается здесь
  this.pupsDuration = {
    speedBoost: 800, 
    speedSlow: 800,
    annihilation: 600,
    platformLengthIncrease: 800,
    platformLengthDecrease: 800,
    invisPlatform: 200,
    machinegun: 200,
    guidance: 800
  }; 

  //статус паверапов вкл/выкл - глобальный игровой статус
  this.status = {
    speedBoost: false,
    speedSlow: false,
    annihilation: false,
    addBall: false,
    platformLengthIncrease: false,
    platformLengthDecrease: false,
    orbs: false,
    invisPlatform: false,
    machinegun: false,
    guidance: false
  };

  //окрас мяча при активации паверапов
  /*this.ballColor = {
    speedBoost: 'Aqua',
    speedSlow: 'Fuchsia',
    annihilation: 'Red',
    addBall: 'Chartreuse',
    platformLengthIncrease: 'RoyalBlue',
    platformLengthDecrease: 'Maroon',
    orbs: 'Pink'
  };*/



//===========================================================
//конструктор контейнеров с паверапами
//===========================================================

  this.Powerup = function (x, y, type, timer) {
    this.x = x;
    this.y = y;  
    this.type = type;
    this.timer = timer;
  };

  this.Powerup.prototype = {
    w: 50,
    h: 25,
    dy: 1.5,

    update: function() {
      this.y += this.dy;
    },

    render: function() {
      /*ctx.strokeStyle = 'red';
      ctx.strokeRect(this.x, this.y, this.w, this.h);
      
      ctx.fillStyle = pup.ballColor[this.type];
      ctx.font = "22px serif";
      ctx.fillText(this.type, this.x, this.y + 13);*/

      ctx.drawImage(sprites[this.type], this.x, this.y);
    }
  };
//===========================================================
//===========================================================



  this.update = function() {
    if (this.powerups.length != 0) {
      for (var i = 0; i < this.powerups.length; i++) {
        this.powerups[i].update();

        if (this.powerups[i].y + this.powerups[i].h > cnv.height) {
          this.powerups.splice(i, 1);
          i--;
        }
      }
    }

    if (this.activePups.length != 0) {      
      this.pupsTimeControl();
    }

    if (this.machinegunController.bullets.length != 0) {
      this.machinegunController.update();
    }
  };



  this.pupsTimeControl = function() {
    for (var i in this.activePups) {
      if (this.activePups[i].isActive) {

        if (this.activePups[i].timer > 0) {
          this.activePups[i].timer--;
        }
        else {
          this.deactivatePups(this.activePups[i]);
        }

        if (this.activePups[i].type == 'machinegun') {
          if (this.machinegunController.timeoutCur > 0) {
            this.machinegunController.timeoutCur--;
          }
          else {
            this.machinegunController.addNewBullets();
            this.machinegunController.timeoutCur = this.machinegunController.timeout;
          }
        }        
      }
    }
  };



  this.render = function() {
    if (this.powerups.length != 0) {
      for (var i in this.powerups) {
        this.powerups[i].render();
      }
    }

    if (this.machinegunController.bullets.length != 0) {
      this.machinegunController.render();
    }
  };



  this.makeNew = function(block) {
    var x =  block.x;
    var y =  block.y;
    var type = block.powerap;

    for (var i in this.pupsDuration) {
      if (type == i) {
        var timer = this.pupsDuration[i];
        break;
      }
    }

    this.powerups.push(new this.Powerup(x, y, type, timer));
  };



  this.activatePups = function(element, ballID) {
    if (element.type == 'speedBoost' || element.type == 'speedSlow') {

      //деактивация всех имеющихся скоростных эффектов
      //одновременно может быть активен ТОЛЬКО ОДИН эффект скорости
      if (this.activePups.length != 0) {
        for (var i in this.activePups) {
          if (this.activePups[i].type == 'speedBoost' || this.activePups[i].type == 'speedSlow') {
            this.deactivatePups(this.activePups[i]);
          }
        }
      }

      //активация только что подобранного скоростного паверапа
      for (var i in this.ballSpeedModif) {
        if (element.type == i) {
          for (var j in ball.balls) { 
            ball.balls[j].velKoef = this.ballSpeedModif[i];
            if (ball.balls[j].isLaunched) {
              ball.balls[j].dx *= ball.balls[j].velKoef;
              ball.balls[j].dy *= ball.balls[j].velKoef;
            }
          }
          break;
        }
      } 
    }



    else if (element.type == 'platformLengthIncrease' || element.type == 'platformLengthDecrease') {
      //Одновременно должен работать только один буст с длиной платформы, поэтому сначала вырубаем
      //все существующие эффекты
      if (this.status['platformLengthIncrease'] || this.status['platformLengthDecrease']) {
        for (var i = 0; i < this.activePups.length; i++) {
          if ((this.activePups[i].type == 'platformLengthIncrease' 
              || this.activePups[i].type == 'platformLengthDecrease') && this.activePups[i].isActive) {
            this.deactivatePups(this.activePups[i]);
            break;
          }
        }
      }

      if (element.type == 'platformLengthIncrease') platform.w *= 1.5;
      else platform.w /= 1.5;
    }



    else if (element.type == 'invisPlatform') {
      //Одновременно должен работать только один буст, поэтому сначала вырубаем все существующие эффекты
      
      if (this.status['invisPlatform']) {
        for (var i = 0; i < this.activePups.length; i++) {
          if (this.activePups[i].type == 'invisPlatform' && this.activePups[i].isActive) {
            this.deactivatePups(this.activePups[i]);
            break;
          }
        }
      }

      platform.isVisible = false;
    }



    else if (element.type == 'machinegun') {
      //Одновременно должен работать только один буст, поэтому сначала вырубаем все существующие эффекты
      
      if (this.status['machinegun']) {
        for (var i = 0; i < this.activePups.length; i++) {
          if (this.activePups[i].type == 'machinegun' && this.activePups[i].isActive) {
            this.deactivatePups(this.activePups[i]);
            break;
          }
        }
      }

      this.machinegunController.addNewBullets();
    }



    else if (element.type == 'orbs') {
      //перезапуск мячей, если буст уже работает
      if (this.status.orbs) {        
        for (var h in ball.balls) {
          ball.balls[h].orbs = [];
        }
      }

      var angle = 6.24/5; //делитель - количество мячей

      for (var p = 0; p < ball.balls.length; p++) {
        for (var i = 0; i < 5; i++) {
          ball.balls[p].orbs.push(new ball.orbsHandle.Orb());
          ball.balls[p].orbs[i].curAngle = angle * i;
        }
      }
    }

   
   
    else if (element.type == 'addBall') {
      ball.balls.push(new ball.ballObject());
    }



    else if (element.type == 'annihilation') {
      if (this.activePups.length != 0) {
        for (var i in this.activePups) {
          if (this.activePups[i].type == 'annihilation') {
            this.deactivatePups(this.activePups[i]);
          }
        }
      }
    }



    else if (element.type == 'addLife') {
      lifes++;
      return; // чтобы не пушить новый объект в activePups и не трогать status
    }


    else if (element.type == 'extraScore') {
      score += addedScores;
      return; // чтобы не пушить новый объект в activePups и не трогать status
    }


    
    else if (element.type == 'guidance') {  
      if (this.status['guidance']) {
        for (var i = 0; i < this.activePups.length; i++) {
          if (this.activePups[i].type == 'guidance' && this.activePups[i].isActive) {
            this.deactivatePups(this.activePups[i]);
            break;
          }
        }
      }    
    }
    



    if (element.type != 'orbs' && element.type != 'addBall') {
      this.activePups.push({type: element.type, timer: element.timer, isActive: true});
    }
    this.status[element.type] = true;
  };



  //передается элемент из activePups
  this.deactivatePups = function(element) {
    //сброс эффектов
    if (element.type == 'speedBoost' || element.type == 'speedSlow') {
      for (var i in ball.balls) {
        if (ball.balls[i].isLaunched) {
          ball.balls[i].dx /= ball.balls[i].velKoef;
          ball.balls[i].dy /= ball.balls[i].velKoef;
        }
        ball.balls[i].velKoef = this.ballSpeedModif.normal;
      }
    }


    else if (element.type == 'platformLengthIncrease') {
      platform.w /= 1.5;
    }
    else if (element.type == 'platformLengthDecrease') {
      platform.w *= 1.5;
    }


    else if (element.type == 'invisPlatform') {
      platform.isVisible = true;
    }


    else if (element.type == 'machinegun') {
      this.machinegunController.timeoutCur = this.machinegunController.timeout;
    }

    //пометка как "неактивный", чтобы при переборе массива activePups не тратить на него времени    
    element.isActive = false;
    this.status[element.type] = false;
  };



  this.machinegunController = {
    bullets: [],
    timeout: 20, // период запускания пуль
    timeoutCur: 20, // д.б. = timeout

    Bullet: function(x, y, w_h) {
      this.x = x;
      this.y = y;
      this.w = w_h;
      this.h = w_h;
      
      this.dy = -4;

      this.type = 'bullet';
    },

    addNewBullets: function() {
      var w_h = 5;
      var indent = 3;
      var xLeft = platform.x;
      var xRight = platform.x + platform.w - w_h;
      var y = platform.y - w_h - indent;

      this.bullets.push(new this.Bullet(xLeft, y, w_h));
      this.bullets.push(new this.Bullet(xRight, y, w_h));

      soundControl('shot');
    },

    update: function() {
      for (var b = 0; b < this.bullets.length; b++) {
        var curBul = this.bullets[b];

        curBul.y += curBul.dy;

        // вылет пули за пределы игрового поля
        if (curBul.y < 0) {
          this.bullets.splice(b, 1);
          b--;
          continue;
        }


        // столкновение пули с блоками
        for (var n = 0; n < blocks.blocks.length; n++) {
          var blockElement = blocks.blocks[n];

          if (blockElement.isAlive) {
            if (this.isCollide(curBul, blockElement)) {

              //blocks.breakControl(blockElement);
              blocks.collisionControl(blockElement, curBul);

              this.bullets.splice(b, 1);
              b--;
              break;
            }
          }
        }
      }
    },

    render: function() {
      ctx.fillStyle = 'white';

      for (var b = 0; b < this.bullets.length; b++) {
        var curBul = this.bullets[b];
        
        ctx.fillRect(curBul.x, curBul.y, curBul.w, curBul.h);
      }
    },

    isCollide: function(obj_1, obj_2) {
      if (obj_1.y < obj_2.y + obj_2.h && obj_1.y + obj_1.h > obj_2.y &&
          obj_1.x < obj_2.x + obj_2.w && obj_1.x + obj_1.w > obj_2.x) return true;
      return false;
    }
  };

};