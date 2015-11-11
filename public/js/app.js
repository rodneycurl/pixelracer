var cars = [];
var hostcar;
var keyboardcar;
var ctx;

var race = {
  mode : "warmup",
  totallaps: 2,
  currentlap: 0,
  laptime : 0,
  fastestlap: {
    player : "jim",
    time: 0
  },
  winnder : 0,
  slowestlap : {
    player : "bob",
    time: 0
  },
  updateLapUI : function(){
    $(".laps .lap-count").text(this.currentlap);
    $(".laps .total-laps").text(this.totallaps);
  },
  startRace: function(){
    this.mode = "racing";
    $(".laps .lap-info").show();
    $(".laps .message").text("");
    this.currentlap = 0;
    this.updateLapUI();
    this.laptime = 0;
  },
  finishLap : function(car){
    this.currentlap++;
    trackAnimation();
    $(".last-lap").text(formatTime(this.laptime));
    $(".laps .lap-count").text(this.currentlaps);

    this.laptime = 0;

    if(this.currentlap > this.totallaps){
      this.winner = car;
      this.finishRace();
    } else {
      this.updateLapUI();
    }
  },
  finishRace : function(){
    this.mode = "over";
    $(".laps .lap-info").hide();
    $(".laps .message").text(this.winner.name + " wins");
  }

}

var sockjs_url = '/echo';
var sockjs = new SockJS(sockjs_url);

var carcolors = ["#A15417",
"#D832E3",
"#4E80C7",
"#F86395",
"#676D1E",
"#E20747",
"#B136A2",
"#EF8D30",
"#8F41BF",
"#A8AFFC",
"#6B60AC",
"#7E802D"]

var carcolors = ["#FFFFFF"];

var laps = 0;
var scaling = 15;


var canvasTrack, context, trackHeight, trackWidth;

var hexes = {
  "#000000" : "road",
  "#5a5a5a" : "road",
  "#8fcf4b" : "grass",
  "#f1aa22" : "turbo",
  "#2194ca" : "water",
  "#6ba52d" : "tree",
  "#ffffff" : "finish",
  "#a9a9a9" : "ledge",
  "#373737" : "overpass",
  "#333333" : "start",
  "#7dba3d" : "lamp",
  "#d4c921" : "jump"
}

function getCar(id){
  var foundcar;
  for(var c in cars){
    var car = cars[c];
    if(car.id == id){
      foundcar = car;
    }
  }
  return foundcar;
}

var chatting = false;


function sendChat(message){

  var car = getCar(myid);

  var update = {
    "driver" : car.driver,
    "type" : "chat",
    "text": message
  }
  sockjs.send(JSON.stringify(update));

  addChat(car.driver,message);
}


$(document).ready(function(){

  // var jam = newCar("jam",0);
  // cars.push(jam);

  loadRandomTrack();
  race.startRace();

  $(window).on("keypress", function(e){
    if(e.keyCode == 13) {
      if(chatting == false){
        $(".chat-input").show().focus();
        $(".chat-input-wrapper .instructions").hide();
        chatting = true;
      } else if (chatting == true){
        var message = $(".chat-input").val();
        if(message.length > 0){
          sendChat(message);
        }
        $(".chat-input").val("").blur().hide();
        chatting = false;
        $(".chat-input-wrapper .instructions").show();
      }
    }
  });

  $(".driver-name").on("keyup", function(e){
    var newName = $(this).val();
    var car = getCar(myid);
    car.changeDriver(newName);
    if(e.keyCode == 13) {
      $(this).blur();
    }
  });


  $(".restart").on("click",function(){
    race.startRace();
  });

  $(window).on("keydown",function(e){

    if(e.keyCode == 82) {
      race.startRace();
    }


    if(e.keyCode == 37) {
      keyboardcar.setDirection("steering","left");
    }
    if(e.keyCode == 39) {
      keyboardcar.setDirection("steering","right");
    }
    if(e.keyCode == 38) {
      keyboardcar.setDirection("gas","on");
    }
  });


  $(window).on("keyup",function(e){
    if(e.keyCode == 37) {
      keyboardcar.setDirection("steering","none");
    }
    if(e.keyCode == 39) {
      keyboardcar.setDirection("steering","none");
    }
    if(e.keyCode == 38) {
      keyboardcar.setDirection("gas","off");
    }
  });

  gameLoop();

});

var time;
var delta;
var elapsedTime = 0;
var tick = 0;

function gameLoop() {

  var now = new Date().getTime();
  delta = now - (time || now);
  time = now;

  var xtotal = 0; //what is this
  var ytotal = 0; // what is this

  for(var i = 0; i < cars.length; i++){

    var car = cars[i];

    driveCar(car);

    race.laptime = race.laptime + delta; //update the race lap timer
    car.laptime = car.laptime + delta; // update the car lap timer

    xtotal = xtotal + car.x;
    ytotal = ytotal + car.y;

    $(".lap-time").text(formatTime(elapsedTime));

    $(".laps .lap-time").text(formatTime(race.laptime));

  }

  var xavg = xtotal / cars.length || 0;
  var yavg = ytotal / cars.length || 0;


  var xdeg = 5 * (-1 + (2 * xavg / trackWidth));
  var ydeg = 45 + 5 * (1 - (2 * yavg / trackHeight));


  $(".track").css("transform","rotateX(" +ydeg+"deg) rotateY("+xdeg+"deg)");

  // tick++;
  // if(tick > 30) {
  //   if(tick > 30){
  //     tick = 0;
  //   }
  // }
  // var brightness;
  // if(cars[0]){
  //   brightness = 1 - tick/30;
  // }
  // $(".track").css("-webkit-filter","brightness("+brightness+")");

  window.requestAnimationFrame(gameLoop);
}

function formatTime(total){
  var ms = Math.floor(total / 10 % 100);
  if(ms < 10){
    ms = "0" + ms;
  }
  var sec = Math.floor(total / 1000 % 60);

  return sec + "." + ms;
}


function toDegrees (angle) {
  return angle * (180 / Math.PI);
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}


function driveCar(car) {

  car.x = Math.round(car.showx / scaling);
  car.y = Math.round(car.showy / scaling);

  car.currentx = car.x;
  car.currenty = car.y;

  var currentPosition = checkPosition(car.x,car.y) || "grass"; //What it's currently sitting on

  if(currentPosition == "turbo") {
    car.speed = car.speed + 4;
  }

  if(car.speed > 10){
    car.speed = 10;
  }

  var xd = 0;
  var yd = 0;

  var speedchange = car.acceleration;

  if(car.gas == "on" && car.speed < car.maxspeed) {
    car.speed = car.speed + speedchange;
  } else if (car.mode == "jumping") {

  } else {
    car.speed = car.speed - speedchange;
  }

  if(car.speed > car.maxspeed) {
    car.speed = car.speed - speedchange;
  }

  if(car.speed < 0){
    car.speed = 0;
  }

  var turnspeed = car.maxspeed - 1; //rate at which the wheel turns
  // var turnspeed = 2;

  var turning = true;

  if(car.mode == "jumping") {
    turning = false;
  }

  if(currentPosition == "water"){
    turnspeed = turnspeed / 3;
  }


  if((car.direction == "right" || car.direction == "left") && turning){

    if(car.direction == "left") {
      car.turnvelocity = car.turnvelocity - car.turnacceleration;

      if(Math.abs(car.turnvelocity) > turnspeed){
        car.turnvelocity = -1 * turnspeed;
      }

    }

    if(car.direction == "right") {
      car.turnvelocity = car.turnvelocity + car.turnacceleration;

      if(car.turnvelocity > Math.abs(turnspeed)){
        car.turnvelocity = turnspeed;
      }
    }

    if(car.angle > 360) {
      car.angle = car.angle - 360;
    }

    if(car.angle < 0){
      car.angle = car.angle + 360;
    }
  } else if (car.direction == "none") {
    if(car.turnvelocity > 0) {
      car.turnvelocity = car.turnvelocity - car.turnacceleration;
    }
    if(car.turnvelocity < 0 ){
      car.turnvelocity = car.turnvelocity + car.turnacceleration;
    }
  } else if (Math.abs(car.wheelturn) > 0) {

    car.turnvelocity = car.turnvelocity + car.turnacceleration;
    turnspeed = turnspeed * car.wheelturn;
    if(car.turnvelocity > turnspeed){
      car.turnvelocity = turnspeed;
    }

  } else if (car.wheelturn == 0) {

    if(car.turnvelocity > 0) {
      car.turnvelocity = car.turnvelocity - car.turnacceleration;
    }
    if(car.turnvelocity < 0 ){
      car.turnvelocity = car.turnvelocity + car.turnacceleration;
    }

  }

  car.angle = car.angle + car.turnvelocity;

  var adjacent = Math.cos(toRadians(car.angle)) * car.speed;
  var opposite = Math.sin(toRadians(car.angle)) * car.speed;
  var xd = opposite;
  var yd = -1 * adjacent;

  car.nextx = Math.round((car.showx + xd) / scaling);
  car.nexty = Math.round((car.showy + yd) / scaling);

  var nextPosition = checkPosition(car.nextx,car.nexty);

  if(car.currentx != car.nextx || car.currenty != car.nexty){
    if(nextPosition == "tree"){
    }
  }

  // Leave a skid mark on the track
  // If it's on the road - then depends on speed and turning radius
  // If it's not, then just rip it up a bit


  if(car.currentx != car.nextx || car.currenty != car.nexty){


  //Skid on initial accelleration
  //   var maxskidspeed = car.maxspeed / 1.3;
  //   if(car.gas == "on" && car.speed < maxskidspeed){
  //     var maxopacity = .2;
  //     var skidmax = car.maxspeed / 1.5;
  //     var opacity = maxopacity * ((car.maxspeed / 1.5) - car.speed);
  //     console.log(opacity);
  //     ctx.fillStyle = "rgba(0,0,0,"+opacity+")";
  //     ctx.fillRect(car.currentx * scaling, car.currenty * scaling, scaling, scaling);
  //   }

    if(currentPosition == "road") {
      var turnpercent = Math.abs(car.turnvelocity) / 4;
      var speedpercent = car.speed / car.maxspeed;
      var maxopacity = .1 * speedpercent;

      if(turnpercent > 0) {
        var opacity = maxopacity * turnpercent;
        ctx.fillStyle = "rgba(0,0,0,"+opacity+")";
        ctx.fillRect(car.currentx * scaling, car.currenty * scaling, scaling, scaling);
      }

    } else {
      ctx.fillStyle = "rgba(0,0,0,.05)";
      ctx.fillRect(car.currentx * scaling, car.currenty * scaling, scaling, scaling);
    }
  }


  // Trail shit
  var adjacent = Math.cos(toRadians(car.angle + 180)) * car.speed;
  var opposite = Math.sin(toRadians(car.angle - 180)) * car.speed;
  var xxd = opposite;
  var yyd = -1 * adjacent;

  // Particles, need a starting spot
  // And a destination spot
  // A timeout
  var leavetrails = false;

  //always leave a trail
  if((car.currentx != car.nextx || car.currenty != car.nexty) && leavetrails){
    var trail = $("<div class='spark'></div>");
    trail.height(scaling / 1).width(scaling / 1);
    trail.css("left",car.showx).css("top",car.showy);
    $(".track").append(trail);

    setTimeout(function(el,x,y) { return function() {
      el.css("transform","translateY("+ y * 20 +"px) translateX("+x * 20 +"px) scale(0)");
     }; }(trail,xxd,yyd), 1);

    setTimeout(function(el) { return function() { el.remove(); }; }(trail), 500);
  }

  //collisions

  if(car.currentx != car.nextx || car.currenty != car.nexty){
    for(var c in cars){
      var othercar = cars[c];
      if(othercar.id != car.id){
        if(othercar.nextx == car.nextx && othercar.nexty == car.nexty){
          // collideCars(car,othercar);
        }
      }
    }
  }

  var move = true;

  $(".place").css("left",car.x * scaling).css("top",car.y * scaling);

  if(currentPosition == "grass" && car.mode != "jumping"){
    if(car.speed > 1){
      car.speed = 1;
    }
  }

  if(car.mode == "normal") {
    if(currentPosition == "overpass" && nextPosition == "ledge" ) {
      move = false;
    }
    if(currentPosition == "road" && nextPosition == "ledge" ) {
      car.mode = "under";
    }
  } else if (car.mode == "under") {
    if(currentPosition == "overpass" && nextPosition == "road"){
      move = false;
    }
    if(currentPosition == "ledge" && nextPosition == "road" ) {
      car.mode = "normal";
    }
  }
  //
  if(car.mode == "jumping") {
    move = true;
  }

  if(move){
    car.showx = car.showx + xd;
    car.showy = car.showy + yd;
  } else {
    car.speed = 1;
  }

  car.el.attr("mode",car.mode);

  if(currentPosition == "finish" && car.angle > 180 && car.angle < 360){
    if(car.currentx != car.nextx) {

      race.finishLap(car);

      if(car.laptime < car.bestlap || car.bestlap == 0) {
        car.bestlap = car.laptime;
      }

      car.laptime = 0;

    }
  }

  if(car.mode == "normal" && currentPosition == "jump" && car.speed > 2) {
    car.jumpElapsed = 0;
    car.jumpTotal = car.speed * scaling / 2 ;
    car.mode = "jumping";
  }

  var jumpHeight = 0;

  if(car.mode == "jumping") {

    var maxHeight = car.jumpTotal / scaling;

    if(car.jumpElapsed < car.jumpTotal /2) {
      jumpHeight = easeOutCubic(car.jumpElapsed + 1 , 0, maxHeight , car.jumpTotal/2);
    } else {
      jumpHeight = easeInCubic(car.jumpElapsed - car.jumpTotal/2, maxHeight, -1 * maxHeight, car.jumpTotal/2);
    }

    jumpHeight = jumpHeight * 15;
    car.jumpElapsed++;

    if(car.jumpElapsed >= car.jumpTotal){
      car.mode = "normal";

    }

  }

  var update = {
    "type" : "update",
    "x": car.showx,
    "y": car.showy,
    "driver" : car.driver,
    "rotation" : car.angle,
    "height" : jumpHeight
  }

  try {
    sockjs.send(JSON.stringify(update));
  } catch(err) {

  }

  if(jumpHeight > 0){
    if(car.currentx != car.nextx || car.currenty != car.nexty){
      var trail = $("<div class='trail'></div>");
      trail.height(scaling).width(scaling);
      trail.css("left",car.x * scaling).css("top",car.y * scaling);
      trail.css("transform","translateZ("+ jumpHeight +"px)");
      $(".track").prepend(trail);
      setTimeout(function(el) { return function() { el.remove(); }; }(trail), 400);
    }
  }

  // moves the car holder
  car.el.css("transform", "translateY("+car.showy+"px) translateX("+car.showx+"px)");
  //makes the body jump
  car.body.css("transform", "rotateZ("+car.angle+"deg) translateZ("+jumpHeight+"px");

  updateGhostCars();
}


function updateGhostCars(){
  // console.log("updateGhostCars");
  for(var k in othercars){
    var c = othercars[k];
    c.el.find(".name").text(c.driver);
    c.el.find(".body").css("transform","rotateZ("+c.rotation+"deg");
    c.el.css("transform","translateX("+ c.x +"px) translateY("+c.y+"px) translateZ("+c.height+"px)");
  }
}

function easeOutCubic(currentIteration, startValue, changeInValue, totalIterations) {
	return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
}

function easeInCubic(currentIteration, startValue, changeInValue, totalIterations) {
	return changeInValue * Math.pow(currentIteration / totalIterations, 3) + startValue;
}

function checkPosition(x,y){
  var p = context.getImageData(x, y, 1, 1).data;
  var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);
  // $("body").css("background",hex);
  return hexes[hex];
}

function rgbToHex(r, g, b) {
  if (r > 255 || g > 255 || b > 255)
    throw "Invalid color component";
  return ((r << 16) | (g << 8) | b).toString(16);
}


function newCar(id){

  var car = {
    id : id,
    x : 20,
    y : 14,
    name : name,
    showx : 410,
    showy : 230,
    laps : 0,
    wheelturn : false,
    maxspeed : 5,
    direction : "",
    speed : 0,
    bestlap : 0,
    laptime: 0,
    mode: "normal",
    startspeed: 0,
    height: 0,
    driver : "Bob",
    jumpDirection: "up",
    jumpHeight: 0,
    jumpLength: 0,
    jumpElapsed: 0,
    jumpTotal: 0,
    angle: 270,
    currentx : 0,
    currenty :0,
    nextx :0,
    acceleration : .06,
    turnacceleration: .5, //.5
    nexty : 0,
    turnvelocity : 0,
    gas : "off"
  };

  //Limit the driver name to 3 uppercase CHARS
  car.changeDriver = function(name){
    car.driver = name.substr(0,3).toUpperCase();
    car.el.find(".name").text(car.driver);
    $(".driver-name").val(car.driver);
  }

  car.setDirection = function(action, direction){
    if(action == "steering") {
      this.direction = direction;
      console.log(direction);
    }
    if(action == "gas"){
      this.gas = direction;
    }
  }

  car.el = $("<div class='car'><div class='name'>" + car.name + "</div></div>");
  car.el.width(scaling);
  car.el.height(scaling);

  $(".track").append(car.el)
  var body = $("<div class='body'</div>");
  // body.append("<div/><div/><div/><div/><div/>");

  car.body = body;
  var randomColor = Math.floor(Math.random() * carcolors.length);
  car.body.css("background",carcolors[randomColor]);

  car.el.append(body);
  car.history = new Array();

  return car;
}


function prepareTrack(level){
  canvasTrack = $("canvas.track-source");
  context = canvasTrack[0].getContext("2d");

  var image = new Image();
  $("body").append(image);
  $(image).hide();
  image.src = '/tracks/' + level;

  $(".track").css("background-image", "url(/tracks/"+level+")");

  $(image).on("load",function(){
    context.drawImage(image, 0, 0);

    trackHeight = $(this).height();
    trackWidth = $(this).width();
    $(".track").height(trackHeight * scaling);
    $(".track").width(trackWidth * scaling);
    canvasTrack.height(trackHeight);
    canvasTrack.width(trackWidth);

    // Set up the skid canvas
    var skidCanvas = $(".skids");
    ctx = skidCanvas[0].getContext("2d");
    skidCanvas.attr("width", trackWidth * scaling).attr("height",trackHeight * scaling);

    var bodyHeight = $("body").height();
    var offset = (bodyHeight - $(".track-wrapper").height())/2;
    $(".track-wrapper").css("margin-top",offset - 50);

    // var coin = $("<div class='coin'><div class='vert'></div></div>");
    // $(".track").append(coin)
    // coin.css("left", scaling * 5);
    // coin.css("top", scaling * 5);

    for(var i = 0; i < parseInt(trackWidth); i++){
      for(var j = 0; j < parseInt(trackHeight); j++){
        var result = checkPosition(i,j);
        if(result == "start"){
          // console.log(i,j);
        }
        if(result == "lamp"){
          var lamp = $("<div class='lamp'></div>");
          $(".track").append(lamp)
          lamp.css("left", scaling * (i - 1));
          lamp.css("top", scaling * (j - 4));
        }

        if(result == "tree"){
          var tree = $("<div class='tree'></div>");
          $(".track").append(tree)
          tree.css("left", scaling * (i - 1));
          tree.css("top", scaling * (j - 4));
        }

      }
    }

  });

}

function trackAnimation(){
  $(".track-wrapper").addClass("trackpop");

  setTimeout(function(){
    $(".track-wrapper").removeClass("trackpop");
  },200);
}

var tracks = ["twitter.png","ampersand.png","oval-8.png","oval.png","turbo-8.png"];


function loadRandomTrack(){
  var trackCount = tracks.length;
  var random = Math.floor(Math.random() * trackCount);




  prepareTrack(tracks[random]);
}


function collideCars(carone, cartwo){
  //We need to do like an impulse thing..
  // Right now speed is just a linear component
  // straight up speed transfer
  cartwo.speed = carone.speed / 2;
  carone.speed = -1 * cartwo.speed / 2;


}