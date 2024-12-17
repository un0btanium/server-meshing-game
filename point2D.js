class Point2D {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	draw() {
		stroke(0, 255, 0);
		strokeWeight(3);
		point(this.x, this.y);
	}
}