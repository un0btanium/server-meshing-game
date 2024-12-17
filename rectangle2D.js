class Rectangle {
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
	
	contains(point) {
		return point.x >= this.x
			&& point.x < this.x+this.w
			&& point.y >= this.y
			&& point.y < this.y+this.h
		;
	}
	
	containsRectangle(rectangle) {
		return rectangle.x >= this.x
			&& rectangle.x+rectangle.w < this.x+this.w
			&& rectangle.y >= this.y
			&& rectangle.y+rectangle.h < this.y+this.h
		;
	}

	draw() {
		noFill();
		strokeWeight(1);
		stroke(255);
		rect(this.x, this.y, this.w, this.h);
	}
}