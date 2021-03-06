//Aliases
let Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Graphics = PIXI.Graphics,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
    TextStyle = PIXI.TextStyle;

/**
* Create a Pixi Application
*/
let app = new Application({
  /**
  * @param {number} width - width of the pixi application
  * @param {number} height - height of the pixi application
  * @param {boolean} antialiasing - antialiasing yes or no
  * @param {boolean} transparent - is the background transparent or black
  * @param {number} resolution - which resolution does the app get
  */
    width: 512,
    height: 512,
    antialiasing: true,
    transparent: false,
    resolution: 1
  }
);

/**
* Add the canvas that Pixi automatically created for you to the HTML document
*/
document.body.appendChild(app.view);
loader
  .add("images/treasureHunter.json")
  .load(setup);

/**
* Define variables that might be used in more than one function
*/
let state, explorer, treasure, blobs, chimes, exit, player, dungeon,
    door, healthBar, message, gameScene, gameOverScene, enemies, id;

/**
* setup the pixi application
*/
function setup() {
  /**
  * Make the game scene and add it to the stage
  */
  gameScene = new Container();
  app.stage.addChild(gameScene);
  /**
  * Make the sprites and add them to the `gameScene`
  * Create an alias for the texture atlas frame ids
  */
  frame ids;
  id = resources["images/treasureHunter.json"].textures;
  /**
  * Add the door to the scene
  */
  dungeon = new Sprite(id["dungeon.png"]);
  gameScene.addChild(dungeon);
  /**
  * Add the dungeon to the scene
  */
  door = new Sprite(id["door.png"]);
  door.position.set(32, 0);
  gameScene.addChild(door);
  /**
  * Add the explorer to the scene
  */
  explorer = new Sprite(id["explorer.png"]);
  explorer.x = 68;
  explorer.y = gameScene.height / 2 - explorer.height / 2;
  explorer.vx = 0;
  explorer.vy = 0;
  gameScene.addChild(explorer);
  /**
  * Add the trasure to the scene
  */
  treasure = new Sprite(id["treasure.png"]);
  treasure.x = gameScene.width - treasure.width - 48;
  treasure.y = gameScene.height / 2 - treasure.height / 2;
  gameScene.addChild(treasure);
  /**
  * Add the Blobs to the scene
  * @param {number[]} blobs
  */
  let numberOfBlobs = 6,
      spacing = 48,
      xOffset = 150,
      speed = 2,
      direction = 1;
  /**
  * @param {string[]} n make a string of blobs
  */
  blobs = [];
  //Make as many blobs as there are `numberOfBlobs`
  for (let i = 0; i < numberOfBlobs; i++) {
    //Make a blob
    let blob = new Sprite(id["blob.png"]);
    //Space each blob horizontally according to the `spacing` value.
    //`xOffset` determines the point from the left of the screen
    //at which the first blob should be added
    let x = spacing * i + xOffset;
    //Give the blob a random y position
    let y = randomInt(0, app.stage.height - blob.height);
    //Set the blob's position
    blob.x = x;
    blob.y = y;
    //Set the blob's vertical velocity. `direction` will be either `1` or
    //`-1`. `1` means the enemy will move down and `-1` means the blob will
    //move up. Multiplying `direction` by `speed` determines the blob's
    //vertical direction
    blob.vy = speed * direction;
    //Reverse the direction for the next blob
    direction *= -1;
    //Push the blob into the `blobs` array
    blobs.push(blob);
    //Add the blob to the `gameScene`
    gameScene.addChild(blob);
  }
  /**
  * Create a health bar
  */
  healthBar = new Container();
  healthBar.position.set(app.stage.width - 170, 4)
  gameScene.addChild(healthBar);
  /**
  * Create the black background rectangle
  * @param {graphics} innerBar - inner bar rectangle
  */
  let innerBar = new Graphics();
  innerBar.beginFill(0x000000);
  innerBar.drawRect(0, 0, 128, 8);
  innerBar.endFill();
  healthBar.addChild(innerBar);
  /**
  * Create the front red rectangle
  * @param {graphics} innerBar - outer bar rectangle
  */
  let outerBar = new Graphics();
  outerBar.beginFill(0xFF3300);
  outerBar.drawRect(0, 0, 128, 8);
  outerBar.endFill();
  healthBar.addChild(outerBar);
  healthBar.outer = outerBar;
  /**
  * Create the `gameOver` scene
  */
  gameOverScene = new Container();
  app.stage.addChild(gameOverScene);
  //Make the `gameOver` scene invisible when the game first starts
  gameOverScene.visible = false;
  //Create the text sprite and add it to the `gameOver` scene
  let style = new TextStyle({
    fontFamily: "Futura",
    fontSize: 64,
    fill: "white"
  });
  message = new Text("The End!", style);
  message.x = 120;
  message.y = app.stage.height / 2 - 32;
  gameOverScene.addChild(message);

//Set the game state
state = play;

//Start the game loop
app.ticker.add(delta => gameLoop(delta));
}

/**
* Add the gameloop
* @param {number} delta
*/
function gameLoop(delta){
  //Update the current game state:
  state(delta);
}

/**
* Add the play function
* @param {number} delta
*/
function play(delta) {
  //use the explorer's velocity to make it move
  explorer.x += explorer.vx;
  explorer.y += explorer.vy;
  //Contain the explorer inside the area of the dungeon
  contain(explorer, {x: 28, y: 10, width: 488, height: 480});
  //contain(explorer, stage);
  //Set `explorerHit` to `false` before checking for a collision
  let explorerHit = false;
  //Loop through all the sprites in the `enemies` array
  blobs.forEach(function(blob) {
    //Move the blob
    blob.y += blob.vy;
    //Check the blob's screen boundaries
    let blobHitsWall = contain(blob, {x: 28, y: 10, width: 488, height: 480});
    //If the blob hits the top or bottom of the stage, reverse
    //its direction
    if (blobHitsWall === "top" || blobHitsWall === "bottom") {
      blob.vy *= -1;
    }
    //Test for a collision. If any of the enemies are touching
    //the explorer, set `explorerHit` to `true`
    if(hitTestRectangle(explorer, blob)) {
      explorerHit = true;
    }
  });
  //If the explorer is hit...
  if(explorerHit) {
    //Make the explorer semi-transparent
    explorer.alpha = 0.5;
    //Reduce the width of the health bar's inner rectangle by 1 pixel
    healthBar.outer.width -= 1;
  } else {
    //Make the explorer fully opaque (non-transparent) if it hasn't been hit
    explorer.alpha = 1;
  }
  //Check for a collision between the explorer and the treasure
  if (hitTestRectangle(explorer, treasure)) {
    //If the treasure is touching the explorer, center it over the explorer
    treasure.x = explorer.x + 8;
    treasure.y = explorer.y + 8;
  }
  //Does the explorer have enough health? If the width of the `innerBar`
  //is less than zero, end the game and display "You lost!"
  if (healthBar.outer.width < 0) {
    state = end;
    message.text = "You lost!";
  }
  //If the explorer has brought the treasure to the exit,
  //end the game and display "You won!"
  if (hitTestRectangle(treasure, door)) {
    state = end;
    message.text = "You won!";
  }

/**
* Add the end-screen when the game is over
*/
function end() {
  gameScene.visible = false;
  gameOverScene.visible = true;
}

/* Helper functions */
function contain(sprite, container) {
  let collision = undefined;
  //Left
  if (sprite.x < container.x) {
    sprite.x = container.x;
    collision = "left";
  }
  //Top
  if (sprite.y < container.y) {
    sprite.y = container.y;
    collision = "top";
  }
  //Right
  if (sprite.x + sprite.width > container.width) {
    sprite.x = container.width - sprite.width;
    collision = "right";
  }
  //Bottom
  if (sprite.y + sprite.height > container.height) {
    sprite.y = container.height - sprite.height;
    collision = "bottom";
  }
  //Return the `collision` value
  return collision;
}
//The `hitTestRectangle` function
function hitTestRectangle(r1, r2) {
  //Define the variables we'll need to calculate
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
  //hit will determine whether there's a collision
  hit = false;
  //Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;
  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;
  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;
  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;
  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {
    //A collision might be occuring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {
      //There's definitely a collision happening
      hit = true;
    } else {
      //There's no collision on the y axis
      hit = false;
    }
  } else {
    //There's no collision on the x axis
    hit = false;
  }
  //`hit` will be either `true` or `false`
  return hit;
};
//The `randomInt` helper function
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function onDragStart(event) {
  // store a reference to the data
// the reason for this is because of multitouch
// we want to track the movement of this particular touch
  this.data = event.data;
  this.alpha = 0.5;
  this.dragging = true;
}

function onDragEnd(){
  this.alpha = 1;
  this.dragging = false;
  // set the interaction data to null
  this.data = null;
}

function onDragMove(){
  if (this.dragging){
    var newPosition = this.data.getLocalPosition(this.parent);
    this.position.x = newPosition.x;
    this.position.y = newPosition.y;
  }
}
