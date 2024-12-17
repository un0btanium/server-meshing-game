
class Zone {

	constructor(bounds, authorizedGameServer, subZones=[], isRoot=false) {
		this.bounds = bounds;
		this.authorizedGameServer = authorizedGameServer;
		this.subZones = subZones;
		this.entities = [];

		//TODO use window height and width

		if (isRoot) {
			return;
		}

		// how to scale? top bototm left right 
		// TODO have min max sizes from which to scale w and h, only scale position otherwise
		this.bounds.x = this.bounds.x * (ROOT_BOUNDARIES.w / ROOT_BOUNDARIES_ORIGINAL.w)
		this.bounds.y = this.bounds.y * (ROOT_BOUNDARIES.h / ROOT_BOUNDARIES_ORIGINAL.h)
		this.bounds.w = this.bounds.w * (ROOT_BOUNDARIES.w / ROOT_BOUNDARIES_ORIGINAL.w)
		this.bounds.h = this.bounds.w // this.bounds.h * (ROOT_BOUNDARIES.h / ROOT_BOUNDARIES_ORIGINAL.h)
	}

	initRelativeSubZoneBoundaries() {
		for (let subZone of this.subZones) {
			subZone.bounds.x += this.bounds.x;
			subZone.bounds.y += this.bounds.y;
			subZone.initRelativeSubZoneBoundaries();
		}
	}

	addSubZone(subZone) {
		if (!this.bounds.containsRectangle(subZone.bounds)) {
			return false;
		}

		for (let subZone of this.subZones) {
			if (subZone.addSubZone(subZone)) {
				return true;
			}
		}

		this.subZones.push(subZone);
		return true;
	}

	reset() {
		this.entities = [];
		this.authorizedGameServer.zones.push(this);
		for (let subZone of this.subZones) {
			subZone.reset();
		}
	}

	clearEntityList() {
		this.entities = [];
		for (let subZone of this.subZones) {
			subZone.clearEntityList();
		}
	}

	addEntity(entity) {
		if (!this.bounds.contains(entity)) {
			return false;
		}
		
		for (let subZone of this.subZones) {
			if (subZone.addEntity(entity)) {
				return true;
			}
		}
		
		this.entities.push(entity);
		return true;
	}

	assignAuthority(point, gameServer, shouldAssignToSubZones, forceAssign=false) {
		if (forceAssign) {
			this.authorizedGameServer = gameServer;
			for (let subZone of this.subZones) {
				subZone.assignAuthority(point, gameServer, shouldAssignToSubZones, true);
			}
		}

		if (!this.bounds.contains(point)) {
			return false;
		}
		
		for (let subZone of this.subZones) {
			if (subZone.assignAuthority(point, gameServer, shouldAssignToSubZones)) {
				return true;
			}
		}

		this.authorizedGameServer = gameServer;

		if (shouldAssignToSubZones) {
			for (let subZone of this.subZones) {
				subZone.assignAuthority(point, gameServer, shouldAssignToSubZones, true);
			}
		}

		return true;
	}



	draw(canBeMouseHovered) {
		for (let subZone of this.subZones) {
			canBeMouseHovered = subZone.draw(canBeMouseHovered);
		}

		let isHovered = false;
		if (canBeMouseHovered && this.bounds.contains(new Point2D(mouseX, mouseY))) {
			isHovered = true;
			canBeMouseHovered = false;
		}
		
		stroke(...this.authorizedGameServer.color);
		strokeWeight(1);
		text('' + this.entities.length, this.bounds.x + 5, this.bounds.y + 12);
		text('' + Math.ceil(this.authorizedGameServer.fps), this.bounds.x + 5, this.bounds.y + 26);
		noFill();
		strokeWeight(isHovered ? 2 : 1);
		rect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);

		return canBeMouseHovered;
	}

}