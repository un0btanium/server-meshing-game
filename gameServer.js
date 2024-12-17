class GameServer {

	constructor(id) {
		var html = '' + 
			'<div class="server" onclick="selectGameServer(' + gameServerId + ')">' + 
			'	<div class="name"><span class="shutdown" onclick="removeGameServer(event, ' + gameServerId + ')">❌</span>DGS #' + (gameServerId) + '</div>' + 
			'	<div class="server-stats-container">' + 
			'		<div class="load">LOAD: 0%</div>' + 
			'		<div class="fps">FPS: 30</div>' + 
			'	</div>' + 
			'</div>';

		let color = gameServerColors.shift();
		let colorRgb = 'rgb(' + color.join(',') + ')';

		this.htmlElement = htmlParser.parseFromString(html, "text/html").getElementsByClassName('server')[0];
		this.htmlElement.style.borderColor = colorRgb;
		this.htmlElement.getElementsByClassName('name')[0].style.borderColor = colorRgb;

		this.id = id;
		this.color = color;
		this.htmlElementLoad = this.htmlElement.getElementsByClassName('load')[0];
		this.htmlElementFPS = this.htmlElement.getElementsByClassName('fps')[0];
		this.htmlElementShutdown = this.htmlElement.getElementsByClassName('shutdown')[0];
		this.htmlElementStats = this.htmlElement.getElementsByClassName('server-stats-container')[0];
		this.fps = 30;
		this.load = 0.0;
		this.zones = []
	}

	resetZones() {
		this.zones = [];
	}

	calculateLoad() {
		let playerCount = 0;
		for (let zone of this.zones) {
			playerCount += zone.entities.length;
		}

		let maxPlayerCountPerServer = 100;
		this.load = (playerCount / maxPlayerCountPerServer) * 100; // linear, exponential, logarithmic?
		if (playerCount < maxPlayerCountPerServer) {
			this.fps = 30;
		} else {
			this.fps = (maxPlayerCountPerServer / playerCount) * 30;
		}
		// console.log(this.zones.length, playerCount, this.load, this.fps)

		
		if (this.zones.length === 0) {
			this.htmlElementShutdown.classList.remove('disabled');
		} else {
			this.htmlElementShutdown.classList.add('disabled');
		}
	}

	updateUI() {
		this.htmlElementLoad.innerText = 'LOAD: ' + Math.ceil(this.load) + '%';
		this.htmlElementFPS.innerText = 'FPS: ' + Math.ceil(this.fps);

		if (this.fps === 30) {
			this.htmlElementStats.style.color = 'green';
		} else if (this.fps >= 25) {
			this.htmlElementStats.style.color = 'lightgreen';
		} else if (this.fps >= 20) {
			this.htmlElementStats.style.color = 'yellow';
		} else if (this.fps >= 10) {
			this.htmlElementStats.style.color = 'orange';
		} else {
			this.htmlElementStats.style.color = 'red';
		}
	}

}