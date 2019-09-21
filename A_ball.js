function Ball() {

  this.balls = [];
  this.unlaunched = {cur: 1, prev: 1}; // контроль запуска мячей
  this.unlaunchedBallsNums = [];       // контроль запуска мячей


  this.update = function() {
    //контроль запуска мячей
    this.unlaunched.prev = this.unlaunched.cur;
    this.unlaunchedBallsNums = [];
    for (var g = 0; g < this.balls.length; g++) {
      if (!this.balls[g].isLaunched) {
        this.unlaunchedBallsNums.push(g);
      }
    }
    this.unlaunched.cur = this.unlaunchedBallsNums.length;


    //обновление мячей (сначала мячи, потом Орбы)
    for (var i = 0; i < this.balls.length; i++) {
      var element = this.balls[i];

      //контроль запуска мячей
      if (!element.isLaunched) {
        element.dx = platform.dx; 
        if (this.unlaunched.cur != this.unlaunched.prev) {
          if (this.unlaunched.cur == 1) {
            element.x = platform.x + platform.w/2;
          }
          else {
            for (var j = 0; j < this.unlaunchedBallsNums.length; j++) {
              if (i == this.unlaunchedBallsNums[j]) {
                element.x = platform.x + (platform.w/this.unlaunched.cur)*(j + 1);
              }
            }
          }
        }
        else {
          if (element.x == null) {
            element.x = platform.x + platform.w/2;   
          } 
        }
        if (element.y == null) {
          element.y = platform.y - element.r;   
        } 
      }


      // КОНТРОЛЬ РЕЖИМА ДВИЖЕНИЯ
      if (element.guidanceMode) {
        this.guidanceControl(element);
      }
      else {
        if (this.defineGuidance(element)) {
          element.guidanceMode = true;
        }        
      }


      //обновление координат
      element.x += element.dx;
      element.y += element.dy; 

      //рассчет координат на следующем шаге
      var x1 = element.x + element.dx;
      var y1 = element.y + element.dy; 

      //столкновение с полом
      if (element.y + element.r > cnv.height) {
        if (this.balls.length > 1) {
          if (this.balls.length == 2) pup.status.addBall = false;
          this.balls.splice(i, 1);
          i--;
          continue;
        }
        else {

          // контроль потери мяча
          if (lifes > 1) {
            lifes--;
            soundControl('loose_ball');
            reload();
          }          
          else {
            soundControl('loose');
            gameStatus('loose');
          }

          return;
        }
      }  


      // ОТСКОК ОТ ГРАНИЦ //

      // ЛЕВАЯ И ПРАВАЯ  
      if ((x1 - element.r) < 0 || (x1 + element.r > cnv.width)) {
        element.dx *= -1; 

        soundControl('hit_platform');    
      }

      // ВЕРХНЯЯ
      else if (y1 - element.r < 0) {
        element.dy *= -1;

        // сброс буста
        if (element.x < cnv.w-50)
          dropPowerup({x: element.x, y: 0}); 
        else
          dropPowerup({x: cnv.w-50, y: 0});


        soundControl('hit_platform');
      }



      //отскок от платформы
      if (this.isCollidePlatform(x1, y1, element) && !element.isLost) {
        this.platformBounce(x1, element);
        element.guidanceMode = false;

        soundControl('hit_platform');
      }

      //столкновение с блоками (д.б. после расчета новых координат)    
      for (var b = 0; b < blocks.blocks.length; b++) { 
        var blockElement = blocks.blocks[b];

        if (blockElement.isAlive) {
          if (this.isCollideBlocks(x1, y1, element.r, blockElement)) {
            if (
                (!pup.status.annihilation || (pup.status.annihilation && (blockElement.type == 'iron' || (blockElement.type == 'teleport' && !blockElement.isActive)))) && 
                ((blockElement.type != 'teleport') || (blockElement.type == 'teleport' && !blockElement.isActive))
                ) 
            {
              this.blocksBounce(x1, y1, element, blockElement);
            }

            blocks.collisionControl(blockElement, element);
            break;
          } 

          else {
            // для контроля hp у блоков при включенной у мяча аннигиляции
            if (blockElement.isUnderAttack) blockElement.isUnderAttack = false;
          }
        }
      }
    }
    
    this.orbsHandle.update();
  };


  this.render = function() {
    for (var i in this.balls) {
      this.balls[i].render();
    }    

    this.orbsHandle.render();
  };



  this.defineGuidance = function(element) {
    if (pup.status.guidance) {

      if (element.isLost == false && element.isLaunched == true &&
          element.dy > 0 && element.y > platform.y - 100) return true;
      return false;
    }
  };

  this.guidanceControl = function(element) {
    var ySteps = Math.floor((platform.y - element.y)/element.dy);
    var wholeXDistanceToGo = (platform.x + platform.w/2) - element.x;

    element.dx = wholeXDistanceToGo/ySteps;
  };



  this.isCollidePlatform = function(x1, y1, element) {
    if (y1 + element.r > platform.y) {
      //-3 в данном случае - костыль, чтобы сделать более правдоподобный отскок по карям платформы
      if (x1 >= platform.x - 3 && x1 <= platform.x + platform.w + 3) return true;
      else element.isLost = true;
    }
    return false;
  };


  this.platformBounce = function(x1, element) {
    var zone = platform.zone(x1);

    for (var z in element.vel) {
      if (z == zone) {
        element.dx = element.vel[z].x * element.velKoef;
        element.dy = element.vel[z].y * element.velKoef;
        break;
      }
    }
  };


  this.isCollideBlocks = function(x1, y1, r, block) {
    var deltaX = x1 - Math.max(block.x, Math.min(x1, block.x + block.w));
    var deltaY = y1 - Math.max(block.y, Math.min(y1, block.y + block.h));
   
    //при <= столкновение фиксируется даже при касании
    if ((deltaX * deltaX + deltaY * deltaY) <= (r * r)) return true;
    else return false;
  };

  this.blocksBounce = function(x1, y1, element, block) {
    var nearestX = Math.max(block.x, Math.min(x1, block.x + block.w));
    var nearestY = Math.max(block.y, Math.min(y1, block.y + block.h));

    //левая грань
    if (nearestX == block.x && (nearestY > block.y && nearestY < block.y + block.h)) { 
      element.dx *= -1;
    }
    //правая грань
    else if ((nearestX == block.x + block.w) && (nearestY > block.y && nearestY < block.y + block.h)) {
      element.dx *= -1;
    }  
    //нижняя грань
    else if ((nearestY == block.y + block.h) && (nearestX > block.x && nearestX < block.x + block.w)) {
      element.dy *= -1;
    } 
    //верхняя грань
    else if (nearestY == block.y && (nearestX > block.x && nearestX < block.x + block.w)) {
      element.dy *= -1;     
    } 
    //upper right dot
    else if (nearestX == block.x + block.w && nearestY == block.y) {
      if ((Math.abs(y1 - block.y) < Math.abs(x1 - block.x + block.w)) && element.dx < 0) {
        element.dx *= -1;
      }
      else {
        element.dy *= -1;
      }
    }
    //upper left dot
    else if (nearestX == block.x && nearestY == block.y) {
      if ((Math.abs(y1 - block.y) < Math.abs(x1 - block.x)) && element.dx > 0) {
        element.dx *= -1;
      }
      else {
        element.dy *= -1;
      }
    }
    //lower left dot
    else if (nearestX == block.x && nearestY == block.y + block.h) {
      if ((Math.abs(y1 - (block.y + block.h)) < Math.abs(x1 - block.x)) && element.dx > 0) {
        element.dx *= -1;
      }
      else {
        element.dy *= -1;
      }
    }
    //lower right dot
    else if (nearestX == block.x + block.w && nearestY == block.y + block.h) {
      if ((Math.abs(y1 - block.y - block.h) < Math.abs(x1 - block.x - block.w)) && element.dx < 0) {
        element.dx *= -1;
      }
      else {
        element.dy *= -1;
      }
    }
  };



  this.keyControl = function(action) {
    if (action == 'pushSpace') {
      if (this.balls.length != 0) {
        for (var i = 0; i < this.balls.length; i++) {
          if (!this.balls[i].isLaunched) {
            this.balls[i].isLaunched = true;
            this.balls[i].releaseBall();
            break; //для того, чтобы запускался только один мяч, а не сразу все
          }
        }
      }
    }
  };

  this.ballObject = function() {
    this.x = null;
    this.y = null;
    this.r = 9; //8
    this.dx = null;
    this.dy = null;
    this.color = 'Chartreuse';
    this.id = 0; // для связки с массивом активных паверапов pup.activePups

    this.velKoef = 1; // отвечает за скорость; см ещё ballSpeedModif в паверапах д.б. равны
    this.vel = {
      leftEdge: {x: -4.5, y: -2.25},
      leftMiddle: {x: -3.555, y: -3.555},
      leftCenter: {x: -2.25, y: -4.5},
      rightCenter: {x: 2.25, y: -4.5},
      rightMiddle: {x: 3.555, y: -3.555},
      rightEdge: {x: 4.5, y: -2.25}

     /* leftEdge: {x: -3, y: -1.5},
      leftMiddle: {x: -2.37, y: -2.37},
      leftCenter: {x: -1.5, y: -3},
      rightCenter: {x: 1.5, y: -3},
      rightMiddle: {x: 2.37, y: -2.37},
      rightEdge: {x: 3, y: -1.5}*/
    };

    this.isLost = false;       // отслеж промаха мимо платформы, чтобы впредь не фикс-сь касание    
    this.isLaunched = false;   // отслеж первичного запуска с платформы
    this.guidanceMode = false; // флаг режима самонаведения 

    this.orbs = []; //орбы
  };

  this.ballObject.prototype = {
    releaseBall: function() {
      if (pup.status.speedBoost) {
        this.velKoef = pup.ballSpeedModif.speedBoost;
      }
      else if (pup.status.speedSlow) {
        this.velKoef = pup.ballSpeedModif.speedSlow;
      }

      this.dx = this.vel.leftCenter.x * this.velKoef;
      this.dy = this.vel.leftCenter.y * this.velKoef;
    },

    render: function() { 

      /*ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
      ctx.closePath();

      ctx.fillStyle = this.color;
      for (var i in pup.status) {
        if (i != 'addBall' && i != 'platformLengthIncrease' && i != 'platformLengthDecrease' &&
            i != 'orbs') {
          if (pup.status[i]) {
            ctx.fillStyle = pup.ballColor[i];
          }          
        }
      }

      ctx.fill();*/

      if (pup.status.annihilation) ctx.drawImage(sprites["ballAnnig"], this.x - this.r, this.y - this.r);
      else ctx.drawImage(sprites["ball"], this.x - this.r, this.y - this.r);

      if (pup.status.guidance) ctx.drawImage(sprites["ballCrosshair"], this.x - this.r, this.y - this.r);
    }
  };

  

  // Орбы  
  this.orbsHandle = {
    //конструктор Орба
    Orb: function() {
      this.x = 0;
      this.y = 0;
      this.r = 5;
      this.dx = null;
      this.dy = null;
      this.vel = 0.07;   // скорость перемещения
      this.curAngle = 0; // текущее значение угла
      this.R = 0;        // радиус траектории движения
    },

    update: function() {
      for (var w in ball.balls) {
        var ballElement = ball.balls[w];

        for (var o = 0; o < ballElement.orbs.length; o++) {
          var el = ballElement.orbs[o];

          el.dx = Math.cos(el.curAngle) * el.R;
          el.dy = Math.sin(el.curAngle) * el.R;
          el.x = ballElement.x + el.dx;
          el.y = ballElement.y + el.dy;
          el.curAngle += el.vel;

          el.R += 0.15;

          // тест на столкновение на текущем шаге
          for (var b = 0; b < blocks.blocks.length; b++) {

            var blockElement = blocks.blocks[b];

            if (blockElement.isAlive && blockElement.type != 'teleport') {
              if (this.isCollideBlocks(el.x, el.y, el.r, blockElement)) {
                
                blocks.collisionControl(blockElement);

                soundControl('hit_all');

                ballElement.orbs.splice(o, 1); //за раз Орб ломает только 1 блок
                o--;
                break; // прекращаем перебор блоков для теста на столкновение                            
              }
            }
          }
        }
      }

      var count = 0;
      for (var d in ball.balls) {
        if (ball.balls[d].orbs.length > 0) count++;
      }
      if (count == 0) pup.status.orbs = false;
    },

    render: function () {
      for (var w in ball.balls) {
        var ballElement = ball.balls[w];

        for (var o = 0; o < ballElement.orbs.length; o++) {
          var el = ballElement.orbs[o]; 

          ctx.beginPath();
          ctx.arc(el.x, el.y, el.r, 0, Math.PI*2);
          ctx.closePath();
          ctx.fillStyle = 'Orange';
          ctx.fill();
        }
      }
    },

    isCollideBlocks: function(x, y, r, block) {
      var deltaX = x - Math.max(block.x, Math.min(x, block.x + block.w));
      var deltaY = y - Math.max(block.y, Math.min(y, block.y + block.h)); 

      if ((deltaX * deltaX + deltaY * deltaY) <= (r * r)) return true;
      else return false;      
    }
  };
};