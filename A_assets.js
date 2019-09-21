// МУЗЫКА И ЗВУКИ //
function Audio(musicVolume, soundVolume, curTrackNum) {

  this.playList = [];
  this.soundList = {};

  this.musicVolume = musicVolume;
  this.soundVolume = soundVolume;
  this.curTrackNum = curTrackNum;

  this.makePlayList = function () {
    var audio = document.getElementsByTagName("audio");

    for (var i = 0; i < audio.length; i++) {

      // музло
      if (audio[i].id.substring(0, 5) === 'track') {

        var trackName = audio[i].id;

        this.playList.push({
          name: trackName,
          asset: document.getElementById(audio[i].id)
        });
        
        this.playList[this.playList.length - 1].asset.volume = this.musicVolume;
      }


      // звуки
      else {
        this.soundList[audio[i].id] = document.getElementById(audio[i].id);
        //console.log(audio[i].id);
        this.soundList[audio[i].id].volume = this.soundVolume;
      }
    }
  };


  this.update = function() {
    var curTrack = this.playList[this.curTrackNum].asset;

    if (curTrack.ended) {
      this.curTrackNum = (this.curTrackNum + 1) % this.playList.length;
      this.playList[this.curTrackNum].asset.play();
    }
  }
};



// ГРАФИКА //
var sprites = {
  startScreen1: null,
  startScreen2: null,
  victoryScreen: null,
  gameoverScreen1: null,
  gameoverScreen2: null,

  boneRed: null,
  boneYellow: null,
  boneGreen: null,
  wood: null,
  woodBroken1: null,
  stone: null,
  stoneBroken1: null,
  stoneBroken2: null,
  iron: null,
  mine: null,
  teleport: null,
  teleportClosed: null,

  speedBoost: null, 
  speedSlow: null, 
  annihilation: null,
  addBall: null, 
  orbs: null, 
  guidance: null,
  platformLengthIncrease: null, 
  platformLengthDecrease: null, 
  invisPlatform: null, 
  machinegun: null,
  addLife: null, 
  extraScore: null,

  ball: null,
  ballAnnig: null,
  ballCrosshair: null,

  platfNorm: null,
  platfShort: null,
  platfLong: null,

  background: null
};