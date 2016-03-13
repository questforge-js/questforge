"use strict";

QuestForge.prototype.SkillScreenEngine = function (props) {
	this.conf = {
	};
	
	QuestForge.applyProperties(props, this.conf);
};

QuestForge.registerEngine('SkillScreenEngine', []);

QuestForge.prototype.SkillScreenEngine.prototype = {
	conf: null,
	
	character: null,
	cursorPositions: null,
	
	init: function (character) {
		var ability, hasUsableSkills,
		    i, x, y,
		    dialogEngine, view;
		
		dialogEngine = QuestForge.current.dialogEngine;
		view = QuestForge.current.view;
		
		this.character = character;
		
		// Clear screen.
		view.draw(view.tilesets.dialog, 0, 0, 2, 2, view.conf.width - 4, view.conf.height - 4);
		
		// Character portrait.
		view.drawRegion(view.tilesets.portraits, character.portraitX, character.portraitY, character.portraitWidth, character.portraitHeight, 3, 5 - (character.portraitHeight >>> 1));
		
		// Inventory box.
		dialogEngine.drawBox(2, 13, view.conf.width - 4, view.conf.height - 15, true);
		
		// Character summary box.
		dialogEngine.drawBox(8, 2, view.conf.width - 10, 6, true);
		dialogEngine.drawText(9, 3, QuestForge.current.mainMenuEngine.getCharacterSummary(character), 1);
		
		// "Skills" title box.
		dialogEngine.drawBox(2, 9, view.conf.width - 26, 5, true);
		dialogEngine.drawText(4, 11, 'Skills');
		
		// "Need MP" box.
		dialogEngine.drawBox(view.conf.width - 24, 9, 11, 5, true);
		
		// Skill type selection box.
		dialogEngine.drawBox(view.conf.width - 13, 2, 11, 12, true);
		
		// Draw skill list.
		
		this.cursorPositions = [[]];
		hasUsableSkills = false;
		
		for (i = 0; i < character.job.abilities.length; ++i) {
			ability = character.job.abilities[i];
			
			if (ability === null) {
				this.cursorPositions[0].push(null);
			}
			else if (this.skillTypeIsUsable(ability)) {
				dialogEngine.drawText(view.conf.width - 12, 4 + i * 2, ability.name);
				hasUsableSkills = true;
				
				this.cursorPositions[0].push([
					view.conf.width - 12,
					4 + i * 2,
				]);
			}
			else {
				dialogEngine.drawText(view.conf.width - 12, 4 + i * 2, dialogEngine.getDisabledText(ability.name));
				this.cursorPositions[0].push(null);
			}
		}
		
		if (hasUsableSkills === false) {
			this.cursorPositions[0].push([0, 0]);
			
			dialogEngine.drawText((view.conf.width - 17) >>> 1, (9 + view.conf.height) >>> 1, 'No usable skills.');
		}
		else {
			dialogEngine.drawText(view.conf.width - 22, 10, 'Need MP');
		}
		
		this.initCursor();
		return true;
	},
	
	tick: function () {
	},
	
	initCursor: function () {
		this.inventoryMove(null);
		QuestForge.current.game.currentEngine = this;
		
		QuestForge.current.cursorEngine.init({
			positions: this.cursorPositions,
			y: (this.cursorPositions[0].length > this.character.job.abilities.length ? [this.cursorPositions[0].length - 1] : undefined),
		});
		
		this.updateInventoryList();
	},
	
	updateInventoryList: function () {
		var ability, y;
		
		y = QuestForge.current.cursorEngine.y[QuestForge.current.cursorEngine.x];
		ability = this.character.job.abilities[y];
		
		if (this.skillTypeIsUsable(ability) === true) {
			this.character.prepareSkillType(ability.menu);
			
			QuestForge.current.inventoryEngine.prepare({
				eventHandler: this,
				inventory: this.character.skills[ability.menu],
				x: 5,
				y: 15,
				width: QuestForge.current.view.conf.width - 7,
				numCols: 3,
				numDisplayThreshold: 100,
				enabledChecker: function (item) {
					if (item.menuAbility === null) {
						return false;
					}
					
					if (QuestForge.current.skillScreenEngine.character.mp < item.mp) {
						return false;
					}
					
					return true;
				},
			});
			
			QuestForge.current.inventoryEngine.drawList();
		}
	},
	
	//== Cursor events ==//
	
	cursorAction: function (x, y) {
		var ability;
		
		QuestForge.current.soundEngine.play('sfx-cursor');
		ability = this.character.job.abilities[y];
		
		if (this.skillTypeIsUsable(ability) === true) {
			QuestForge.current.inventoryEngine.initCursor();
		}
		else {
			this.cursorCancel();
		}
	},
	
	cursorCancel: function () {
		QuestForge.current.soundEngine.play('sfx-cursor');
		QuestForge.current.mainMenuEngine.state = 0;
		QuestForge.current.game.currentEngine = QuestForge.current.mainMenuEngine;
	},
	
	cursorMove: function (x, y) {
		this.updateInventoryList();
	},
	
	cursorThudDown: function () {
		QuestForge.current.cursorEngine.moveToFirst();
	},
	
	cursorThudUp: function () {
		QuestForge.current.cursorEngine.moveToLast();
	},
	
	//== Inventory events ==//
	
	inventoryCancel: function () {
		QuestForge.current.soundEngine.play('sfx-cursor');
		this.initCursor();
	},
	
	inventoryMove: function (item) {
		var q;
		
		q = QuestForge.current;
		q.dialogEngine.drawText(q.view.conf.width - 20, 12, q.game.padLeft(item !== null ? item.mp : '', 3));
	},
	
	inventorySwap: function (item) {
		this.inventoryMove(item);
	},
	
	//== Miscellaneous ==//
	
	skillTypeIsUsable: function (ability) {
		return (ability !== undefined && ability !== null && ability.menu !== null && ability.menu !== QuestForge.current.game.conf.itemMenuName);
	},
};
