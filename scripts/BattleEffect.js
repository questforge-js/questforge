"use strict";

QuestForge.prototype.BattleEffect = function (props) {
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('tileset') === false) {
		this.tileset = QuestForge.current.view.tilesets.effects;
	}
	
	if (props.hasOwnProperty('animate') === false) {
		this.animate = QuestForge.current.BattleEffect.animateStatic;
	}
};

QuestForge.prototype.BattleEffect.prototype = {
	id: null,
	
	tileset: null,
	spriteX: 0,
	spriteY: 0,
	width: 1,
	height: 1,
	x: 0,
	y: 0,
	z: 4,
	isFlippedX: false,
	isFlippedY: false,
	
	age: 0,
	animate: null,
	duration: null,
	flipForSide: true,
	target: null,
};

QuestForge.prototype.BattleEffect.animateStatic = function (props) {
};

QuestForge.prototype.BattleEffect.animateDisintegrating = function (props) {
	var view;
	
	view = QuestForge.current.view;
	props.y += this.age * view.conf.tileHeight;
	
	if (this.age < this.height - 1) {
		// Clip top of the disintegration sprite.
		props.y += view.conf.tileHeight * (this.height - this.age - 1);
		props.height -= view.conf.tileHeight * (this.height - this.age - 1);
		props.spriteY += this.height - this.age - 1;
	}
	else if (this.age >= this.height) {
		// Clear tile above disintegration sprite.
		view.drawTile(view.tilesets.dialog, 0, 0, Math.floor(props.x / view.conf.tileWidth) + ((this.flipForSide === true && this.target.side === 1) ? this.width - 1 : 0), this.target.arenaBaseY + this.age - this.height);
	}
	
	if (this.age + this.height >= this.duration) {
		// Clip bottom of the disintegration sprite.
		props.height = (this.duration - this.age - 1) * view.conf.tileHeight;
	}
};

QuestForge.prototype.BattleEffect.animateBouncing = function (props) {
	if (this.age < 8) {
		props.y += (((this.age - 4) * (this.age - 4)) >>> 1) - 16;
	}
	else if (this.age < 12) {
		props.y += (((this.age - 10) * (this.age - 10))) - 8;
	}
};
