
// class Circle {
// 	constructor(x, y, radius) {
// 		this.x = x;
// 		this.y = y;
// 		this.radius = radius;
// 	}

// 	draw() {
// 		noFill();
// 		stroke(0, 0, 255);
// 		strokeWeight(1);
// 		ellipse(this.x, this.y, this.radius);
// 	}

// 	contains(point) {
// 		let square_dist = (this.x - point.x) * (this.x - point.x) + (this.y - point.y) * (this.y - point.y)
// 		return square_dist <= this.radius * 32

// 		// if (   point.x < this.x-this.radius
// 		// 	&& point.x < this.x+this.w
// 		// 	&& point.y >= this.y
// 		// 	&& point.y < this.y+this.h)
// 		// {
// 		// 	return false;
// 		// }
// 		// return point.x >= this.x
// 		// 	&& point.x < this.x+this.w
// 		// 	&& point.y >= this.y
// 		// 	&& point.y < this.y+this.h
// 		// ;
// 	}
// }