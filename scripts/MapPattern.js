"use strict";

QuestForge.prototype.MapPattern = function (props) {
	QuestForge.applyProperties(props, this);
};

QuestForge.prototype.MapPattern.prototype = {
	id: null,
	map: null,
	isSprite: false,
	
	editorInfo: null,
	
	//== Standard tiles ==//
	
	tileX: 0,
	tileY: 0,
	steppedOnTileX: null,
	steppedOnTileY: null,
	spriteOffset: -2,
	spriteHeight: 16,
	terrainLevel: 50,
	speedDenominator: 1,
	battleRate: 1,
	openTileX: null,
	openTileY: null,
	treasure: null,
	treasureAmount: null,
	
	// biome: Determines the battle background and potentially the
	// kinds of battles encountered.
	
	biome: 0,
	
	// lowerTilePatternId: If a sprite is unable to walk onto this
	// tile due to its terrain level, it will instead look at the
	// MapPattern identified by the lowerTilePatternId and try again
	// with its terrain level. 
	//
	// When a sprite walks onto a tile using its lower terrain
	// level, the sprite will be obscured by the tile in the same
	// way dialog boxes obscure sprites. It will also use the lower
	// tile when determining how the sprite should be displayed (for
	// example: overlays, spriteOffset, spriteHeight).
	//
	// Note: Two sprites may occupy the same tile if one is using
	// the tile's own terrain level and the other is using the lower
	// terrain level. Such sprites will typically not interact.
	
	lowerTilePatternId: null,
	
	// overlays: One or more flags determining how much the tile
	// obscures the sprite. You may combine these flags by adding
	// their values together.
	//
	// A selective overlay means that part of the sprite can only be
	// seen through the tile's transparent pixels (the pixels where
	// the global background color would normally show through).
	//
	// A full overlay means that part of the sprite is completely
	// covered, so it isn't drawn at all. 
	//
	// 0 = No overlay (default).
	// 1 = Selectively overlay the top half of the sprite.
	// 2 = Selectively overlay the bottom half of the sprite.
	// 4 = Fully overlay the top half of the sprite.
	// 8 = Fully overlay the bottom half of the sprite.
	
	overlays: 0,
	
	// blocksNpcs: Affects NPC random wandering.
	//
	// true = NPCs will never randomly wander onto the tile.
	// false = NPCs may wander onto the tile, regardless of terrain level.
	// null = NPCs adhere to terrain level and vehicle switching rules.
	
	blocksNpcs: null,
	
	//== Sprite properties ==//
	
	template: null,
	tileset: null,
	x: 0,
	y: 0,
	z: 5,
	offsetX: 0,
	offsetY: 0,
	floorLevel: 50,
	
	speed: 1,
	currentVehicle: null,
	facing: 1,
	animationStage: 0,
	
	restLength: 32,
	rest: 0,
	hurry: 1,
	message: '',
	
	//== Events ==//
	
	onaction: null, // Player hit the action key while facing this.
	onpressure: null, // Something finished stepping onto this.
	onpressurestart: null, // Something began stepping onto this.
	onstep: null, // This finished taking a step.
	onstepstart: null, // This began taking a step.
	ontilerender: null, // This has just been painted to the viewport grid.
	ontouch: null, // Player attempted to step onto this and was blocked.
	
	//== Functions ==//
	
	getSpeed: function () {
		return this.speed * this.hurry * this.currentVehicle.speed / this.getUnderTile().speedDenominator;
	},
	
	getUnderTile: function () {
		return QuestForge.current.mapEngine.getTilePatternAt(this.x, this.y);
	},
	
	giveTreasure: function (x, y) {
		var amount, flagName, remainder;
		
		flagName = "treasure:"+this.map.id+"."+this.id;
		
		if (QuestForge.current.game.flags[flagName] === true) {
			QuestForge.current.dialogEngine.dialog('Empty!');
		}
		else {
			if (this.treasure === null && (this.treasureAmount === null || this.treasureAmount === 0)) {
				QuestForge.current.dialogEngine.dialog('Empty!');
			}
			else if (this.treasure !== null) {
				// Item.
				
				amount = this.treasureAmount !== null ? this.treasureAmount : 1;
				remainder = QuestForge.current.game.currentParty.items.add(this.treasure, amount);
				
				if (remainder === 0) {
					QuestForge.current.dialogEngine.dialogRaw('Found '+this.treasure.name+(this.treasureAmount > 1 ? ' x'+this.treasureAmount : '')+'!');
				}
				else {
					// Can't fit the items into the inventory. Remove the
					// items we just added and keep the chest unopened.
					
					QuestForge.current.game.currentParty.items.remove(this.treasure, amount - remainder);
					QuestForge.current.dialogEngine.dialog('Can\'t carry more items!');
					return;
				}
			}
			else {
				// Gold.
				
				QuestForge.current.game.currentParty.giveGold(this.treasureAmount);
				QuestForge.current.dialogEngine.dialogRaw('Found '+this.treasureAmount+' gold!');
			}
			
			QuestForge.current.game.flags[flagName] = true;
			
			if (this.openTileX !== null || this.openTileY !== null) {
				QuestForge.current.soundEngine.play('sfx-open');
				QuestForge.current.mapEngine.drawTile(this.openTileX === null ? this.tileX : this.openTileX, this.openTileY === null ? this.tileY : this.openTileY, x, y);
			}
		}
	},
	
	moveUp: function () {
		if (this.y === 0) {
			this.y = QuestForge.current.mapEngine.map.height - 1;
		}
		else {
			--this.y;
		}
		
		this.offsetY = 2 * QuestForge.current.view.conf.tileHeight;
		this.facing = 0;
		
		if (this.onstepstart !== null) {
			this.onstepstart();
		}
	},
	
	moveDown: function () {
		if (this.y === QuestForge.current.mapEngine.map.height - 1) {
			this.y = 0;
		}
		else {
			++this.y;
		}
		
		this.offsetY = -2 * QuestForge.current.view.conf.tileHeight;
		this.facing = 1;
		
		if (this.onstepstart !== null) {
			this.onstepstart();
		}
	},
	
	moveLeft: function () {
		if (this.x === 0) {
			this.x = QuestForge.current.mapEngine.map.width - 1;
		}
		else {
			--this.x;
		}
		
		this.offsetX = 2 * QuestForge.current.view.conf.tileWidth;
		this.facing = 2;
		
		if (this.onstepstart !== null) {
			this.onstepstart();
		}
	},
	
	moveRight: function () {
		if (this.x === QuestForge.current.mapEngine.map.width - 1) {
			this.x = 0;
		}
		else {
			++this.x;
		}
		
		this.offsetX = -2 * QuestForge.current.view.conf.tileWidth;
		this.facing = 3;
		
		if (this.onstepstart !== null) {
			this.onstepstart();
		}
	},
	
	movingTick: function () {
		if (this.offsetX !== 0 || this.offsetY !== 0) {
			if (this.offsetX < 0) {
				this.offsetX += this.getSpeed();
				this.facing = 3;
			}
			else if (this.offsetX > 0) {
				this.offsetX -= this.getSpeed();
				this.facing = 2;
			}
			
			if (this.offsetY < 0) {
				this.offsetY += this.getSpeed();
				this.facing = 1;
			}
			else if (this.offsetY > 0) {
				this.offsetY -= this.getSpeed();
				this.facing = 0;
			}
			
			if (this.offsetX === 0 && this.offsetY === 0) {
				// Just landed on a tile.
				
				this.animationStage = 0;
				this.hurry = 1;
				
				if (this.onstep !== null) {
					this.onstep();
				}
			}
			else {
				this.animationStage = Math.abs(this.offsetX + this.offsetY) > 8 ? 0 : 1;
			}
		}
	},
	
	open: function (x, y) {
		if (this.openTileX !== null || this.openTileY !== null) {
			QuestForge.current.mapEngine.drawTile(this.openTileX === null ? this.tileX : this.openTileX, this.openTileY === null ? this.tileY : this.openTileY, x, y);
		}
	},
	
	prepareForNpc: function (x, y) {
		var feature;
		
		feature = QuestForge.current.mapEngine.getFeatureAt(x, y, this);
		
		return (feature.blocksNpcs === false || (feature.blocksNpcs === null && this.prepareVehicleFor(feature) === true));
	},
	
	prepareVehicleFor: function (dest) {
		var autoSwitchVehicles, i, lowerTile, newVehicle, vehicles;
		
		vehicles = QuestForge.current.mapEngine.vehicles;
		
		if (dest.terrainLevel >= this.currentVehicle.minTerrainLevel && dest.terrainLevel <= this.currentVehicle.maxTerrainLevel) {
			if (Math.abs(dest.terrainLevel - this.floorLevel) <= this.currentVehicle.terrainStep) {
				this.floorLevel = dest.terrainLevel;
				return true;
			}
		}
		
		if (dest.lowerTilePatternId !== null) {
			lowerTile = QuestForge.current.mapEngine.map.tilePatterns[dest.lowerTilePatternId];
			
			if (lowerTile.terrainLevel >= this.currentVehicle.minTerrainLevel && lowerTile.terrainLevel <= this.currentVehicle.maxTerrainLevel) {
				if (Math.abs(lowerTile.terrainLevel - this.floorLevel) <= this.currentVehicle.terrainStep) {
					this.floorLevel = lowerTile.terrainLevel;
					return true;
				}
			}
		}
		
		autoSwitchVehicles = this.currentVehicle.autoSwitchVehicles;
		
		for (i = 0; i < autoSwitchVehicles.length; ++i) {
			newVehicle = autoSwitchVehicles[i];
			
			if (dest.terrainLevel >= newVehicle.minTerrainLevel && dest.terrainLevel <= newVehicle.maxTerrainLevel) {
				this.currentVehicle = newVehicle;
				this.floorLevel = dest.terrainLevel;
				
				return true;
			}
		}
		
		return false;
	},
	
	say: function (message) {
		var player;
		
		if (this.offsetX === 0 && this.offsetY === 0) {
			this.hurry = 1;
		}
		
		player = QuestForge.current.mapEngine.player;
		
		// Face the opposite direction the player is facing.
		this.facing = player.facing ^ 1;
		
		QuestForge.current.dialogEngine.dialog(message);
	},
	
	teleport: function (mapId, x, y, facing) {
		var mapEngine;
		
		mapEngine = QuestForge.current.mapEngine;
		
		mapEngine.teleport(QuestForge.current.game.maps[mapId], x, y);
		mapEngine.transitionFacing = (facing === undefined ? 1 : facing);
		mapEngine.transitionType = 3;
	},
	
	exit: function (mapId, x, y, facing) {
		var mapEngine;
		
		mapEngine = QuestForge.current.mapEngine;
		
		if (mapId === undefined) {
			mapEngine.exit();
		}
		else {
			mapEngine.exit(QuestForge.current.game.maps[mapId], x, y);
		}
		
		mapEngine.transitionFacing = (facing === undefined ? 1 : facing);
		mapEngine.transitionType = 3;
	},
};

//== Static (event templates) ==//

QuestForge.prototype.MapPattern.npcActionHandler = function () {
	this.say(this.message);
};

QuestForge.prototype.MapPattern.npcTick = function () {
	var direction, i, moved;
	
	moved = false;
	
	if (this.offsetX === 0 && this.offsetY === 0) {
		if (this.rest > 0) {
			--this.rest;
		}
		else {
			this.rest = this.restLength;
			direction = Math.floor(Math.random() * 4);
			i = 0;
			
			do {
				switch (direction) {
				case 0: // Up
					if (this.prepareForNpc(this.x, this.y - 1) === true) {
						this.moveUp();
						moved = true;
					}
					else if (this.hurry === 0) {
						this.facing = 0;
						this.rest = 0;
					}
					break;
				
				case 1: // Down
					if (this.prepareForNpc(this.x, this.y + 1) === true) {
						this.moveDown();
						moved = true;
					}
					else if (this.hurry === 0) {
						this.facing = 1;
						this.rest = 0;
					}
					break;
				
				case 2: // Left
					if (this.prepareForNpc(this.x - 1, this.y) === true) {
						this.moveLeft();
						moved = true;
					}
					else if (this.hurry === 0) {
						this.facing = 2;
						this.rest = 0;
					}
					break;
				
				case 3: // Right
					if (this.prepareForNpc(this.x + 1, this.y) === true) {
						this.moveRight();
						moved = true;
					}
					else if (this.hurry === 0) {
						this.facing = 3;
						this.rest = 0;
					}
					break;
				}
				
				if (this.hurry !== 0 && moved === false) {
					direction = (direction + 1) % 4;
					++i;
				}
			} while (moved === false && i > 0 && i < 4);
		}
	}
	
	this.movingTick();
};

QuestForge.prototype.MapPattern.npcTouchHandler = function () {
	if (this.offsetX === 0 && this.offsetY === 0) {
		this.hurry = 2;
	}
};

QuestForge.prototype.MapPattern.playerStepstartHandler = function () {
	var underTile;
	
	underTile = this.getUnderTile();
	
	if (underTile.onpressurestart !== null) {
		underTile.onpressurestart(this.x, this.y, this);
	}
};

QuestForge.prototype.MapPattern.playerStepHandler = function () {
	var underTile;
	
	underTile = this.getUnderTile();
	
	if (underTile.onpressure !== null) {
		underTile.onpressure(this.x, this.y, this);
	}
	else {
		QuestForge.current.mapEngine.decBattleSteps(underTile.battleRate);
	}
};

QuestForge.prototype.MapPattern.playerTick = function () {
	var feature, destX, destY, moved,
	    input, mapEngine;
	
	input = QuestForge.current.input;
	mapEngine = QuestForge.current.mapEngine;
	
	moved = false;
	
	// Handle input.
	
	if (this.offsetX === 0 && this.offsetY === 0) {
		if (input.run === true) {
			this.speed = 4;
		}
		else {
			this.speed = 2;
		}
		
		if (input.right === true) {
			feature = mapEngine.getFeatureAt(this.x + 1, this.y, this);
			
			if (this.prepareVehicleFor(feature) === true) {
				this.moveRight();
				mapEngine.scrollRight();
				moved = true;
			}
			else {
				this.facing = 3;
				
				if (feature.ontouch !== null) {
					feature.ontouch(this.x + 1, this.y);
				}
			}
		}
		
		if (moved === false && input.left === true) {
			feature = mapEngine.getFeatureAt(this.x - 1, this.y, this);
			
			if (this.prepareVehicleFor(feature) === true) {
				this.moveLeft();
				mapEngine.scrollLeft();
				moved = true;
			}
			else {
				this.facing = 2;
				
				if (feature.ontouch !== null) {
					feature.ontouch(this.x - 1, this.y);
				}
			}
		}
		
		if (moved === false && input.down === true) {
			feature = mapEngine.getFeatureAt(this.x, this.y + 1, this);
			
			if (this.prepareVehicleFor(feature) === true) {
				this.moveDown();
				mapEngine.scrollDown();
				moved = true;
			}
			else {
				this.facing = 1;
				
				if (feature.ontouch !== null) {
					feature.ontouch(this.x, this.y + 1);
				}
			}
		}
		
		if (moved === false && input.up === true) {
			feature = mapEngine.getFeatureAt(this.x, this.y - 1, this);
			
			if (this.prepareVehicleFor(feature) === true) {
				this.moveUp();
				mapEngine.scrollUp();
				moved = true;
			}
			else {
				this.facing = 0;
				
				if (feature.ontouch !== null) {
					feature.ontouch(this.x, this.y - 1);
				}
			}
		}
		
		if (input.action === true) {
			destX = this.x + (this.facing >= 2 ? (this.facing & 1) * 2 - 1 : 0);
			destY = this.y + (this.facing < 2 ? this.facing * 2 - 1 : 0);
			feature = mapEngine.getFeatureAt(destX, destY, this);
			
			if (feature.onaction !== null) {
				feature.onaction(destX, destY);
			}
			else {
				feature = mapEngine.getSpriteMovingFrom(destX, destY, this);
				
				if (feature !== null && feature.onaction !== null) {
					feature.onaction(destX, destY);
				}
			}
		}
		
		if (input.menu === true) {
			QuestForge.current.game.currentEngine = QuestForge.current.mainMenuEngine;
		}
	}
	
	this.movingTick();
};

QuestForge.prototype.MapPattern.openTile = function (x, y) {
	QuestForge.current.soundEngine.play('sfx-open');
	this.open(x, y);
};

QuestForge.prototype.MapPattern.treasureAction = function (x, y) {
	this.giveTreasure(x, y);
};

QuestForge.prototype.MapPattern.treasureTilerender = function (x, y) {
	if (QuestForge.current.game.flags["treasure:"+this.map.id+"."+this.id] === true && (this.openTileX !== null || this.openTileY !== null)) {
		QuestForge.current.mapEngine.drawTile(this.openTileX === null ? this.tileX : this.openTileX, this.openTileY === null ? this.tileY : this.openTileY, x, y);
	}
};
