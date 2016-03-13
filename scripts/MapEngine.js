"use strict";

QuestForge.prototype.MapEngine = function (props) {
	this.conf = {
		allowLeaderRotation: false
	};
	
	QuestForge.applyProperties(props, this.conf);
	
	this.vehicles = {};
	this.sprites = [];
	this.warps = [];
	
	this.player = new QuestForge.current.MapPattern({
		isSprite: true,
		tileset: QuestForge.current.view.tilesets.mapChars,
		tileX: 0,
		tileY: 0,
		terrainLevel: 70,
		tick: QuestForge.current.MapPattern.playerTick,
		onstepstart: QuestForge.current.MapPattern.playerStepstartHandler,
		onstep: QuestForge.current.MapPattern.playerStepHandler,
	});
};

QuestForge.registerEngine('MapEngine', ['View']);

QuestForge.prototype.MapEngine.prototype = {
	conf: null,
	
	warps: null,
	map: null,
	prevMap: null,
	
	transitionType: 0,
	transitionFrame: 0,
	transitionFacing: 1,
	
	scrollX: 0,
	scrollY: 0,
	
	playerFacing: 0,
	playerAnimation: 0,
	
	vehicles: null,
	
	battleSteps: 0,
	
	sprites: null,
	tiles: null,
	
	player: null,
	
	//== Functions ==//
	
	canSave: function () {
		// STUB!
		return false;
	},
	
	decBattleSteps: function (battleRate) {
		this.battleSteps -= battleRate;
		
		if (this.battleSteps <= 0) {
			// Random battle!
			
			this.transitionType = 4;
			this.resetBattleSteps();
		}
	},
	
	dialogTick: function (dialogState, newHeight) {
		var dialogEngine, view;
		
		dialogEngine = QuestForge.current.dialogEngine;
		view = QuestForge.current.view;
		
		// Draw the sprites.
		
		this.drawSprites([{
			x1: dialogEngine.x * view.conf.tileWidth,
			y1: dialogEngine.y * view.conf.tileHeight,
			x2: (dialogEngine.x + dialogEngine.width) * view.conf.tileWidth,
			y2: (dialogEngine.y + newHeight) * view.conf.tileHeight,
		}]);
	},
	
	drawTile: function (tileX, tileY, x, y) {
		var tileset, view;
		
		// Note: the effects of this function only last as long
		// as the drawn tile is still in view. This is for
		// temporary visual effects like opening a door as you
		// go through it.
		
		view = QuestForge.current.view;
		tileset = this.map.tileset;
		x -= this.scrollX;
		y -= this.scrollY;
		
		if (x < 0) {
			x += this.map.width;
		}
		
		if (y < 0) {
			y += this.map.height;
		}
		
		tileX *= 2;
		tileY *= 2;
		x *= 2;
		y *= 2;
		
		view.drawTile(tileset, tileX, tileY, x, y);
		view.drawTile(tileset, tileX + 1, tileY, x + 1, y);
		view.drawTile(tileset, tileX, tileY + 1, x, y + 1);
		view.drawTile(tileset, tileX + 1, tileY + 1, x + 1, y + 1);
	},
	
	drawSprite: function (sprite, exceptions) {
		var i, x, y, exception, underTile, offsetX, offsetY,
		    tileX, tileY, width, height, view,
		    isUnder, x1, y1, x2, y2, deltaX, deltaY, fromTile;
		
		view = QuestForge.current.view;
		underTile = sprite.getUnderTile();
		
		if (exceptions === undefined) {
			exceptions = [];
		}
		else {
			// Clone the exceptions array so we can safely
			// modify it for this sprite.
			
			exceptions = exceptions.slice(0);
		}
		
		if (underTile.lowerTilePatternId !== null && underTile.terrainLevel !== sprite.floorLevel) {
			// The character is under an overpass (e.g., a bridge).
			
			underTile = this.map.tilePatterns[underTile.lowerTilePatternId];
			isUnder = true;
		}
		else {
			isUnder = false;
		}
		
		// Determine viewport coordinates, accounting for map wrapping.
		
		x = sprite.x - this.scrollX;
		y = sprite.y - this.scrollY;
		
		if (x < 0) {
			x += this.map.width;
		}
		
		if (y < 0) {
			y += this.map.height;
		}
		
		// Determine any sub-tile offset.
		
		offsetX = sprite.offsetX;
		offsetY = sprite.offsetY + underTile.spriteOffset + ((sprite.facing & 2) ? sprite.animationStage * sprite.currentVehicle.bob : 0);
		
		// Get the reference tile.
		
		if (sprite.currentVehicle.overrideSprite) {
			tileX = sprite.currentVehicle.tileX;
			tileY = sprite.currentVehicle.tileY;
		}
		else {
			tileX = sprite.tileX;
			tileY = sprite.tileY;
		}
		
		// Determine the tile for the direction and animation frame, and double the coordinates to get the "real" tile coordinates.
		
		tileX = 2 * (tileX + sprite.facing * 2 + sprite.animationStage);
		tileY = 2 * tileY;
		
		// Adjust the viewport coordinates for any scrolling or offset.
		
		x = x * view.conf.tileWidth * 2 + view.offsetX + offsetX;
		y = y * view.conf.tileHeight * 2 + view.offsetY + offsetY;
		
		// Handle destination overpass obscurity (e.g., walking under a bridge).
		
		if (isUnder) {
			exceptions.push({
				x1: x - offsetX,
				y1: y - offsetY,
				x2: x - offsetX + view.conf.tileWidth * 2,
				y2: y - offsetY + view.conf.tileHeight * 2,
			});
		}
		
		// Handle source overpass obscurity (e.g., emerging from under a bridge).
		
		if (sprite.offsetX !== 0 || sprite.offsetY !== 0) {
			if (sprite.offsetX === 0) {
				deltaX = 0;
			}
			else if (sprite.offsetX < 0) {
				deltaX = -1;
			}
			else {
				deltaX = 1;
			}
			
			if (sprite.offsetY === 0) {
				deltaY = 0;
			}
			else if (sprite.offsetY < 0) {
				deltaY = -1;
			}
			else {
				deltaY = 1;
			}
			
			fromTile = this.getTilePatternAt(sprite.x + deltaX, sprite.y + deltaY);
			
			if (fromTile.lowerTilePatternId !== null && Math.abs(fromTile.terrainLevel - sprite.floorLevel) > sprite.currentVehicle.terrainStep) {
				deltaX *= view.conf.tileWidth * 2;
				deltaY *= view.conf.tileHeight * 2;
				
				exceptions.push({
					x1: x - offsetX + deltaX,
					y1: y - offsetY + deltaY,
					x2: x - offsetX + view.conf.tileWidth * 2 + deltaX,
					y2: y - offsetY + view.conf.tileHeight * 2 + deltaY,
				});
			}
		}
		
		// Determine the dimensions of the drawn sprite.
		
		width = view.conf.tileWidth * 2;
		height = underTile.spriteHeight;
		
		if ((underTile.overlays & 4) !== 0) {
			// Tile fully overlays the top half of the sprite.
			
			height -= view.conf.tileHeight;
			y += view.conf.tileHeight;
		}
		
		if ((underTile.overlays & 8) !== 0) {
			// Tile fully overlays the bottom half of the sprite.
			
			height -= view.conf.tileHeight;
		}
		
		// Consider the display exception regions, if present.
		//
		// In order to adhere to the graphical limitations of
		// the NES, we will treat the sprite as if it were four
		// smaller sprites, each being one view tile in size.
		// Each of those mini-sprites will either be displayed
		// in full or not at all.
		
		for (i = 0; i < exceptions.length; ++i) {
			exception = exceptions[i];
			x1 = x + (view.conf.tileWidth >>> 1);
			y1 = y + (view.conf.tileHeight >>> 1);
			x2 = x + width - (view.conf.tileWidth >>> 1) - 1;
			y2 = y + height - (view.conf.tileHeight >>> 1) - 1;
			
			if (x1 >= exception.x1 && x2 < exception.x2 && y1 >= exception.y1 && y2 < exception.y2) {
				// Sprite is fully within the exception region. Don't draw anything.
				
				return;
			}
			else if (x1 >= exception.x1 && x2 < exception.x2 && y1 < exception.y1 && y2 >= exception.y1) {
				// Sprite overlaps the top edge of the region.
				
				height -= view.conf.tileHeight;
			}
			else if (x1 < exception.x1 && x2 >= exception.x1 && y1 >= exception.y1 && y2 < exception.y2) {
				// Sprite overlaps the left edge of the region.
				
				width -= view.conf.tileWidth;
			}
			else if (x1 < exception.x2 && x2 >= exception.x2 && y1 >= exception.y1 && y2 < exception.y2) {
				// Sprite overlaps the right edge of the region.
				
				++tileX;
				width -= view.conf.tileWidth;
				x += view.conf.tileWidth;
			}
			else if (x1 >= exception.x1 && x2 < exception.x2 && y1 < exception.y2 && y2 >= exception.y2) {
				// Sprite overlaps the bottom edge of the region.
				
				++tileY;
				height -= view.conf.tileHeight;
				y += view.conf.tileHeight;
			}
		}
		
		if (height > 0) {
			// We will draw the sprite in two halves (one
			// above the other), so that the overlay property
			// can be applied to the two halves independently.
			
			// Draw the top of the sprite.
			
			view.drawSprite(sprite.tileset, tileX, tileY, width, height <= view.conf.tileHeight ? height : view.conf.tileHeight, x, y, sprite.z * ((underTile.overlays & 1) === 0 ? 1 : -1));
			
			// Draw the bottom of the sprite.
			
			if (height > view.conf.tileHeight) {
				view.drawSprite(sprite.tileset, tileX, tileY + 1, width, height - view.conf.tileHeight, x, y + view.conf.tileHeight, sprite.z * ((underTile.overlays & 2) === 0 ? 1 : -1));
			}
		}
	},
	
	drawSprites: function (exceptions) {
		var i;
		
		for (i = this.sprites.length - 1; i >= 0; --i) {
			this.drawSprite(this.sprites[i], exceptions);
		}
	},
	
	loadMap: function (map, x, y) {
		var i, j, patternId, sprite,
		    view;
		
		view = QuestForge.current.view;
		
		this.prevMap = this.map;
		this.map = map;
		
		this.resetBattleSteps();
		
		this.player.x = x;
		this.player.y = y;
		this.player.currentVehicle = QuestForge.current.game.vehicles[0];
		
		this.sprites = [this.player];
		this.tiles = [];
		
		// Generate copies of the map sprites.
		
		for (i = 0; i < map.sprites.length; ++i) {
			sprite = new QuestForge.current.MapPattern(map.sprites[i]);
			sprite.id = i + 1;
			this.sprites.push(sprite);
		}
		
		// Decode and copy map tiles.
		
		for (i = 1; i < map.tilesEncoded.length; i += 2) {
			patternId = map.tilesEncoded[i];
			
			for (j = map.tilesEncoded[i - 1]; j > 0; --j) {
				this.tiles.push(patternId);
			}
		}
		
		this.scrollX = this.player.x - ((view.conf.width - 4) >>> 2);
		
		if (this.scrollX < 0) {
			this.scrollX += map.width;
		}
		
		this.scrollY = this.player.y - ((view.conf.height - 4) >>> 2) - 1;
		
		if (this.scrollY < 0) {
			this.scrollY += map.height;
		}
	},
	
	reload: function () {
		this.loadMap(this.map);
		QuestForge.current.game.currentEngine = this;
	},
	
	teleport: function (map, x, y) {
		var i, warp;
		
		// Look for an existing warp at the same location.
		
		for (i = 0; i < this.warps.length; ++i) {
			warp = this.warps[i];
			
			if (warp.map.id === map.id && (i === 0 || (warp.x === x && warp.y === y))) {
				// Return to this warp instead of adding a new one.
				
				this.warps.splice(i + 1, this.warps.length);
				this.warp();
				return;
			}
		}
		
		if (this.map !== null) {
			this.warps.push(new QuestForge.current.Warp({
				map: this.map,
				x: this.player.x,
				y: this.player.y,
				vehicle: this.player.currentVehicle,
			}));
		}
		
		this.loadMap(map, x, y);
	},
	
	warp: function (warpIndex) {
		var warp;
		
		if (this.warps.length === 0)
		{
			// No warps in the stack. We're already where we should be.
			
			return false;
		}
		
		// Normalize argument.
		
		if (warpIndex === undefined) {
			warpIndex = -1;
		}
		
		if (warpIndex < 0) {
			warpIndex = this.warps.length + warpIndex;
			
			if (warpIndex < 0) {
				warpIndex = 0;
			}
		}
		
		// Remove any warps in front of the target.
		
		if (warpIndex < this.warps.length - 1) {
			this.warps.splice(warpIndex + 1, this.warps.length);
		}
		
		// Remove and load the warp.
		
		warp = this.warps.pop();
		this.loadMap(warp.map, warp.x, warp.y);
		this.player.currentVehicle = warp.vehicle;
		
		return true;
	},
	
	exit: function (map, x, y) {
		if (map === undefined) {
			// Exiting to the bottom of the warp stack.
			
			return this.warp(0);
		}
		
		// Exiting to a particular map and location.
		
		this.warps.splice(0, this.warps.length);
		this.loadMap(map, x, y);
		return true;
	},
	
	repaint: function (x, y, width, height) {
		var yi, xi, tileset, x2, y2, mapIndexRef, mapIndexRefWrap,
		    mapIndexOffset, mapIndex, pattern, tileX, tileY,
		    view;
		
		view = QuestForge.current.view;
		
		if (x < 0) {
			x = 0;
		}
		
		if (y < 0) {
			y = 0;
		}
		
		if (x + width > view.conf.width) {
			width = view.conf.width - x;
		}
		
		if (y + height > view.conf.height) {
			height = view.conf.height - y;
		}
		
		tileset = this.map.tileset;
		
		x2 = x + width;
		y2 = y + height;
		
		mapIndexRef = ((y >>> 1) + this.scrollY) * this.map.width;
		mapIndexRefWrap = this.map.height * this.map.width;
		
		for (yi = y; yi < y2; yi += 2) {
			if (mapIndexRef >= mapIndexRefWrap) {
				mapIndexRef -= mapIndexRefWrap;
			}
			
			mapIndexOffset = (x >>> 1) + this.scrollX;
			
			for (xi = x; xi < x2; xi += 2) {
				if (mapIndexOffset >= this.map.width) {
					mapIndexOffset -= this.map.width;
				}
				
				mapIndex = mapIndexRef + mapIndexOffset;
				
				pattern = this.map.tilePatterns[this.tiles[mapIndex]];
				
				tileX = pattern.tileX * 2;
				tileY = pattern.tileY * 2;
				
				view.drawTile(tileset, tileX, tileY, xi, yi);
				view.drawTile(tileset, tileX + 1, tileY, xi + 1, yi);
				view.drawTile(tileset, tileX, tileY + 1, xi, yi + 1);
				view.drawTile(tileset, tileX + 1, tileY + 1, xi + 1, yi + 1);
				
				if (pattern.ontilerender !== null) {
					pattern.ontilerender(mapIndex % this.map.width, Math.floor(mapIndex / this.map.width));
				}
				
				++mapIndexOffset;
			}
			
			mapIndexRef += this.map.width;
		}
	},
	
	repaintAll: function () {
		this.repaint(0, 0, QuestForge.current.view.conf.width, QuestForge.current.view.conf.height);
	},
	
	resetBattleSteps: function () {
		this.battleSteps = Math.floor(Math.random() * 20 + 10);
	},
	
	returnToEngine: function () {
		this.repaintAll();
		QuestForge.current.game.currentEngine = this;
	},
	
	scrollUp: function () {
		var view;
		
		view = QuestForge.current.view;
		
		if (this.scrollY === 0) {
			this.scrollY = this.map.height - 1;
		}
		else {
			--this.scrollY;
		}
		
		view.shiftDown();
		view.shiftDown();
		this.repaint(0, 0, view.conf.width, 2);
	},
	
	scrollDown: function () {
		var view;
		
		view = QuestForge.current.view;
		
		if (this.scrollY === this.map.height - 1) {
			this.scrollY = 0;
		}
		else {
			++this.scrollY;
		}
		
		view.shiftUp();
		view.shiftUp();
		this.repaint(0, view.conf.height - 2, view.conf.width, 2);
	},
	
	scrollLeft: function () {
		var view;
		
		view = QuestForge.current.view;
		
		if (this.scrollX === 0) {
			this.scrollX = this.map.width - 1;
		}
		else {
			--this.scrollX;
		}
		
		view.shiftRight();
		view.shiftRight();
		this.repaint(0, 0, 2, view.conf.height);
	},
	
	scrollRight: function () {
		var view;
		
		view = QuestForge.current.view;
		
		if (this.scrollX === this.map.width - 1) {
			this.scrollX = 0;
		}
		else {
			++this.scrollX;
		}
		
		view.shiftLeft();
		view.shiftLeft();
		this.repaint(view.conf.width - 2, 0, 2, view.conf.height);
	},
	
	tick: function () {
		switch (this.transitionType) {
		case 0:
			this.tickNormal();
			break;
		
		case 1:
			this.tickTransitionWaitLoad();
			break;
		
		case 2:
			this.tickTransitionEnterMap();
			break;
		
		case 3:
			this.tickTransitionExitMap();
			break;
		
		case 4:
			this.tickTransitionEnterBattle();
			break;
		}
	},
	
	tickNormal: function () {
		var i, sprite, scrollOffsetX, scrollOffsetY,
		    game, input, view;
		
		game = QuestForge.current.game;
		input = QuestForge.current.input;
		view = QuestForge.current.view;
		
		if (this.conf.allowLeaderRotation === true) {
			if (input.throttledCycleDown === true && game.currentParty !== null) {
				game.currentParty.setNextLeader();
			}
			
			if (input.throttledCycleUp === true && game.currentParty !== null) {
				game.currentParty.setPreviousLeader();
			}
		}
		
		// Run everyone's tick functions first, because sprite-to-sprite interactions can affect the sprite displays.
		
		for (i = this.sprites.length - 1; i >= 0; --i) {
			sprite = this.sprites[i];
			
			if (sprite.tick !== undefined) {
				sprite.tick();
				
				if (i === 0) {
					// Handle scrolling.
					
					view.offset(-1 * this.sprites[0].offsetX, -1 * this.sprites[0].offsetY);
				}
				
				if (this.transitionType !== 0) {
					// We're beginning a transition. Stop processing the sprites.
					
					this.drawSprite(this.player);
					return;
				}
			}
		}
		
		// Now display the sprites.
		
		this.drawSprites();
	},
	
	tickTransitionWaitLoad: function () {
		var tileset, view, x, y;
		
		switch (this.transitionFrame) {
		case 0:
		case 1:
			// Delay to clear the player sprite.
			
			if (QuestForge.current.game.skippedFrame === false) {
				++this.transitionFrame;
			}
			break;
		
		case 2:
			// Update all tiles to use the new map's tileset.
			// In browsers with content sniffing extensions,
			// this might temporarily slow the browser,
			// potentially causing skipped frames.
			
			view = QuestForge.current.view;
			tileset = this.map.tileset;
			
			for (y = view.conf.height - 1; y >= 0; --y) {
				for (x = view.conf.width - 1; x >= 0; --x) {
					view.drawTile(tileset, 0, 0, x, y);
				}
			}
			
			this.player.facing = this.transitionFacing;
			++this.transitionFrame;
			break;
		
		default:
			// Wait until we've had four non-skipped frames
			// before continuing with the entry transition.
			
			if (QuestForge.current.game.skippedFrame === false) {
				++this.transitionFrame;
				
				if (this.transitionFrame >= 7) {
					this.transitionType = 2;
					this.transitionFrame = 0;
				}
			}
		}
	},
	
	tickTransitionEnterMap: function () {
		var halfHeight, halfWidth, i, numFrames,
		    view;
		
		view = QuestForge.current.view;
		
		halfHeight = view.conf.height >>> 1;
		halfWidth = view.conf.width >>> 1;
		numFrames = Math.max(halfHeight >>> 1, halfWidth >>> 1) + 1;
		
		i = (Math.max(halfHeight, halfWidth) >>> 1) - this.transitionFrame;
		
		this.repaint(i * 2, i * 2, view.conf.width - i * 4, 2);
		this.repaint(i * 2, view.conf.height - 2 - i * 2, view.conf.width - i * 4, 2);
		
		this.repaint(i * 2, i * 2 + 2, 2, view.conf.height - 4 - i * 4);
		this.repaint(view.conf.width - 2 - i * 2, i * 2 + 2, 2, view.conf.height - 4 - i * 4);
		
		this.drawSprite(this.player);
		
		++this.transitionFrame;
		
		if (this.transitionFrame === 1 && this.map.music !== null) {
			// We queue the music in advance so the browser
			// can time the start of its playback accurately.
			// If we didn't do this, any interruptions from
			// sound effects could cause music channels to
			// become slightly offset from each other.
			
			QuestForge.current.soundEngine.play(this.map.music, undefined, 0, QuestForge.current.game.conf.frameInterval * numFrames / 1000);
		}
		
		if (this.transitionFrame >= numFrames) {
			this.transitionType = 0;
			this.transitionFrame = 0;
		}
	},
	
	tickTransitionExitMap: function () {
		var tileset, numFrames, centerX, centerY, maxDist, x, y,
		    minX, minY, maxX, maxY,
		    view;
		
		view = QuestForge.current.view;
		tileset = this.prevMap.tileset;
		
		if (this.transitionFrame === 0) {
			QuestForge.current.soundEngine.stop();
		}
		
		centerX = (view.conf.width >>> 1) - 1;
		centerY = (view.conf.height >>> 1);
		
		maxDist = Math.max(view.conf.width - centerX, view.conf.height - centerY);
		
		minX = centerX - maxDist + this.transitionFrame;
		minY = centerY - maxDist + this.transitionFrame + 1;
		maxX = centerX + maxDist - this.transitionFrame - 1;
		maxY = centerY + maxDist - this.transitionFrame;
		
		if (minY >= 2) {
			for (x = Math.max(minX, 2); x <= maxX && x < view.conf.width - 2; ++x) {
				view.drawTile(tileset, 0, 0, x, minY);
			}
		}
		
		if (maxY < view.conf.height - 2) {
			for (x = Math.max(minX, 2); x <= maxX && x < view.conf.width - 2; ++x) {
				view.drawTile(tileset, 0, 0, x, maxY);
			}
		}
		
		if (minX >= 2) {
			for (y = Math.max(minY, 2); y <= maxY && y < view.conf.height - 2; ++y) {
				view.drawTile(tileset, 0, 0, minX, y);
			}
		}
		
		if (maxX < view.conf.width - 2) {
			for (y = Math.max(minY, 2); y <= maxY && y < view.conf.height - 2; ++y) {
				view.drawTile(tileset, 0, 0, maxX, y);
			}
		}
		
		++this.transitionFrame;
		
		if (this.transitionFrame >= maxDist) {
			this.transitionType = 1;
			this.transitionFrame = 0;
		}
		else {
			this.drawSprite(this.player);
		}
	},
	
	tickTransitionEnterBattle: function () {
		var tileset, halfHeight, halfWidth, maxHalf, x, y,
		    view;
		
		view = QuestForge.current.view;
		
		if (this.transitionFrame === 0) {
			QuestForge.current.soundEngine.stop();
		}
		
		tileset = this.map.tileset;
		halfHeight = view.conf.height >>> 1;
		halfWidth = view.conf.width >>> 1;
		maxHalf = Math.max(halfHeight, halfWidth);
		
		for (x = 0; x < maxHalf; ++x) {
			if (x + this.transitionFrame < halfHeight && x < halfWidth) {
				view.drawTile(tileset, 0, 0, halfWidth - x, halfHeight - x - this.transitionFrame);
				view.drawTile(tileset, 0, 0, halfWidth - x, halfHeight + x + this.transitionFrame);
				view.drawTile(tileset, 0, 0, halfWidth + x, halfHeight - x - this.transitionFrame);
				view.drawTile(tileset, 0, 0, halfWidth + x, halfHeight + x + this.transitionFrame);
			}
			
			if (x + this.transitionFrame < halfWidth && x < halfHeight) {
				view.drawTile(tileset, 0, 0, halfWidth - x - this.transitionFrame, halfHeight - x);
				view.drawTile(tileset, 0, 0, halfWidth - x - this.transitionFrame, halfHeight + x);
				view.drawTile(tileset, 0, 0, halfWidth + x + this.transitionFrame, halfHeight - x);
				view.drawTile(tileset, 0, 0, halfWidth + x + this.transitionFrame, halfHeight + x);
			}
		}
		
		this.drawSprite(this.player);
		
		++this.transitionFrame;
		
		if (this.transitionFrame >= Math.max(halfHeight, halfWidth)) {
			this.transitionType = 1;
			this.transitionFrame = 0;
			this.enterBattle();
		}
	},
	
	enterBattle: function () {
		var battleId, battleSet, domainIndex, tile;
		
		if (this.map.battles === null) {
			// No random battles defined for this map.
			return;
		}
		
		tile = this.player.getUnderTile();
		
		domainIndex = Math.floor(this.player.y / this.map.domainHeight) * Math.ceil(this.map.width / this.map.domainWidth);
		domainIndex += Math.floor(this.player.x / this.map.domainWidth);
		domainIndex %= this.map.battles.length;
		
		battleSet = this.map.battles[domainIndex][this.map.battles[domainIndex][tile.biome] !== undefined ? this.map.battles[domainIndex][tile.biome] : 'default'];
		battleId = battleSet[Math.floor(Math.random() * battleSet.length)];
		
		QuestForge.current.battleEngine.initBattle({
			battle: QuestForge.current.game.battles[battleId],
		});
	},
	
	/* Map access */
	
	getFeatureAt: function (x, y, interactableBy) {
		var feature;
		
		feature = this.getSpriteAt(x, y, interactableBy);
		
		if (feature !== null) {
			return feature;
		}
		
		// Default to the map tile.
		
		return this.getTilePatternAt(x, y);
	},
	
	getSpriteAt: function (x, y, interactableBy) {
		var num, i, sprite;
		
		x = (x + this.map.width) % this.map.width;
		y = (y + this.map.height) % this.map.height;
		
		num = this.sprites.length;
		
		for (i = 0; i < num; ++i) {
			sprite = this.sprites[i];
			
			if (x === sprite.x && y === sprite.y) {
				if (interactableBy === undefined || Math.abs(sprite.floorLevel - interactableBy.floorLevel) <= interactableBy.currentVehicle.terrainStep) {
					return sprite;
				}
			}
		}
		
		return null;
	},
	
	getSpriteMovingFrom: function (x, y, interactableBy) {
		var num, i, sprite, deltaX, deltaY;
		
		x = (x + this.map.width) % this.map.width;
		y = (y + this.map.height) % this.map.height;
		
		num = this.sprites.length;
		
		for (i = 0; i < num; ++i) {
			sprite = this.sprites[i];
			
			if (sprite.offsetX !== 0 || sprite.offsetY !== 0) {
				if (sprite.offsetX === 0) {
					deltaX = 0;
				}
				else if (sprite.offsetX < 0) {
					deltaX = -1;
				}
				else {
					deltaX = 1;
				}
				
				if (sprite.offsetY === 0) {
					deltaY = 0;
				}
				else if (sprite.offsetY < 0) {
					deltaY = -1;
				}
				else {
					deltaY = 1;
				}
				
				if (x === sprite.x + deltaX && y === sprite.y + deltaY) {
					if (interactableBy === undefined || Math.abs(sprite.floorLevel - interactableBy.floorLevel) <= interactableBy.currentVehicle.terrainStep) {
						return sprite;
					}
				}
			}
		}
		
		return null;
	},
	
	getTilePatternAt: function (x, y) {
		return this.map.tilePatterns[this.getTilePatternIdAt(x, y)];
	},
	
	getTilePatternIdAt: function (x, y) {
		while (x < 0) {
			x += this.map.width;
		}
		
		while (y < 0) {
			y += this.map.height;
		}
		
		x %= this.map.width;
		y %= this.map.height;
		
		return this.tiles[y * this.map.width + x];
	},
	
	setTilePatternIdAt: function (x, y, tilePatternId) {
		while (x < 0) {
			x += this.map.width;
		}
		
		while (y < 0) {
			y += this.map.height;
		}
		
		x %= this.map.width;
		y %= this.map.height;
		
		this.tiles[y * this.map.width + x] = tilePatternId;
	},
};
