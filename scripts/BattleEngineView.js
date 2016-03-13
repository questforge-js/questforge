"use strict";

QuestForge.prototype.BattleEngineView = function (battleEngine) {
	this.engine = battleEngine;
	this.view = QuestForge.current.view;
	
	this.effects = [];
};

QuestForge.prototype.BattleEngineView.prototype = {
	// Objects set by constructor.
	effects: null,
	engine: null,
	view: null,
	
	drawBackground: function (biome) {
		var x, y;
		
		for (y = 0; y < 4; ++y) {
			for (x = this.view.conf.width - 5; x >= 0; --x) {
				this.view.drawTile(this.view.tilesets.battleBackgrounds, x, y + biome, x + 2, y + 2);
			}
		}
	},
	
	// drawArenaSprite is used for all sprites that get flipped in from-behind battles.
	
	drawArenaSprite: function (tileset, tileX, tileY, width, height, x, y, z, isFlippedX, isFlippedY) {
		// Note: Unlike view.drawSprite, this function takes the width and
		// height in tiles, not pixels.
		
		if (this.engine.battle.fromBehind === true) {
			this.view.drawSprite(tileset, tileX, tileY, width * this.view.conf.tileWidth, height * this.view.conf.tileHeight, (this.view.conf.width - width) * this.view.conf.tileWidth - x, y, z, !isFlippedX, isFlippedY);
		}
		else {
			this.view.drawSprite(tileset, tileX, tileY, width * this.view.conf.tileWidth, height * this.view.conf.tileHeight, x, y, z, isFlippedX, isFlippedY);
		}
	},
	
	drawAvatarSprite: function (lineupSlot, tileset, tileX, tileY, width, height, x, y, z, isFlippedX, isFlippedY) {
		// This function is for drawing avatars, as well as effects that
		// are positioned relative to and share the same orientation as
		// an avatar. This performs the in-place sprite flipping for
		// enemy avatars and effects.
		
		if (isFlippedX === undefined) {
			isFlippedX = false;
		}
		
		if (lineupSlot.side === 1) {
			x = lineupSlot.arenaX - (x - lineupSlot.arenaX) - (width - (lineupSlot.isPortrait === true ? lineupSlot.character.portraitWidth : this.engine.conf.avatarWidth)) * this.view.conf.tileWidth;
			isFlippedX = (isFlippedX === false);
		}
		
		this.drawArenaSprite(tileset, tileX, tileY, width, height, x, y, z, isFlippedX, isFlippedY);
	},
	
	drawEffects: function () {
		var effect, i, isFlippedX, props, x, y;
		
		for (i = 0; i < this.effects.length; ++i) {
			effect = this.effects[i];
			
			if (effect.duration !== null && effect.age >= effect.duration) {
				// The effect has expired.
				
				this.effects.splice(i, 1);
				--i;
				continue;
			}
			
			if (effect.age >= 0) {
				if (effect.target === null) {
					// Position to absolute coordinates.
					
					x = effect.x;
					y = effect.y;
				}
				else {
					// Position/flip relative to the target.
					
					x = effect.x;
					isFlippedX = effect.isFlippedX;
					
					if (effect.flipForSide === true && effect.target.side === 1) {
						x = -x - effect.width * this.view.conf.tileWidth;
						isFlippedX = !isFlippedX;
					}
					
					if (this.engine.battle.fromBehind === true) {
						x += (this.view.conf.width - (effect.target.isPortrait === true ? effect.target.character.portraitWidth : this.engine.conf.avatarWidth)) * this.view.conf.tileWidth - effect.target.getCenterX();
					}
					else {
						x += effect.target.getCenterX();
					}
					
					y = effect.y + effect.target.getCenterY();
				}
				
				// Draw the effect using its drawing function.
				// Most drawing functions will further adjust
				// the sprite's arguments based on the effect's
				// age, in order to perform an animation.
				
				props = {
					tileset: effect.tileset,
					spriteX: effect.spriteX,
					spriteY: effect.spriteY,
					width: effect.width * this.view.conf.tileWidth,
					height: effect.height * this.view.conf.tileHeight,
					x: x,
					y: y,
					z: effect.z,
					isFlippedX: isFlippedX,
					isFlippedY: effect.isFlippedY,
				};
				
				effect.animate(props);
				
				this.view.drawSprite(props.tileset, props.spriteX, props.spriteY, props.width, props.height, props.x, props.y, props.z, props.isFlippedX, props.isFlippedY);
			}
			
			++effect.age;
		}
	},
	
	drawAvatar: function (lineupSlot) {
		var character, stance, tileset, x, y,
		    game, view;
		
		game = QuestForge.current.game;
		view = QuestForge.current.view;
		tileset = this.view.tilesets.avatars;
		character = lineupSlot.character;
		
		if (character !== null) {
			// Determine the stance.
			
			if (lineupSlot.stance !== null) {
				// The lineup slot is overriding the stance.
				// (For example: during an ability animation.)
				
				stance = lineupSlot.stance;
			}
			else if ((game.ticksElapsed & 4) === 0 && this.engine.pendingTurns.length !== 0 && this.engine.pendingTurns[this.engine.currentTurn] === lineupSlot && (this.engine.conf.enableEffectsDuringSelection === true || this.engine.state !== 2)) {
				stance = -1;
			}
			else if (this.engine.state === 7 && character.hp > 0) {
				stance = (this.engine.eventFrame & 16) === 0 ? this.engine.conf.cheerStance : 0;
			}
			else {
				stance = character.getStance();
			}
			
			// Draw the sprite.
			
			if (stance === this.engine.conf.slainStance) {
				stance *= this.engine.conf.avatarWidth;
				
				this.drawAvatarSprite(lineupSlot, tileset, stance, (character.battleSprite + 1) * this.engine.conf.avatarHeight - this.engine.conf.avatarWidth, this.engine.conf.avatarHeight, this.engine.conf.avatarWidth, lineupSlot.arenaX, lineupSlot.arenaY + (this.engine.conf.avatarHeight - this.engine.conf.avatarWidth) * this.view.conf.tileHeight, 2);
			}
			else {
				if (stance > this.engine.conf.slainStance) {
					stance = (stance - 1) * this.engine.conf.avatarWidth + this.engine.conf.avatarHeight;
				}
				else {
					stance *= this.engine.conf.avatarWidth;
				}
				
				this.drawAvatarSprite(lineupSlot, tileset, stance, character.battleSprite * this.engine.conf.avatarHeight, this.engine.conf.avatarWidth, this.engine.conf.avatarHeight, lineupSlot.arenaX, lineupSlot.arenaY, 2);
			}
		}
	},
	
	drawCombatants: function () {
		var i, lineupSlot;
		
		for (i = 0; i < this.engine.combatants.length; ++i) {
			lineupSlot = this.engine.combatants[i];
			
			if (lineupSlot.character !== null && lineupSlot.isPortrait === false) {
				this.drawAvatar(lineupSlot);
			}
		}
	},
	
	drawPortrait: function (lineupSlot, isFlashing) {
		var character, portraitX, portraitY;
		
		character = lineupSlot.character;
		
		if (isFlashing === true) {
			portraitX = character.flashPortraitX;
			portraitY = character.flashPortraitY;
		}
		else {
			portraitX = character.portraitX;
			portraitY = character.portraitY;
		}
		
		this.view.drawRegion(this.view.tilesets.portraits, portraitX, portraitY, character.portraitWidth, character.portraitHeight, lineupSlot.arenaBaseX, lineupSlot.arenaBaseY);
	},
	
	clearPortrait: function (lineupSlot) {
		this.view.draw(this.view.tilesets.dialog, 0, 0, lineupSlot.arenaBaseX, lineupSlot.arenaBaseY, lineupSlot.character.portraitWidth, lineupSlot.character.portraitHeight);
	},
	
	drawSprites: function () {
		this.drawCombatants();
		this.drawEffects();
		
		if (this.engine.state === 5) {
			this.drawCursor();
		}
	},
	
	drawCursor: function () {
		var character, colWidth, effectivePosition, numCols, x, y;
		
		switch (this.engine.state) {
		case 5:
			// Arena selection.
			
			character = this.engine.arena.cursor.character;
			
			y = this.engine.arena.cursor.isPortrait === true ? character.portraitHeight : this.engine.conf.avatarHeight;
			y = ((y - 1) * this.view.conf.tileHeight) >>> 1;
			
			if (this.engine.battle.fromBehind === true) {
				x = this.engine.arena.cursor.isPortrait === true ? character.portraitWidth : this.engine.conf.avatarWidth;
				x *= this.view.conf.tileWidth;
				
				this.drawCursorSprite((this.view.conf.width - 2) * this.view.conf.tileWidth - this.engine.arena.cursor.arenaX - x, this.engine.arena.cursor.arenaY + y);
			}
			else {
				this.drawCursorSprite(this.engine.arena.cursor.arenaX - this.view.conf.tileWidth * 2, this.engine.arena.cursor.arenaY + y);
			}
			
			if (this.engine.arena.cursorOnAll === true) {
				this.engine.arena.cursor = this.engine.arena.getNextSelectableCombatant(this.engine.arena.cursor);
			}
			break;
		}
	},
	
	drawCursorSprite: function (x, y) {
		var spriteX, spriteY;
		
		if (this.effects.length > 0) {
			spriteX = this.engine.conf.conservationCursorSpriteX;
			spriteY = this.engine.conf.conservationCursorSpriteY;
		}
		else {
			spriteX = this.engine.conf.cursorSpriteX;
			spriteY = this.engine.conf.cursorSpriteY;
		}
		
		this.view.drawSprite(this.view.tilesets.effects, spriteX, spriteY, this.view.conf.tileWidth * 2, this.view.conf.tileHeight * 2, x, y, 5);
	},
	
	drawProgressBar: function (lineupSlot) {
		var partyListDimensions;
		
		partyListDimensions = this.engine.conf.dialogTypes.partyList;
		
		this.drawTextBehindMenus(partyListDimensions.x + 15, partyListDimensions.y + 1 + lineupSlot.position * 2, this.engine.stringHelper.getProgressBar(lineupSlot));
	},
	
	drawTextBehindMenus: function (x, y, message) {
		var chr, dimensions, i, j, len, tileInfo, tileset, xi,
		    dialogEngine;
		
		dialogEngine = QuestForge.current.dialogEngine;
		
		tileset = this.view.tilesets.dialog;
		
		xi = x;
		
		for (i = 0; i < message.length; ++i) {
			chr = message.charCodeAt(i);
			
			if (chr === 10) {
				xi = x;
				y += 2;
			}
			else {
				len = this.engine.menus.length;
				
				for (j = 0; j < len; ++j) {
					dimensions = this.engine.conf.dialogTypes[this.engine.menus[j].dialogType];
					
					if (xi >= dimensions.x && xi < dimensions.x + dimensions.width && y >= dimensions.y && y < dimensions.y + dimensions.height && dialogEngine.buffers['battleMenu'+j] !== undefined) {
						if (QuestForge.current.game.currentEngine !== QuestForge.current.dialogEngine || dialogEngine.bufferName !== 'battleMenu'+j || dialogEngine.currentHeight > y - dimensions.y) {
							// This menu is covering up the character. Write the character to the dialog's buffer.
							
							tileInfo = dialogEngine.buffers['battleMenu'+j][y][xi];
							tileInfo[0] = tileset.urlId;
							tileInfo[1] = chr & 15;
							tileInfo[2] = chr >>> 4;
							break;
						}
					}
				}
				
				if (j === len) {
					// No menus are covering up this character. Draw it on the screen.
					
					this.view.drawTile(tileset, chr & 15, chr >>> 4, xi, y);
				}
				
				++xi;
			}
		}
	},
	
	//== Effects ==//
	
	addEffect: function (props) {
		this.effects.push(new QuestForge.current.BattleEffect(props));
	},
	
	addEffectNumber: function (target, number, animate, wave) {
		var color, i, numDigits;
		
		if (number < 0) {
			number = -number;
			color = 1;
		}
		else {
			color = 0;
		}
		
		if (animate === undefined) {
			animate = QuestForge.current.BattleEffect.animateBouncing;
		}
		
		if (wave === undefined) {
			wave = true;
		}
		
		numDigits = QuestForge.current.game.getPositiveIntDigits(number);
		
		for (i = 0; i < numDigits; ++i) {
			this.addEffect({
				tileset: this.view.tilesets.effects,
				target: target,
				x: ((numDigits * this.view.conf.tileWidth) >>> 1) - (i + 1) * this.view.conf.tileWidth,
				y: (target.getPixelHeight() >>> 1) - this.view.conf.tileHeight,
				spriteX: 4 + (number % 10),
				spriteY: color,
				age: wave === true ? -i : 0,
				flipForSide: false,
				duration: 32,
				animate: animate,
			});
			
			number = Math.floor(number / 10);
		}
	},
	
	addEffectMiss: function (target) {
		this.addEffect({
			tileset: this.view.tilesets.effects,
			target: target,
			x: target.side * -2 * this.view.conf.tileWidth,
			y: (target.getPixelHeight() >>> 1) - this.view.conf.tileHeight,
			spriteX: 14,
			spriteY: 0,
			width: 2,
			flipForSide: false,
			duration: 32,
			animate: QuestForge.current.BattleEffect.animateBouncing,
		});
	},
	
	addEffectDisintegration: function (target) {
		var i;
		
		for (i = 0; i < target.character.portraitWidth; ++i) {
			this.addEffect({
				tileset: this.view.tilesets.effects,
				target: target,
				x: i * this.view.conf.tileWidth - (target.getPixelWidth() >>> 1),
				y: (target.getPixelHeight() >>> 1) * -1 - this.view.conf.tileHeight,
				spriteX: 21,
				spriteY: 0,
				height: 2,
				age: -i - 24,
				duration: target.getTileHeight() + 2,
				animate: QuestForge.current.BattleEffect.animateDisintegrating,
			});
		}
	},
	
	//== Box drawing ==//
	
	// Expand a dialog box, using dimensions from this.conf.dialogTypes.
	
	expandBox: function (dialogType, message, bufferName) {
		var dimensions;
		
		dimensions = this.engine.conf.dialogTypes[dialogType];
		
		if (dimensions.padX > 0) {
			message = message.replace(/^/gm, QuestForge.current.game.padLeft('', dimensions.padX));
		}
		
		if (dimensions.padY > 0) {
			message = QuestForge.current.game.padLeft(message, message.length + dimensions.padY, '\n');
		}
		
		QuestForge.current.dialogEngine.expandBox({
			bufferName: bufferName !== undefined ? bufferName : dialogType,
			message: message,
			x: dimensions.x,
			y: dimensions.y,
			width: dimensions.width,
			height: dimensions.height,
		});
	},
	
	// Contract a dialog box, using dimensions from this.conf.dialogTypes.
	
	contractBox: function (dialogType, bufferName) {
		var dimensions;
		
		dimensions = this.engine.conf.dialogTypes[dialogType];
		
		QuestForge.current.dialogEngine.contractBox({
			bufferName: bufferName !== undefined ? bufferName : dialogType,
			x: dimensions.x,
			y: dimensions.y,
			width: dimensions.width,
			height: dimensions.height,
		});
	},
	
	dialog: function (message) {
		var dimensions;
		
		dimensions = this.engine.conf.dialogTypes.event;
		
		if (dimensions.padY > 0) {
			message = QuestForge.current.game.padLeft(message, message.length + dimensions.padY, '\n');
		}
		
		QuestForge.current.dialogEngine.customDialog({
			bufferName: 'dialog',
			message: message,
			x: dimensions.x,
			y: dimensions.y,
			width: dimensions.width,
			height: dimensions.height,
		});
	},
};
