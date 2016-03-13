"use strict";

QuestForge.prototype.LineupSlot = function (props) {
	QuestForge.applyProperties(props, this);
};

QuestForge.prototype.LineupSlot.prototype = {
	id: null,
	
	lineup: null,
	character: null,
	position: 0,
	row: 1,
	
	// Battle variables.
	
	side: 0,
	isPortrait: false,
	arenaBaseX: 0,
	arenaBaseY: 0,
	arenaX: 0,
	arenaY: 0,
	stance: null,

	turnProgress: 0,
	pendingAction: null,
	
	//== Functions ==//
	
	isSelectable: function () {
		if (this.character === null) {
			return false;
		}
		
		if (this.character.hp === 0) {
			return false;
		}
		
		return true;
	},
	
	getInitArenaX: function () {
		var x,
		    view;
		
		view = QuestForge.current.view;
		
		if (this.isPortrait === true) {
			return this.arenaBaseX * view.conf.tileWidth;
		}
		
		x = 0;
		
		// Adjust x for the row.
		
		x -= this.row * QuestForge.current.battleEngine.conf.avatarWidth * view.conf.tileWidth;
		
		if (QuestForge.current.game.settings.battleUseLineupPerspective === true) {
			// Adjust slightly for perspective.
			
			x -= (this.lineup.length - this.position) * 4;
		}
		
		// Add base tile position.
		
		if (this.side === 0) {
			x += this.arenaBaseX * view.conf.tileWidth;
		}
		else {
			x = (this.arenaBaseX * view.conf.tileWidth) - x;
		}
		
		return x;
	},
	
	getInitArenaY: function () {
		var y;
		
		if (this.isPortrait === true) {
			return this.arenaBaseY * QuestForge.current.view.conf.tileHeight;
		}
		
		y = 0;
		
		// Add base tile position.
		
		y += this.arenaBaseY * QuestForge.current.view.conf.tileHeight;
		
		return y;
	},
	
	getCenterX: function () {
		if (this.character === null) {
			return this.arenaX;
		}
		
		if (this.isPortrait === true) {
			return this.arenaX + ((this.character.portraitWidth * QuestForge.current.view.conf.tileWidth) >>> 1);
		}
		else {
			return this.arenaX + ((QuestForge.current.battleEngine.conf.avatarWidth * QuestForge.current.view.conf.tileWidth) >>> 1);
		}
	},
	
	getCenterY: function () {
		if (this.character === null) {
			return this.arenaY;
		}
		
		if (this.isPortrait === true) {
			return this.arenaY + ((this.character.portraitHeight * QuestForge.current.view.conf.tileHeight) >>> 1);
		}
		else {
			return this.arenaY + ((QuestForge.current.battleEngine.conf.avatarHeight * QuestForge.current.view.conf.tileWidth) >>> 1);
		}
	},
	
	getTileWidth: function () {
		if (this.character === null) {
			return 0;
		}
		
		if (this.isPortrait === true) {
			return this.character.portraitWidth;
		}
		else {
			return QuestForge.current.battleEngine.conf.avatarWidth;
		}
	},
	
	getPixelWidth: function () {
		return this.getTileWidth() * QuestForge.current.view.conf.tileWidth;
	},
	
	getTileHeight: function () {
		if (this.character === null) {
			return 0;
		}
		
		if (this.isPortrait === true) {
			return this.character.portraitHeight;
		}
		else {
			return QuestForge.current.battleEngine.conf.avatarHeight;
		}
	},
	
	getPixelHeight: function () {
		return this.getTileHeight() * QuestForge.current.view.conf.tileHeight;
	},
};
