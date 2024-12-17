let entityId = 0;


class Boid2D {
	constructor(position, velocity) {
		this.id = entityId++;
		this.flockId = Math.floor(Math.random() * (FLOCKS+1)) - 1; // -1 solo
		
		this.position = position;
		this.velocity = velocity;

		this.previousPosition = this.position;
		this.previousVelocity = this.velocity;
		
		this.eventId = -1;
	}

	draw() {
		// TODO authority colors (harcode colors up to 10 servers? randomize afterwards?)
		if (SHOW_FLOCK_COLORS) {
			switch(this.flockId) {
				case 0: stroke(97, 179, 255); break;
				case 1: stroke(97, 255, 128); break;
				case 2: stroke(217, 12, 255); break;
				case 3: stroke(254, 121, 121); break;
				case 4: stroke(227, 245, 66); break;
				default: stroke(255, 255, 255);
			}
		} else {
			stroke(97, 179, 255);
		}
		strokeWeight(BOID_SIZE);
		point(this.position.x, this.position.y);
	}

	preSimulate() { // TODO optimize away? introduce more variables put before and after simulate? 
		this.previousPosition = this.position;
		this.previousVelocity = this.velocity;
	}

	simulate(quadtree, maxWidth, maxHeight) {
		let perceptionRange = this.getPerceptionRange();
		let localBoids = quadtree.queryByRectangle(perceptionRange).entities;

		this.cohesion(localBoids);
		this.separation(localBoids);
		this.alignment(localBoids);
		this.limitSpeed();

		this.updatePosition();
		
		if (BOID_BOUNCE_AT_EDGES) {
			this.keepWithinBoundsViaTurn(maxWidth, maxHeight);
		} else {
			this.keepWithinBoundsViaTeleport(maxWidth, maxHeight);
		}
	}

	cohesion(localBoids) {
		if (this.flockId === -1) { // solo
			return;
		}
		let averagePosition = new Vector2D(0, 0);
		let neighborAmount = 0;
		for (let localBoid of localBoids) {
			if (localBoid === this) {
				continue;
			}
			if (this.flockId !== localBoid.flockId) {
				continue;
			}
			averagePosition.add(localBoid.previousPosition);
			neighborAmount++;
		}
		if (neighborAmount > 0) {
			averagePosition.div(neighborAmount); // average
			averagePosition.sub(this.previousPosition); // steer toward center of the flock
			averagePosition.mul(COHESION_MULTIPLIER);
			this.velocity.add(averagePosition);
		}
	}

	separation(localBoids) {
		let position = new Vector2D(0, 0);
		for (let localBoid of localBoids) {
			if (localBoid === this) {
				continue;
			}
			// if (this.flockId !== localBoid.flockId) {
			// 	continue;
			// }
			if (this.distanceTo(localBoid.previousPosition) > BOID_PERSONAL_SPACE + BOID_SIZE) {
				continue;
			}
			let tempPosition = new Vector2D(this.previousPosition.x, this.previousPosition.y);
			tempPosition.sub(localBoid.previousPosition);
			position.add(tempPosition);
		}
		position.mul(SEPARATION_MULTIPLIER);
		this.velocity.add(position);
	}

	alignment(localBoids) {
		if (this.flockId === -1) { // solo
			return;
		}
		let averageVelocity = new Vector2D(0,0);
		let neighborAmount = 0;
		for (let localBoid of localBoids) {
			if (localBoid === this) {
				continue;
			}
			if (this.flockId !== localBoid.flockId) {
				continue;
			}
			averageVelocity.add(localBoid.previousVelocity);
			neighborAmount++;
		}
		if (neighborAmount > 0) {
			averageVelocity.div(neighborAmount); // average
			averageVelocity.sub(this.previousVelocity); // steer in the direction of the flock
			averageVelocity.mul(ALIGNMENT_MULTIPLIER);
			this.velocity.add(averageVelocity); 
		}
	}

	limitSpeed() {
		const speed = this.velocity.length();
		if (speed > BOID_MAX_SPEED) {
			this.velocity.div(speed)
			this.velocity.mul(BOID_MAX_SPEED); //  - (Math.random() * 0.2)
		}
	}
	
	updatePosition() {
		this.position.add(this.velocity);
	}

	getPerceptionRange() {
		return new Rectangle(
			this.position.x-BOID_VISION/2,
			this.position.y-BOID_VISION/2,
			BOID_VISION,
			BOID_VISION
		);
	}

	distanceTo(otherPosition) {
		let a = (otherPosition.x - this.previousPosition.x);
		let b = (otherPosition.y - this.previousPosition.y);
		return Math.sqrt(a*a + b*b);
	}

	keepWithinBoundsViaTeleport(maxWidth, maxHeight) {
		if (this.position.x < LEVEL_SPACING_LEFT) {
			this.position.x += maxWidth - LEVEL_SPACING_LEFT;
		}
		if (this.position.y < 0) {
			this.position.y += maxHeight;
		}
		if (this.position.x > maxWidth) {
			this.position.x -= maxWidth - LEVEL_SPACING_LEFT;
		}
		if (this.position.y > maxHeight) {
			this.position.y -= maxHeight;
		}
	}

	keepWithinBoundsViaTurn(maxWidth, maxHeight) {
		const turnFactor = 1; // - ((Math.random() * 1) - 0.5);

		if (this.position.x < TURN_AROUND_AREA + LEVEL_SPACING_LEFT) {
			this.velocity.x += turnFactor;
		}
		if (this.position.y < TURN_AROUND_AREA) {
			this.velocity.y += turnFactor;
		}
		if (this.position.x > maxWidth - TURN_AROUND_AREA) {
			this.velocity.x -= turnFactor;
		}
		if (this.position.y > maxHeight - TURN_AROUND_AREA) {
			this.velocity.y -= turnFactor;
		}
	}

	get x() {
		return this.position.x;
	}

	get y() {
		return this.position.y;
	}
}