/*
 * Bat'n'Ball style game, similar to Atari's Breakout
 */

var debug = false;

// Shortcuts
var floor = Math.floor;
var random = Math.random;
var PI = Math.PI;

// Miscellaneous
var i;

// Canvas variables
var canvas;
var ctx;
var width;
var height;

// Bricks
const BRICK_COLS = 10;
const BRICK_ROWS = 10;
var brickHeight = 20;
var brickWidth;
var brickOffsetY;
var bricks = [];
var bricksRemaining;
var brickStyle = "#00f"; // TODO: Change to multi-colours

// Player
var paddle;
var paddleWidth = 80;
var paddleHeight = 10;
var paddleOffsetY;
var paddleStyle = "#fff";
var score = 0;
var lives;
const NUM_LIVES = 5;

// Ball
var x;
var y;
var ballSize = 7;
var dx;
var dy;
var speed;
const MAX_SPEED = 6;
const START_SPEED = 3;
var hasHitPaddle;
var ballStyle = "#ff0";

// Game
var gameOverMan = false;
var highScore = 0;

// Colours
scoreStyle = "#0f0";
livesStyle = "#888";

window.onload = init;

/*
 * init()
 */
function init() {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	if(ctx) initGame();
}


/*
 * Initialise the game
 */
function initGame() {
	
	document.getElementById('game_over').style.display = "none";
	
	width = canvas.width;
	height = canvas.height;
	
	paddleOffsetY = height - (height / 20);
	brickWidth = width / BRICK_COLS;
	paddle = width / 2;
	brickOffsetY = height / 10;
	
	score = 0;
	lives = NUM_LIVES - 1; // Remove one at start for first life we're playing with
	gameOverMan = false;
	
	canvas.addEventListener('mousemove', updateMousePos);
	canvas.onclick = mouseClick;
	resetBall();
	resetBricks();
	playGame();
	
}

/*
 * Play the game
 */
function playGame() {
	
	if(!gameOverMan) { 
		requestAnimationFrame(playGame);
	} else {
		gameOver();
	}
	
	moveAll();
	checkBrickCollision();
	drawAll();
}



/*
 *
 * D R A W I N G   F U N C T I O N S
 *
 */

function drawAll() {
	
	ctx.clearRect( 0,0, width,height );
	
	drawGameInfo();
	drawBricks();
	drawBall();
	drawPaddle();
	
}

function drawBall() {
	
	ctx.fillStyle = ballStyle;
	ctx.beginPath();
	ctx.arc( x,y, ballSize, 0,2 * PI, 0);
	ctx.fill();
	ctx.closePath();
	
}

function drawPaddle() {
	
	fillRect( paddle - paddleWidth / 2, paddleOffsetY - paddleHeight, 
			 paddleWidth, paddleHeight, paddleStyle );
	
}

function drawBricks() {
	
	for( i = 0; i < BRICK_ROWS * BRICK_COLS; i++ ) {
		// Check the brick exists
		if(bricks[i]) {
			var brickX = ( i % BRICK_COLS );
			var brickY = floor(i / BRICK_COLS);
			fillRect( brickX * brickWidth + 1,brickY * brickHeight + brickOffsetY + 1,
					brickWidth - 2,brickHeight - 2, brickStyle);
		}
	}
}

function drawGameInfo() {
	
	ctx.strokeStyle = scoreStyle;
	ctx.font="20px Verdana";
	ctx.textAlign = "left";
	ctx.strokeText(formatScore(score) + ' < 1UP',8,24);
	ctx.textAlign = "center";
	ctx.strokeText('HI ' + formatScore(highScore),width / 2,24);
	
	
	function formatScore(n) {
		var displayScore = '000000' + n + '0';
		return(displayScore.substring(displayScore.length - 8,displayScore.length));
	}
	
	// Show number of lives (paddles) left
	for(i = 0; i < lives; i ++) {
		fillRect((paddleWidth / 3) + (i * (paddleWidth / 2)),height - paddleHeight,
				paddleWidth / 3, paddleHeight / 2, livesStyle);
	}
}


function fillRect( x,y, width,height, style) {
	
	ctx.fillStyle = style;
	ctx.fillRect( x,y, width, height );
	
}


/*
 *
 * M O V E M E N T   R O U T I N E S
 *
 */

function moveAll() {
	moveBall();
}

function moveBall() {
	
	x += dx * speed;
	y += dy * speed;
	
	// Check for hitting edges
	if( x <= 0 || x >= width) {
		if( x < 0 ) x = 0;
		if( x > width ) x = width;
		dx *= -1;
	}
	
	// Check for hittin the top
	if( y <= 0 ) {
		y = 0;
		dy *= -1;
	}
	
	// Check for hitting the player's paddle
	if( y + ballSize >= paddleOffsetY &&
	  y + ballSize < paddleOffsetY + paddleHeight &&
	  x + ballSize >= paddle - paddleWidth / 2 &&
	  x <= paddle + paddleWidth / 2 &&
	  dy > 0) {
		hasHitPaddle = true;
		dy *= -1;
		dx = ((x - paddle) / (paddleWidth / 4));
		y += dy * speed;
	}
	
	// Check for hitting the bottom
	if( y >= height ) {
		lives--;
		console.log('Lives: ' + lives);
		if(lives < 0) {
			gameOverMan = true;
		} else {
			resetBall();
		}
	}
}


/*
 * Reset the ball
 */
function resetBall() {
	
	hasHitPaddle = false;
	speed = START_SPEED;
	x = rand(width);
	y = 0;
	dy = 1;
	if(random() > 0.4) {
		dx = 1;
	} else {
		dx = -1;
	}
	
}



/*
 * Reset bricks
 */
function resetBricks() {
	
	for( i = 0; i < BRICK_COLS * BRICK_ROWS; i++ ) {
		bricks[i] = true;
	}
	
	bricksRemaining = BRICK_COLS * BRICK_ROWS;
	speed = 2; // Reset speed of ball on new set
	
}

function checkBallSpeed(row) {
	
	var newSpeed = BRICK_ROWS - row + 1;
	// Speed up ball according to row hit
	speed = newSpeed > speed ? newSpeed : speed;
	// Limit maximum speed
	speed = speed > MAX_SPEED ? MAX_SPEED : speed;
}


/*
 *
 * B R I C K   C O L L I S I O N
 *
 */
function checkBrickCollision() {
	
	// Only check for collisions once the player has returned the ball
	if(hasHitPaddle) {
		var brickRowNow = toRow(y);
		var brickColNow = toCol(x);
		if( brickRowNow >= 0 && brickRowNow < BRICK_ROWS && brickColNow >=0 && brickColNow < BRICK_COLS ) {
			if(bricks[ toIndex(brickRowNow,brickColNow) ]) {

				checkBallSpeed(brickRowNow);

				var brickRowPrev = toRow( y - dy * speed );
				var brickColPrev = toCol( x - dx * speed );

				bricks[ toIndex(brickRowNow,brickColNow) ] = false;
				bricksRemaining--;
				score++;
				if(bricksRemaining === 0) {
					resetBricks();
					resetBall();
				}

				var bounce = false;
				if(brickColNow != brickColPrev) {
					if(!bricks[toIndex(brickRowNow,brickColPrev)]) {
						dx *= -1;
						bounce = true;
					} 
				} 
				if(brickRowNow != brickRowPrev) {
					if(!bricks[toIndex(brickRowPrev,brickColNow)]) {
						dy *= -1;
						bounce = true;
					}
				}

				if(!bounce) {
					dx *= -1;
					dy *= -1;
				}

			}
		}
	}
	
}

function gameOver() {
	highScore = score > highScore ? score : highScore;
	drawGameInfo();
	document.getElementById('game_over').style.display = "block";
}


function mouseClick(e) {
	
	if(debug) {
	
		var rect = canvas.getBoundingClientRect();
		var root = document.documentElement;

		mouseX = e.clientX - rect.left - root.scrollLeft;
		mouseY = e.clientY - rect.top - root.scrollTop;

		x = mouseX;
		y = mouseY;

		console.log('x: ' + floor(x) + ', y: ' + floor(y));
		console.log('row:' + toRow(y) + ', col: ' + toCol(x));
	}
	
}

function updateMousePos(e) {
		
	var rect = canvas.getBoundingClientRect();
	var root = document.documentElement;

	mouseX = e.clientX - rect.left - root.scrollLeft;
	mouseY = e.clientY - rect.top - root.scrollTop;

	paddle = mouseX;
	// Stop bat going off edges of screen
	if(paddle < paddleWidth / 2) paddle = paddleWidth / 2;
	if(paddle > width - paddleWidth / 2) paddle = width - paddleWidth / 2;
	
}


function toCol(n) {
	return floor( n / brickWidth );
}

function toRow(n) {
	return floor( ( n - brickOffsetY ) / brickHeight );
}

function toIndex( row,col ) {
	return row * BRICK_COLS + col;
}

function rand(n) {
	return floor(random() * n);
}