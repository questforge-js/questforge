"use strict";

QuestForge.prototype.MainMenuEngine = function (props) {
	this.conf = {
		menuItems: (function (mainMenuEngine) {
			return [
				{
					label: 'Item',
					handler: function () {
						mainMenuEngine.initItemsMenu();
					},
				},
				{
					label: 'Skill',
					handler: function () {
						mainMenuEngine.initCharacterMenuSelection(QuestForge.current.skillScreenEngine);
					},
				},
				{
					label: 'Equip',
					handler: function () {
						mainMenuEngine.initCharacterMenuSelection(QuestForge.current.equipScreenEngine);
					},
				},
				{
					label: 'Status',
					handler: function () {
						mainMenuEngine.initCharacterMenuSelection(QuestForge.current.statusScreenEngine);
					},
				},
				{
					label: 'Config',
					handler: function () {
					},
				},
				{
					label: 'Save',
					handler: function () {
						QuestForge.current.game.save();
					},
					enabledChecker: function () {
						return QuestForge.current.mapEngine.canSave();
					},
				},
			];
		})(this),
	};
	
	QuestForge.applyProperties(props, this.conf);
};

QuestForge.registerEngine('MainMenuEngine', []);

QuestForge.prototype.MainMenuEngine.prototype = {
	conf: null,
	
	state: 0,
	cursorPositions: null,
	
	lineupCursorPositions: null,
	memberCursorPositions: null,
	
	partySelection: null,
	
	menuItemText: null,
	menuItemHandlers: null,
	targetEngine: null,
	
	prepare: function () {
		var dialogEngine, game, i, menuText, view;
		
		dialogEngine = QuestForge.current.dialogEngine;
		game = QuestForge.current.game;
		view = QuestForge.current.view;
		
		this.cursorPositions = [null, []];
		
		// Party box.
		
		dialogEngine.drawBox(2, 2, view.conf.width - 4, view.conf.height - 4, true);
		
		// Main menu.
		
		menuText = '';
		
		for (i = 0; i < this.conf.menuItems.length; ++i) {
			if (i !== 0) {
				menuText += "\n";
			}
			
			if (this.conf.menuItems[i].enabledChecker !== undefined && this.conf.menuItems[i].enabledChecker() !== true) {
				menuText += dialogEngine.getDisabledText(this.conf.menuItems[i].label);
				
				this.cursorPositions[1].push(null);
			}
			else {
				menuText += this.conf.menuItems[i].label;
				
				this.cursorPositions[1].push([
					(view.conf.width - 9) * view.conf.tileWidth,
					(4 + i * 2) * view.conf.tileHeight
				]);
			}
		}
		
		dialogEngine.drawBox(view.conf.width - 10, 2, 8, view.conf.height - 11, true);
		dialogEngine.drawText(view.conf.width - 9, 4, menuText);
		
		// Time.
		
		dialogEngine.drawBox(view.conf.width - 10, view.conf.height - 9, 8, 4, true);
		dialogEngine.drawText(view.conf.width - 9, view.conf.height - 8, 'Time');
		
		// Gold.
		
		dialogEngine.drawBox(view.conf.width - 13, view.conf.height - 5, 11, 3, true);
		dialogEngine.drawText(view.conf.width - 12, view.conf.height - 4, game.padLeft(game.currentParty.gold, 7)+' G');
		
		this.drawPartyBoxContents();
		
		QuestForge.current.cursorEngine.initPrecise({
			positions: this.cursorPositions,
			x: 1,
			y: 0,
		});
	},
	
	drawPartyBoxContents: function () {
		var character, i, lineup, lineupSlot, portraitsTileset, status,
		    dialogEngine, game, view, x, y;
		
		dialogEngine = QuestForge.current.dialogEngine;
		game = QuestForge.current.game;
		view = QuestForge.current.view;
		
		view.draw(view.tilesets.dialog, 0, 2, 3, 3, view.conf.width - 13, view.conf.height - 8);
		
		portraitsTileset = view.tilesets.portraits;
		lineup = game.currentParty.lineup;
		
		this.lineupCursorPositions = [];
		this.memberCursorPositions = [];
		
		for (i = 0; i < lineup.length; ++i) {
			lineupSlot = lineup[i];
			character = lineupSlot.character;
			
			if (character !== null) {
				dialogEngine.drawText(12, 4 + i * 6, this.getCharacterSummary(character), 1);
				dialogEngine.drawBox(3, 5 + i * 6 - (character.portraitHeight >>> 1), character.portraitWidth + 4, character.portraitHeight + 2, true, true);
				view.drawRegion(portraitsTileset, character.portraitX, character.portraitY, character.portraitWidth, character.portraitHeight, 6 - (lineupSlot.row * 2), 6 + i * 6 - (character.portraitHeight >>> 1));
				
				this.memberCursorPositions.push([
					4 * view.conf.tileWidth,
					view.conf.tileHeight * (5 + i * 6) + (view.conf.tileHeight >>> 1)
				]);
			}
			else {
				this.memberCursorPositions.push(null);
			}
			
			this.lineupCursorPositions.push([
				4 * view.conf.tileWidth,
				view.conf.tileHeight * (5 + i * 6) + (view.conf.tileHeight >>> 1)
			]);
		}
		
		this.cursorPositions[0] = this.lineupCursorPositions;
	},
	
	getCharacterSummary: function (character) {
		var game, status;
		
		game = QuestForge.current.game;
		
		if (character.hp === 0) {
			status = 'Slain';
		}
		else {
			status = 'Level';
		}
		
		return ''+
			character.name+'\n'+
			' '+game.padRight(status, 10)+game.padLeft(character.level, 2)+'\n'+
			' HP '+game.padLeft(character.hp, 4)+'/'+game.padLeft(character.stats.maxHp, 4)+'\n'+
			' MP '+game.padLeft(character.mp, 4)+'/'+game.padLeft(character.stats.maxMp, 4)+'\n';
	},
	
	drawMessage: function (message) {
		QuestForge.current.dialogEngine.staticBox(message, 2, QuestForge.current.view.conf.height - 5, QuestForge.current.view.conf.width - 15, 3);
	},
	
	clearMessage: function () {
		var view, x, y;
		
		view = QuestForge.current.view;
		
		view.drawTile(view.tilesets.dialog, 3, 9, 2, view.conf.height - 5);
		view.drawTile(view.tilesets.dialog, 6, 9, view.conf.width - 14, view.conf.height - 3);
		view.draw(view.tilesets.dialog, 0, 2, 3, view.conf.height - 5, view.conf.width - 16, 2);
	},
	
	//== Tick functions ==//
	
	tick: function () {
		switch (this.state) {
		case 0: // Draw the main screen and switch to the cursor engine.
			this.prepare();
			break;
		}
	},
	
	cursorTick: function () {
		var i, time,
		    game, input, view;
		
		game = QuestForge.current.game;
		input = QuestForge.current.input;
		view = QuestForge.current.view;
		
		// Party first selection cursor.
		
		if (this.partySelection !== null && (game.ticksElapsed & 2) === 0 || game.skippedFrame === true) {
			view.drawSprite(view.tilesets.effects, 0, 0, 2 * view.conf.tileWidth, 2 * view.conf.tileHeight, 2 * view.conf.tileWidth + (view.conf.tileWidth >>> 1), view.conf.tileHeight * (5 + this.partySelection * 6) + (view.conf.tileHeight >>> 1), 1);
		}
		
		// Update time display.
		
		QuestForge.current.dialogEngine.drawText(view.conf.width - 9, view.conf.height - 7, game.padLeft(game.hoursPlayed, 3)+':'+game.padLeft(game.minutesPlayed, 2, '0'));
		
		if (input.progressiveUp === true || input.progressiveDown === true || input.progressiveLeft === true || input.progressiveRight === true) {
			this.clearMessage();
		}
	},
	
	//== Cursor events ==//
	
	cursorAction: function (x, y) {
		QuestForge.current.soundEngine.play('sfx-cursor');
		
		if (x === 0) {
			// Party member selected.
			
			if (this.targetEngine !== null) {
				this.targetEngine.init(QuestForge.current.game.currentParty.lineup[y].character);
			}
			else if (this.partySelection === null) {
				// Make the first selection.
				this.partySelection = y;
			}
			else {
				if (this.partySelection === y) {
					// Change the character's row.
					QuestForge.current.game.currentParty.toggleRow(y);
				}
				else {
					// Swap the character positions.
					QuestForge.current.game.currentParty.swapPositions(this.partySelection, y);
				}
				
				this.partySelection = null;
				this.drawPartyBoxContents();
			}
		}
		else {
			// Menu item selected.
			this.conf.menuItems[y].handler();
		}
	},
	
	cursorCancel: function (x, y) {
		this.targetEngine = null;
		
		if (x === 0) {
			QuestForge.current.soundEngine.play('sfx-cursor');
			this.cursorPositions[0] = this.lineupCursorPositions;
			this.clearMessage();
			
			if (this.partySelection !== null) {
				this.partySelection = null;
			}
			else {
				QuestForge.current.cursorEngine.x = 1;
			}
		}
		else {
			this.state = 0;
			QuestForge.current.mapEngine.returnToEngine();
		}
	},
	
	cursorChangeCol: function (oldX) {
		this.targetEngine = null;
		this.cursorPositions[0] = this.lineupCursorPositions;
		
		if (this.partySelection !== null) {
			// Deselect the party memeber and stay in the party column.
			
			this.partySelection = null;
			QuestForge.current.cursorEngine.x = oldX;
		}
	},
	
	cursorThudDown: function () {
		QuestForge.current.cursorEngine.moveToFirst();
	},
	
	cursorThudUp: function () {
		QuestForge.current.cursorEngine.moveToLast();
	},
	
	//== Inventory events ==//
	
	inventoryCancel: function () {
		this.state = 0;
		QuestForge.current.game.currentEngine = this;
	},
	
	//== Submenus ==//
	
	initItemsMenu: function () {
		var dialogEngine, view;
		
		dialogEngine = QuestForge.current.dialogEngine;
		view = QuestForge.current.view;
		
		dialogEngine.drawBox(2, 2, 7, 5, true);
		dialogEngine.drawText(3, 4, 'Items');
		
		dialogEngine.drawBox(9, 2, view.conf.width - 11, 5, true);
		
		dialogEngine.drawBox(2, 7, view.conf.width - 4, view.conf.height - 9, true);
		
		QuestForge.current.game.currentEngine = this;
		
		QuestForge.current.inventoryEngine.init({
			inventory: QuestForge.current.game.currentParty.items,
			y: 9,
			numCols: 2,
			enabledChecker: function (item) {
				if (item.menuAbility === null) {
					return false;
				}
				
				if (item.mp > 0) {
					return false;
				}
				
				return true;
			}
		});
	},
	
	initCharacterMenuSelection: function (targetEngine) {
		this.targetEngine = targetEngine;
		this.cursorPositions[0] = this.memberCursorPositions;
		QuestForge.current.cursorEngine.x = 0;
		
		if (this.memberCursorPositions[QuestForge.current.cursorEngine.y[0]] === null) {
			QuestForge.current.cursorEngine.moveToFirst();
		}
	},
};
