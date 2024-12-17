let ROOT_BOUNDARIES;
let ROOT_BOUNDARIES_ORIGINAL = new Rectangle(0, 0, 2473, 987);

const FRAMERATE = 30;

const htmlParser = new DOMParser();

let boidEntities;

let zones;
let gameServers = [];
let gameServerId = 1;
let selectedGameServerId = 1;

let serverList = document.getElementsByClassName('server-list')[0];

let timeElement = document.getElementById('time');
let happinessElement = document.getElementById('happiness');
let moneyElement = document.getElementById('money');
let costsElement = document.getElementById('costs');
let incomeElement = document.getElementById('income');

let enableDebug = false;
let debugTexts = [];

let gameServerColors = [
	[44, 110, 171],
	[255, 0, 255],
	[189, 142, 13],
	[8, 166, 90],
	[71, 52, 237],
	[237, 197, 52],
	[184, 135, 237],
	[237, 135, 164],
	[135, 218, 237]
]

function setup() {
	let canvasDiv = document.getElementById("level");
	LEVEL_WIDTH = elementWidth(canvasDiv)
	LEVEL_HEIGHT = window.innerHeight-4; // TODO scrollbar shown (hide? issue? proper fix?)

	ROOT_BOUNDARIES = new Rectangle(LEVEL_SPACING_LEFT, 0, LEVEL_WIDTH-(LEVEL_SPACING_LEFT), LEVEL_HEIGHT);

	let canvas = createCanvas(LEVEL_WIDTH, LEVEL_HEIGHT);
	// TODO get div width and height?
	// var canvas = createCanvas(divWidth, divHeight);
    canvas.parent("level");
	// canvas.position(0, 0);
	background(0);

    frameRate(FRAMERATE);

	addGameServer();
	addGameServer();

	
	// TODO dont hardcode these values? use percentages (use my w and h)? minx max range otherwise scales terrible on small monitors :c
	let rootZone = new Zone(
		ROOT_BOUNDARIES, gameServers[0],
		[
			new Zone( // Planetary System
				new Rectangle(50, 50, 300, 300), gameServers[0],
				[
					new Zone( // Planet
						new Rectangle(50, 50, 130, 130), gameServers[0],
						[
							new Zone( // Landing Zone
								new Rectangle(35, 40, 50, 50), gameServers[0]
							),
						]
					),
					// new Zone( // Moon
					// 	new Rectangle(210, 200, 70, 70), gameServers[0]
					// ),
				]
			),
			new Zone(new Rectangle(200, 500, 450, 450), gameServers[0]), // Planetary System
			new Zone(new Rectangle(1600, 500, 350, 350), gameServers[0]), // Planetary System
			new Zone(new Rectangle(1800, 50, 350, 350), gameServers[0]) // Planetary System
		],
		true
	);
	zones = [rootZone];

	rootZone.initRelativeSubZoneBoundaries();


	document.addEventListener('contextmenu', event => event.preventDefault());

	if (enableDebug) {
		createCustomSlider("COHESION", 0, 1, COHESION_MULTIPLIER, 0.0005, (value) => COHESION_MULTIPLIER = value);
		createCustomSlider("SEPARATION", 0, 1, SEPARATION_MULTIPLIER, 0.001, (value) => SEPARATION_MULTIPLIER = value);
		createCustomSlider("ALIGNMENT", 0, 1, ALIGNMENT_MULTIPLIER, 0.001, (value) => ALIGNMENT_MULTIPLIER = value);
		createCustomCheckbox("SHOW FLOCK COLORS", SHOW_FLOCK_COLORS, (value) => SHOW_FLOCK_COLORS = value);
		createCustomCheckbox("BOUNCE AT EDGES", BOID_BOUNCE_AT_EDGES, (value) => BOID_BOUNCE_AT_EDGES = value);
		createCustomSlider("BOID AMOUNT", 100, 10000, BOID_AMOUNT, 100, (value) => { BOID_AMOUNT = value; adjustEntityAmountTo(value); });
		createCustomSlider("BOID VISION", 8, 256, BOID_VISION, 2, (value) => BOID_VISION = value);
		createCustomSlider("BOID PERSONAL SPACE", 0, 64, BOID_PERSONAL_SPACE, 1, (value) => BOID_PERSONAL_SPACE = value);
		createCustomSlider("BOID SIZE", 1, 16, BOID_SIZE, 1, (value) => BOID_SIZE = value);
		createCustomSlider("BOID MAX SPEED", 0, 10, BOID_MAX_SPEED, 0.1, (value) => BOID_MAX_SPEED = value);
		createCustomCheckbox("USE QUADTREE", USE_QUADTREE, (value) => { USE_QUADTREE = value; totalQuadtrees = 0; });
		createCustomCheckbox("SHOW QUADTREE", SHOW_QUADTREE, (value) => SHOW_QUADTREE = value);
		createCustomSlider("MAX BOIDS PER QUADTREE", 2, 500, MAX_ENTITIES_PER_QUADTREE, 1, (value) => MAX_ENTITIES_PER_QUADTREE = value);
		createCustomSlider("MIN QUADTREE SIZE", 2, 500, MIN_QUADTREE_SIZE, 2, (value) => MIN_QUADTREE_SIZE = value);
		createCustomCheckbox("SHOW DEBUG", SHOW_DEBUG, (value) => SHOW_DEBUG = value);
	}

	spawnBoids();
}

function elementWidth(element) {
	return (
		element.clientWidth -
		parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-left")) -
		parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-right"))
	)
}

function elementHeight(element) {
	return (
		element.clientHeight -
		parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-top")) -
		parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-bottom"))
	)
}

function draw() {
	background(0);


	// INIT QUADTREE

	let startTimeQuadtreeCreation = performance.now();

	let quadtree;
	if (USE_QUADTREE) {
		quadtree = new QuadTree(ROOT_BOUNDARIES, MAX_ENTITIES_PER_QUADTREE, true);
		for (let boidEntity of boidEntities) {
			quadtree.addEntity(boidEntity);
		}
	} else {
		quadtree = new NoQuadTree(boidEntities);
	}

	let endTimeQuadtreeCreation = performance.now();


	// ZONE TREE

	for (let gameServer of gameServers) { // TODO on authority change
		gameServer.resetZones();
	}

	for (let zone of zones) {
		zone.reset();
	}

	for (let boidEntity of boidEntities) {
		for (let zone of zones) {
			if (zone.addEntity(boidEntity)) {
				break;
			}
		}
	}

	for (let gameServer of gameServers) {
		gameServer.calculateLoad();
	}

	if (frameCount % FRAMERATE === 1) {
		for (let gameServer of gameServers) {
			gameServer.updateUI();
		}
	}

	updateStatsUI();

	textFont('Courier New');
	let canBeMouseHovered = true;
	for (let zone of zones) {
		canBeMouseHovered = zone.draw(canBeMouseHovered);
	}

	// determine player happyness based on their DGS load (DGS player amount * DGS load factor)
	// sum up all player happyness / divide by player amount

	// payout money based on player happyness
	// spawn/despawn players based on happyness
	// ajust player happyness slowly over time?

	// DRAW BOIDS

	for (let boidEntity of boidEntities) {
		boidEntity.draw();
	}


	// DRAW DEBUG

	if (SHOW_QUADTREE) {
		quadtree.draw();
	}

	let res;
	if (SHOW_DEBUG) {
		// let boidPerception = new Rectangle(mouseX-64, mouseY-64, 128, 128);
		let boidPerception = boidEntities[0].getPerceptionRange();
		boidPerception.draw();
		res = quadtree.queryByRectangle(boidPerception);
		if (SHOW_QUADTREE) {
			for (let quadtree2 of res.quadtrees) {
				noFill();
				strokeWeight(1);
				stroke(255, 0, 0);
				rect(quadtree2.bounds.x, quadtree2.bounds.y, quadtree2.bounds.w, quadtree2.bounds.h);

				for (let entity of quadtree2.entities) {
					stroke(255, 0, 0);
					strokeWeight(BOID_SIZE);
					point(entity.position.x, entity.position.y);
				}
			}
		}
	}


	// SIMULATE

	let startTimeSimulation = performance.now();

	for (let boidEntity of boidEntities) {
		boidEntity.preSimulate();
	}
	for (let boidEntity of boidEntities) {
		boidEntity.simulate(quadtree, LEVEL_WIDTH, LEVEL_HEIGHT);
	}

	let endTimeSimulation = performance.now();

	// SHOW PERFORMANCE STATISTICS

	if (enableDebug) {
		showPerformanceStatistics(startTimeQuadtreeCreation, endTimeQuadtreeCreation, startTimeSimulation, endTimeSimulation, res);
	}
}


function mousePressed(event) {
	// console.log(event, mouseX, mouseY)
	if (!(event.button === 0 || event.button === 2)) {
		return;
	}

	if (mouseX < LEVEL_SPACING_LEFT || mouseX > LEVEL_WIDTH || mouseY < 0 || mouseY > LEVEL_HEIGHT) {
		return;
	}

	let shouldAssignToSubZones = event.button === 2 || (event.button === 0 && event.ctrlKey);

	let selectedGameServer;
	for (let gameServer of gameServers) {
		if (gameServer.id === selectedGameServerId) {
			selectedGameServer = gameServer;
			break;
		}
	}

	for (let zone of zones) {
		if (zone.assignAuthority(new Point2D(mouseX, mouseY), selectedGameServer, shouldAssignToSubZones)) {
			return;
		}
	}
}


// function mousePressed() {
// 	// TODO detect zone
// 	if (mouseX > LEVEL_WIDTH || mouseY > LEVEL_HEIGHT || mouseX < LEVEL_SPACING_LEFT || mouseY < 0) {
// 		return;
// 	}
//     let vx = getRandomVelocity();
//     let vy = getRandomVelocity();
// 	let boid = new Boid2D(getVector2D(mouseX, mouseY), getVector2D(vx, vy));
//     boidEntities.push(boid);
// }

function spawnBoids() {
	boidEntities = [];
	for (let i = 0; i < BOID_AMOUNT; i++) {
		boidEntities.push(getRandomBoid())
	}
}

function getRandomBoid() {
    let x = (Math.random() * (LEVEL_WIDTH-LEVEL_SPACING_LEFT-TURN_AROUND_AREA*2))+LEVEL_SPACING_LEFT+TURN_AROUND_AREA;
    let y = (Math.random() * (LEVEL_HEIGHT-TURN_AROUND_AREA*2))+TURN_AROUND_AREA;
    let vx = getRandomVelocity();
    let vy = getRandomVelocity();
	return new Boid2D(getVector2D(x, y), getVector2D(vx, vy));
}

function getVector2D(x, y) {
	return new Vector2D(x, y);
}

function getRandomVelocity() {
	return (Math.random() * 10) - 5;
}

function adjustEntityAmountTo(newAmount) {
	if (boidEntities.length > newAmount) {
		boidEntities.splice(newAmount-1, boidEntities.length-newAmount);
	} else if (boidEntities.length < newAmount) {
		for (let i = boidEntities.length; i < newAmount; i++) {
			boidEntities.push(getRandomBoid())
		}
	}
}


function updateStatsUI() {
	let day = Math.ceil(frameCount / 1440);
	let hours = Math.floor(frameCount / 60) % 24;
	let minutes = frameCount % 60;
	let time = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes);
	
	timeElement.innerText = 'Day #' + day + ' ' + time;
	costsElement.innerText = '$' + gameServers.length * 100;
}


function addGameServer() {
	if (gameServers.length >= 9) {
		return;
	}

	let gameServer = new GameServer(gameServerId);
	gameServers.push(gameServer);
	serverList.appendChild(gameServer.htmlElement);

	selectGameServer(gameServerId);
	gameServerId++;
}

function removeGameServer(e, id) {
	e.preventDefault();
	e.stopPropagation();

	if (gameServers.length === 1) {
		return;
	}

	let index = 0;
	for (let gameServer of gameServers) {
		if (gameServer.id === id) {
			gameServer.htmlElement.remove();

			gameServers.splice(index, 1);
			gameServerColors.push(gameServer.color);

			console.log(index === gameServers.length, gameServers[gameServers.length-1].id)
			if (selectedGameServerId === gameServer.id) {
				selectGameServer(gameServers[gameServers.length-1].id);
			}
			return;
		}
		index++;
	}
}

function selectGameServer(id) {
	console.log(selectedGameServerId, id)
	selectedGameServerId = id;
	for (let gameServer of gameServers) {
		if (gameServer.id === id) {
			gameServer.htmlElement.classList.add('selected');
		} else {
			gameServer.htmlElement.classList.remove('selected');
		}
	}
}






 // UI

let uiElementsAmount = 0;
let wasLastUIElementACheckbox = false;

function showPerformanceStatistics(startTimeQuadtreeCreation, endTimeQuadtreeCreation, startTimeSimulation, endTimeSimulation, res) {
	if (SHOW_DEBUG) {
		let simulationTime = endTimeSimulation-startTimeSimulation;
		let quadtreeCreationTime = USE_QUADTREE ? endTimeQuadtreeCreation-startTimeQuadtreeCreation : 0;
		let totalTime = simulationTime + quadtreeCreationTime;
		let fr = floor(frameRate());
		let texts = [
			"Simulation Time: " + simulationTime.toFixed(2) + "ms",
			"Quadtree Creation Time: " + quadtreeCreationTime.toFixed(2) + "ms",
			"Total Time: " + totalTime.toFixed(2) + "ms",
			"Framerate: " + fr,
			"Entities  (total/checked/found):",
			boidEntities.length + "/" + (res.entitiesChecked-1) + "/" + (res.entities.length-1), // itself excluded
			"Quadtrees (total/traversed/checked):",
			totalQuadtrees + "/" + res.quadtreesTraversed + "/" + res.quadtreesChecked
		]
		if (debugTexts.length === 0) {
			for (let i = 0; i < texts.length; i++) {
				createDebugText(10, uiElementsAmount*UI_SPACING+(i*20)+20, texts[i]);
			}
		} else {
			for (let i = 0; i < texts.length; i++) {
				debugTexts[i].html(texts[i]);
			}
		}
	} else {
		if (debugTexts.length > 0) {
			for (let i = 0; i < debugTexts.length; i++) {
				debugTexts[i].remove();
			}
			debugTexts = [];
		}
	}
}

function createCustomSlider(identifier, min, max, start, step, onChange) {
	let text = createP(identifier + ": " + start);
	text.position(22, uiElementsAmount*UI_SPACING);
	text.style('color', 'white')
	text.style('fontSize', '14px')
	text.style('fontFamily', 'Consolas, monospace')

	let slider = createSlider(min, max, start, step);
	slider.position(20, (uiElementsAmount*UI_SPACING) + 30);
	slider.style('width', SLIDER_WIDTH + 'px');
	slider.input(() => {
		let value = slider.value();
		text.html(identifier + ": " + value);
		onChange(value);
	});
	uiElementsAmount++;
	wasLastUIElementACheckbox = false;
}

function createCustomCheckbox(identifier, start, onChange) {
	if (!wasLastUIElementACheckbox) {
		uiElementsAmount += 0.25;
	}
	let text = createP(identifier);
	text.position(45, uiElementsAmount*UI_SPACING);
	text.style('color', 'white')
	text.style('fontSize', '14px')
	text.style('fontFamily', 'Consolas, monospace')

	let checkbox = createCheckbox('', start);
	checkbox.position(20, (uiElementsAmount*UI_SPACING)+13);
	checkbox.changed(() => {
		onChange(checkbox.checked());
	});
	uiElementsAmount += 0.5;
	wasLastUIElementACheckbox = true;
}


function createDebugText(x, y, identifier) {
	let text = createP(identifier);
	text.position(x, y);
	text.style('color', 'white')
	text.style('fontSize', '12px')
	text.style('fontFamily', 'Consolas, monospace')
	debugTexts.push(text);
}


