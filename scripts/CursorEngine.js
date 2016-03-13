"use strict";

QuestForge.prototype.CursorEngine = function (props) {
	this.conf = {
	};
	
	QuestForge.applyProperties(props, this.conf);
};

QuestForge.registerEngine('CursorEngine', []);

QuestForge.prototype.CursorEngine.prototype = {
	conf: null,
	
	positions: null,
	spriteX: null,
	spriteY: null,
	x: null,
	y: null,
	
	eventHandler: null,
	
	//== Initialization ==//
	
	prepare: function (props) {
		var i, j, positions, positionsCol, precisePositions, precisePositionsCol,
		    view;
		
		view = QuestForge.current.view;
		
		if (props.positions[0] === null || typeof props.positions[0][0] === 'number') {
			// This is a single column of positions. Wrap it
			// in an array to conform to the standard
			// multi-column structure.
			
			positions = [props.positions];
		}
		else {
			positions = props.positions
		}
		
		// Convert positions to precise values.
		
		precisePositions = new Array(positions.length);
		
		for (i = positions.length - 1; i >= 0; --i) {
			positionsCol = positions[i];
			
			precisePositionsCol = new Array(positionsCol.length);
			
			for (j = positionsCol.length - 1; j >= 0; --j) {
				if (positionsCol[j] === null) {
					precisePositionsCol[j] = null;
				}
				else {
					precisePositionsCol[j] = [positionsCol[j][0] * view.conf.tileWidth, positionsCol[j][1] * view.conf.tileHeight];
				}
			}
			
			precisePositions[i] = precisePositionsCol;
		}
		
		this.preparePrecise(props, precisePositions);
	},
	
	preparePrecise: function (props, positions) {
		var i, j;
		
		if (positions !== undefined) {
			this.positions = positions;
		}
		else if (props.positions[0] === null || typeof props.positions[0][0] === 'number') {
			// This is a single column of positions. Wrap it
			// in an array to conform to the standard
			// multi-column structure.
			
			this.positions = [props.positions];
		}
		else {
			this.positions = props.positions;
		}
		
		this.x = (props.x !== undefined ? props.x : 0);
		
		if (props.y !== undefined && props.y[0] !== undefined) {
			this.y = props.y;
		}
		else {
			this.y = new Array(this.positions.length);
			
			for (i = this.positions.length - 1; i >= 0; --i) {
				for (j = 0; this.positions[i][j] === null; ++j);
				
				this.y[i] = j;
			}
			
			if (props.y !== undefined) {
				this.y[this.x] = props.y;
			}
		}
		
		this.eventHandler = (props.eventHandler !== undefined ? props.eventHandler : QuestForge.current.game.currentEngine);
		this.spriteX = (props.spriteX !== undefined ? props.spriteX : 0);
		this.spriteY = (props.spriteY !== undefined ? props.spriteY : 0);
	},
	
	init: function (props) {
		this.prepare(props);
		QuestForge.current.game.currentEngine = this;
	},
	
	initPrecise: function (props, positions) {
		this.preparePrecise(props, positions);
		QuestForge.current.game.currentEngine = this;
	},
	
	//== Tick function ==//
	
	tick: function () {
		var pos,
		    input, view;
		
		input = QuestForge.current.input;
		view = QuestForge.current.view;
		pos = this.positions[this.x][this.y[this.x]];
		
		if (this.eventHandler.cursorTick !== undefined) {
			this.eventHandler.cursorTick(this.x, this.y[this.x]);
		}
		
		if (input.progressiveUp === true) {
			this.moveUp();
		}
		else if (input.progressiveDown === true) {
			this.moveDown();
		}
		else if (input.progressiveLeft === true) {
			this.moveLeft();
		}
		else if (input.progressiveRight === true) {
			this.moveRight();
		}
		else if (input.throttledAction === true) {
			if (this.eventHandler.cursorAction !== undefined) {
				this.eventHandler.cursorAction(this.x, this.y[this.x]);
			}
		}
		else if (input.throttledCancel === true) {
			if (this.eventHandler.cursorCancel !== undefined) {
				this.eventHandler.cursorCancel(this.x, this.y[this.x]);
			}
		}
		
		if (QuestForge.current.game.currentEngine === this) {
			view.drawSprite(view.tilesets.effects, this.spriteX, this.spriteY, 2 * view.conf.tileWidth, 2 * view.conf.tileHeight, pos[0] - 2 * view.conf.tileWidth, pos[1], 255);
		}
	},
	
	//== Basic movement ==//
	
	moveDown: function () {
		var len, y;
		
		len = this.positions[this.x].length;
		y = this.y[this.x];
		
		do {
			++y;
		} while (y < len && this.positions[this.x][y] === null);
		
		if (y < len) {
			this.y[this.x] = y;
			QuestForge.current.soundEngine.play('sfx-cursor');
			
			if (this.eventHandler.cursorMove !== undefined) {
				this.eventHandler.cursorMove(this.x, this.y[this.x]);
			}
		}
		else if (this.eventHandler.cursorThudDown !== undefined) {
			this.eventHandler.cursorThudDown(this.x);
		}
	},
	
	moveLeft: function () {
		if (this.x > 0) {
			--this.x;
			QuestForge.current.soundEngine.play('sfx-cursor');
			
			if (this.eventHandler.cursorChangeCol !== undefined) {
				if (this.eventHandler.cursorChangeCol(this.x + 1, this.x) === false) {
					return;
				}
			}
			
			if (this.eventHandler.cursorMove !== undefined) {
				this.eventHandler.cursorMove(this.x, this.y[this.x]);
			}
		}
		else if (this.eventHandler.cursorThudLeft !== undefined) {
			this.eventHandler.cursorThudLeft(this.y[this.x]);
		}
	},
	
	moveRight: function () {
		if (this.x < this.positions.length - 1) {
			++this.x;
			QuestForge.current.soundEngine.play('sfx-cursor');
			
			if (this.eventHandler.cursorChangeCol !== undefined) {
				if (this.eventHandler.cursorChangeCol(this.x - 1, this.x) === false) {
					return;
				}
				
				if (this.eventHandler.cursorMove !== undefined) {
					this.eventHandler.cursorMove(this.x, this.y[this.x]);
				}
			}
		}
		else if (this.eventHandler.cursorThudRight !== undefined) {
			this.eventHandler.cursorThudRight(this.y[this.x]);
		}
	},
	
	moveUp: function () {
		var y;
		
		y = this.y[this.x];
		
		do {
			--y;
		} while (y >= 0 && this.positions[this.x][y] === null);
		
		if (y >= 0) {
			this.y[this.x] = y;
			QuestForge.current.soundEngine.play('sfx-cursor');
			
			if (this.eventHandler.cursorMove !== undefined) {
				this.eventHandler.cursorMove(this.x, this.y[this.x]);
			}
		}
		else if (this.eventHandler.cursorThudUp !== undefined) {
			this.eventHandler.cursorThudUp(this.x);
		}
	},
	
	//== Special movement ==//
	
	moveToFirst: function () {
		var len, y;
		
		len = this.positions[this.x].length;
		
		y = 0;
		
		while (y < len && this.positions[this.x][y] === null) {
			++y;
		}
		
		if (y < len && this.y[this.x] !== y) {
			this.y[this.x] = y;
			QuestForge.current.soundEngine.play('sfx-cursor');
			
			if (this.eventHandler.cursorMove !== undefined) {
				this.eventHandler.cursorMove(this.x, this.y[this.x]);
			}
		}
	},
	
	moveToLast: function () {
		var y;
		
		y = this.positions[this.x].length - 1;
		
		while (y >= 0 && this.positions[this.x][y] === null) {
			--y;
		}
		
		if (y >= 0 && this.y[this.x] !== y) {
			this.y[this.x] = y;
			QuestForge.current.soundEngine.play('sfx-cursor');
			
			if (this.eventHandler.cursorMove !== undefined) {
				this.eventHandler.cursorMove(this.x, this.y[this.x]);
			}
		}
	},
};
