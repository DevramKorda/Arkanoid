var platform = {
  x: null,
  y: null,
  w: 80,       // должны быть равны!
  wOrigin: 80, // должны быть равны!
  h: 14,
  dx: 0,
  vel: 7,
  moveRight: false,
  moveLeft: false,
  isVisible: true, // флаг для паверапа invisPlatform

  init: function() {
    this.x = cnv.width/2 - this.w/2;
    this.y = cnv.height - 50;
  },

  update: function() {
    if ((this.x <= 0  && this.moveLeft) || 
        (this.x + this.w >= cnv.width && this.moveRight) ||
        (!this.moveRight && !this.moveLeft)) this.dx = 0;
    else if (this.moveRight) this.dx = this.vel;
    else if (this.moveLeft) this.dx = -this.vel;

    this.x += this.dx;

    for (var i = 0; i < pup.powerups.length; i++) {
      if (this.isCollide(pup.powerups[i])) {
        soundControl('pick_up_booster');
        pup.activatePups(pup.powerups[i]);
        pup.powerups.splice(i, 1);
        i--;
      }
    }
  },

  render: function() {
    if (this.isVisible) {
      
      /*ctx.strokeStyle = "yellow";
      ctx.strokeRect(this.x, this.y, this.w, this.h);*/

      if (pup.status.platformLengthIncrease) ctx.drawImage(sprites["platfLong"], this.x, this.y);
      else if (pup.status.platformLengthDecrease) ctx.drawImage(sprites["platfShort"], this.x, this.y);
      else ctx.drawImage(sprites["platfNorm"], this.x, this.y);
    }
  },

  zone: function(x) {
    if (x <= this.x + this.w/6) return 'leftEdge';
    else if (x > this.x + this.w/6 && x <= this.x + this.w/3) return 'leftMiddle';
    else if (x > this.x + this.w/3 && x <= this.x + this.w/2) return 'leftCenter';
    else if (x > this.x + this.w/2 && x <= this.x + this.w*2/3) return 'rightCenter';
    else if (x > this.x + this.w*2/3 && x <= this.x + this.w*5/6) return 'rightMiddle';
    else return 'rightEdge';
  },

  keyControl: function(action) {
    if (action == 'pushLeft') this.moveLeft = true;
    else if (action == 'releaseLeft') this.moveLeft = false;
    else if (action == 'pushRight') this.moveRight = true;
    else if (action == 'releaseRight') this.moveRight = false;
  },

  isCollide: function(elmnt) {
    if (this.y < elmnt.y + elmnt.h && 
        this.y + this.h > elmnt.y &&
        this.x < elmnt.x + elmnt.w &&
        this.x + this.w > elmnt.x) return true;
      return false;
  }
};