
class Vector2D {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	add(otherVector) {
		this.x += otherVector.x;
		this.y += otherVector.y;
	}

	sub(otherVector) {
		this.x -= otherVector.x;
		this.y -= otherVector.y;
	}

	div(divisor) {
		this.x /= divisor;
		this.y /= divisor;
	}

	mul(factor) {
		this.x *= factor;
		this.y *= factor;
	}

	length() {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}

	normalize() {
		let length = this.length();
		if (length !== 0) {
			this.div(length);
		}
	}
}