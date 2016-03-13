"use strict";

QuestForge.prototype.BattleEngine = function (props) {
	this.conf = {
		arenaY: 6,
		arenaHeight: 12,
		progressBarWidth: 4,
		dialogTypes: {
			enemyList:   {x:  2, y: 20, width: 12, height: 9},
			partyList:   {x: 14, y: 20, width: 20, height: 9},
			commandMenu: {x: 13, y: 20, width: 11, height: 9},
			itemMenu:    {x:  2, y: 21, width: 32, height: 9, padX: 1},
			skillMenu:   {x:  2, y: 21, width: 32, height: 9},
			skillMp:     {x: 24, y: 22, width:  9, height: 7},
			event:       {x:  4, y:  2, width: 28, height: 4},
		},
		enableActiveTime: false,
		enableEffectsDuringSelection: false,
		enableFromBehind: false,
		enableProgressBar: false,
		cursorSpriteX: 0,
		cursorSpriteY: 0,
		disableString: '\u009f',
		avatarWidth: 2,
		avatarHeight: 3,
		slainStance: 9,
		cheerStance: 5,
		progressPrecision: 256,
		
		// Used in the arena selection while there are other effects.
		conservationCursorSpriteX: 2,
		conservationCursorSpriteY: 0,
		
		// Item skill menu.
		skillItemColWidth: 14,
		skillItemNumCols: 2,
		
		// Other skill menus.
		skillMiscColWidth: 7,
		skillMiscNumCols: 3,
	};
	
	QuestForge.applyProperties(props, this.conf);
	
	this.enemyCounts = {};
	
	this.menus = [];
	this.pendingActions = [];
	this.pendingTurns = [];
	
	this.arena = new QuestForge.current.BattleEngineArena(this);
	this.stringHelper = new QuestForge.current.BattleEngineStringHelper(this);
	this.view = new QuestForge.current.BattleEngineView(this);
};

QuestForge.registerEngine('BattleEngine', ['View']);

QuestForge.prototype.BattleEngine.prototype = {
	conf: null,
	
	arena: null,
	stringHelper: null,
	view: null,
	
	battle: null,
	combatants: null,
	
	state: 0,
	maxProgress: 0,
	biome: 0,
	
	menus: null,
	
	enemyCounts: null,
	numEnemies: 0,
	
	pendingTurns: null,
	currentTurn: 0,
	
	pendingActions: null,
	currentAction: null,
	eventFrame: 0,
	
	//== Initialize a new battle and set the game state to the battle engine ==//
	
	initBattle: function (props) {
		var i, lineup, lineupSlot, maxSpeed,
		    game, view;
		
		game = QuestForge.current.game;
		view = QuestForge.current.view;
		
		this.battle = props.battle;
		this.battle.init(props);
		
		this.combatants = [];
		maxSpeed = 0;
		lineup = this.battle.getPlayerLineup();
		
		for (i = 0; i < lineup.length; ++i) {
			lineupSlot = lineup[i];
			lineupSlot.position = this.combatants.length;
			this.combatants.push(lineupSlot);
			
			if (lineupSlot.character !== null && lineupSlot.character.stats.speed > maxSpeed) {
				maxSpeed = lineupSlot.character.stats.speed;
			}
		}
		
		this.numEnemies = 0;
		this.enemyCounts = {};
		lineup = this.battle.getEnemyLineup();
		
		for (i = 0; i < lineup.length; ++i) {
			lineupSlot = lineup[i];
			lineupSlot.position = this.combatants.length;
			this.combatants.push(lineupSlot);
			
			if (lineupSlot.character !== null) {
				++this.numEnemies;
				
				if (this.enemyCounts[lineupSlot.character.id] === undefined) {
					this.enemyCounts[lineupSlot.character.id] = 1;
				}
				else {
					++this.enemyCounts[lineupSlot.character.id];
				}
				
				if (lineupSlot.character.stats.speed > maxSpeed) {
					maxSpeed = lineupSlot.character.stats.speed;
				}
			}
		}
		
		this.maxProgress = maxSpeed * QuestForge.current.game.settings.battleSpeed * this.conf.progressPrecision;
		
		this.pendingActions = [];
		this.currentAction = null;
		this.biome = (props.hasOwnProperty('biome') === true ? props.biome : 0);
		
		this.menus = [];
		this.pendingTurns = [];
		this.view.effects = [];
		
		this.view.drawBackground(this.biome);
		
		for (i = 0; i < this.combatants.length; ++i) {
			lineupSlot = this.combatants[i];
			
			if (lineupSlot.character !== null) {
				// Randomize turn progress.
				
				lineupSlot.turnProgress = Math.floor(Math.random() * this.maxProgress);
			}
			
			lineupSlot.arenaX = lineupSlot.getInitArenaX();
			lineupSlot.arenaY = lineupSlot.getInitArenaY();
			
			if (lineupSlot.isPortrait === true) {
				this.view.drawPortrait(lineupSlot);
			}
		}
		
		// Finish initialization.
		
		QuestForge.current.game.currentEngine = this;
		this.state = 0;
		
		this.view.drawSprites();
	},
	
	takeOver: function () {
		QuestForge.current.game.currentEngine = this;
	},
	
	//== Tick function ==//
	
	tick: function () {
		var menu;
		
		switch (this.state) {
		case 0: // Expand enemy and player list boxes.
			this.view.expandBox('enemyList', this.stringHelper.getEnemyList());
			this.view.expandBox('partyList', this.stringHelper.getPartyList());
			this.state = 1;
			this.view.drawSprites();
			break;
		
		case 1: // Battle screen loaded.
			this.state = 2;
			this.view.drawSprites();
			break;
		
		case 2: // Waiting for a turn.
			if (this.conf.enableEffectsDuringSelection === true || this.currentAction === null) {
				this.progress(false);
				
				if (this.pendingTurns.length !== 0) {
					// It's a player's turn. Open the command menu.
					
					this.state = 3;
					menu = this.expandMenu('commandMenu', this.stringHelper.getCommandList(this.pendingTurns[this.currentTurn].character));
					
					menu.props = {
						positions: this.getCommandPositions(this.pendingTurns[this.currentTurn].character, 14, 21),
						eventHandler: this,
						spriteX: this.conf.cursorSpriteX,
						spriteY: this.conf.cursorSpriteY
					};
					
					QuestForge.current.cursorEngine.prepare(menu.props);
				}
			}
			else if (this.currentAction !== null) {
				this.actionTick();
			}
			
			this.view.drawSprites();
			break;
		
		case 3: // Command menu is open.
			QuestForge.current.game.currentEngine = QuestForge.current.cursorEngine;
			QuestForge.current.game.currentEngine.tick();
			break;
		
		case 4: // Skill menu is open.
			QuestForge.current.inventoryEngine.initCursor();
			QuestForge.current.cursorEngine.tick();
			break;
		
		case 5: // Selecting a character in the arena.
			this.arena.selectionTick();
			break;
		
		case 6: // Victory.
			if (this.view.effects.length === 0) {
				++this.eventFrame;
				
				if (this.eventFrame >= 24) {
					this.eventFrame = 0;
					this.state = 7;
					this.view.expandBox('event', 'Victory!');
				}
			}
			
			this.view.drawSprites();
			break;
		
		case 7:
			++this.eventFrame;
			
			if (this.eventFrame >= 128) {
				this.eventFrame = 0;
				this.view.contractBox('event');
				this.giveAwards();
				this.state = 8;
			}
			
			this.view.drawSprites();
			break;
		
		case 8:
			QuestForge.current.game.currentEngine = QuestForge.current.mapEngine;
			QuestForge.current.mapEngine.transitionType = 1;
			QuestForge.current.view.draw(QuestForge.current.view.tilesets.overworld, 0, 0, 0, 0, QuestForge.current.view.conf.width, QuestForge.current.view.conf.height);
			break;
		}
	},
	
	actionTick: function () {
		var i;
		
		this.doProgressBar(this.currentAction.src);
		
		if (this.currentAction.ability.battleTick(this.currentAction) === false) {
			// End the action.
			
			this.currentAction.src.stance = null;
			
			for (i = 0; i < this.pendingActions.length; ++i) {
				if (this.pendingActions[i] === this.currentAction) {
					this.pendingActions.splice(i, 1);
					break;
				}
			}
			
			this.currentAction.src.pendingAction = null;
			this.currentAction = null;
			
			if (this.numEnemies === 0) {
				// Victory!
				
				this.takeOver();
				this.state = 6;
			}
		}
	},
	
	//== Dialog events ==//
	
	dialogTick: function () {
		switch (this.state) {
		case 1:
		case 6:
		case 7:
		case 8:
		case 9:
			this.view.drawSprites();
			break;
		
		case 4:
		case 5:
			this.inventoryTick();
			break;
			
		default:
			if (this.conf.enableEffectsDuringSelection === true) {
				this.progress(false);
			}
			
			this.view.drawSprites();
		}
	},
	
	//== Cursor events ==//
	
	cursorAction: function (x, y) {
		var pos, props, skills;
		
		switch (this.state) {
		case 3: // Command menu.
			this.takeOver();
			
			props = this.menus[this.menus.length - 1].props;
			props.x = x;
			props.y = y;
			
			this.useAbility(this.pendingTurns[this.currentTurn].character.job.abilities[y], null);
			break;
		}
	},
	
	cursorCancel: function () {
		var lineupSlot;
		
		switch (this.state) {
		case 3: // Command menu.
			if (this.conf.enableEffectsDuringSelection === true && this.conf.enableActiveTime === true) {
				// Move the queued turn to the end of the list.
				
				this.takeOver();
				this.contractMenu();
				
				if (this.currentTurn < this.pendingTurns.length - 1) {
					++this.currentTurn;
				}
				else {
					this.currentTurn = 0;
				}
				
				this.state = 2;
			}
			else {
				lineupSlot = this.pendingTurns[this.currentTurn];
				this.endTurn();
				lineupSlot.turnProgress = Math.ceil(this.maxProgress / 2);
				
				if (this.conf.enableProgressBar === true && QuestForge.current.game.settings.battleShowProgressBar === true) {
					this.view.drawProgressBar(lineupSlot);
				}
			}
			break;
		}
	},
	
	cursorTick: function () {
		var game;
		
		game = QuestForge.current.game;
		
		switch (this.state) {
		case 3: // Command menu.
			if (this.conf.enableEffectsDuringSelection === true) {
				this.progress(false);
			}
			
			this.view.drawSprites();
			break;
		}
	},
	
	cursorThudUp: function () {
		var cursorEngine;
		
		switch (this.state) {
		case 3: // Command menu.
			QuestForge.current.cursorEngine.moveToLast();
			break;
		}
	},
	
	cursorThudDown: function () {
		switch (this.state) {
		case 3: // Command menu.
			QuestForge.current.cursorEngine.moveToFirst();
			break;
		}
	},
	
	//== Inventory events ==//
	
	inventoryAction: function (item, pos, x, y) {
		var props;
		
		switch (this.state) {
		case 4: // Skill menu.
			this.takeOver();
			
			props = this.menus[this.menus.length - 1].props;
			props.offset = QuestForge.current.inventoryEngine.offset;
			props.cursorX = x;
			props.cursorY = y;
			
			if (this.useAbility(item.battleAbility, item) === false) {
				QuestForge.current.game.currentEngine = QuestForge.current.cursorEngine;
			}
			break;
		}
	},
	
	inventoryCancel: function () {
		switch (this.state) {
		case 4: // Skill menu.
			this.takeOver();
			this.contractMenu();
			break;
		}
	},
	
	inventoryMove: function (item) {
		var dimensions, q;
		
		q = QuestForge.current;
		
		if (q.inventoryEngine.inventory !== q.game.currentParty.items) {
			dimensions = this.conf.dialogTypes.skillMp;
			
			q.dialogEngine.drawText(dimensions.x + (dimensions.width >>> 2) + 1, dimensions.y + dimensions.height - 2, q.game.padLeft(item !== null ? item.mp : '', 3));
		}
	},
	
	inventoryTick: function () {
		if (this.conf.enableEffectsDuringSelection === true) {
			this.progress(true);
		}
		
		this.view.drawSprites();
	},
	
	//== Progress management ==//
	
	progress: function (inSelection) {
		if (this.numEnemies > 0) {
			if (inSelection === false || QuestForge.current.game.settings.battleWaitForSelection === false) {
				if (this.conf.enableActiveTime === true) {
					this.progressActiveTime();
				}
				else {
					this.progressPassiveTime();
				}
			}
			
			if (this.currentAction !== null) {
				this.actionTick();
			}
		}
	},
	
	progressActiveTime: function () {
		var action, i, lineupSlot;
		
		if (this.currentAction === null) {
			// Check for pending actions that are fully ready.
			
			for (i = 0; i < this.pendingActions.length; ++i) {
				action = this.pendingActions[i];
				
				if (action.timeRemaining <= 0 && (this.currentAction === null || action.timeRemaining < this.currentAction.timeRemaining)) {
					this.currentAction = action;
				}
			}
			
			if (this.currentAction === null) {
				// None yet. Progress the pending actions.
				
				for (i = 0; i < this.pendingActions.length; ++i) {
					action = this.pendingActions[i];
					action.timeRemaining -= action.src.character.getSpeed();
					
					if ((this.currentAction === null && action.timeRemaining <= 0) || (this.currentAction !== null && action.timeRemaining < this.currentAction.timeRemaining)) {
						this.currentAction = action;
					}
				}
			}
			
			if (this.currentAction !== null) {
				this.prepareAction(this.currentAction);
			}
		}
		
		if (this.conf.enableEffectsDuringSelection === true || this.currentAction === null) {
			for (i = 0; i < this.combatants.length; ++i) {
				lineupSlot = this.combatants[i];
				
				if (lineupSlot.character !== null && lineupSlot.turnProgress < this.maxProgress && lineupSlot.pendingAction === null) {
					// Increase the character's progress toward the next turn.
					
					lineupSlot.turnProgress += lineupSlot.character.getSpeed() * this.conf.progressPrecision;
					
					if (lineupSlot.turnProgress >= this.maxProgress) {
						if (lineupSlot.side === 0) {
							lineupSlot.turnProgress = this.maxProgress;
							
							this.pendingTurns.push(lineupSlot);
						}
						else {
							// It's the enemy's turn!
							
							this.doEnemyTurn(lineupSlot);
						}
					}
					
					this.doProgressBar(lineupSlot);
				}
			}
		}
	},
	
	progressPassiveTime: function () {
		var action, lineupSlot, nextTimeRemaining,
		    nextAction, nextLineupSlot, timeRemaining,
		    i, speedMultiplier, tempProgress;
		
		if (this.pendingTurns.length > 0 || this.currentAction !== null) {
			// Someone is currently taking a turn. Don't progress.
			return;
		}
		
		// Determine the next pending action to execute.
		
		nextTimeRemaining = null;
		nextAction = null;
		
		for (i = 0; i < this.pendingActions.length; ++i) {
			action = this.pendingActions[i];
			
			timeRemaining = action.timeRemaining / action.src.character.getSpeed();
			
			if (nextTimeRemaining === null || timeRemaining < nextTimeRemaining) {
				nextTimeRemaining = timeRemaining;
				nextAction = action;
			}
		}
		
		// Determine the next character to take a turn.
		
		nextLineupSlot = null;
		
		for (i = 0; i < this.combatants.length; ++i) {
			lineupSlot = this.combatants[i];
			
			if (lineupSlot.pendingAction === null && lineupSlot.character !== null) {
				timeRemaining = (this.maxProgress - lineupSlot.turnProgress) / lineupSlot.character.getSpeed();
				
				if (nextTimeRemaining === null || timeRemaining < nextTimeRemaining) {
					nextTimeRemaining = timeRemaining;
					nextLineupSlot = lineupSlot;
				}
			}
		}
		
		// Apply the progress time to each pending action.
		
		for (i = 0; i < this.pendingActions.length; ++i) {
			action = this.pendingActions[i];
			action.timeRemaining -= Math.ceil(nextTimeRemaining * action.src.character.getSpeed());
			
			if (action.timeRemaining < 0) {
				action.timeRemaining = 0;
			}
		}
		
		// Apply the progress time to each combatant.
		
		for (i = 0; i < this.combatants.length; ++i) {
			lineupSlot = this.combatants[i];
			
			if (lineupSlot.pendingAction === null && lineupSlot.character !== null) {
				lineupSlot.turnProgress += Math.ceil(nextTimeRemaining * lineupSlot.character.getSpeed());
				
				if (lineupSlot.turnProgress > this.maxProgress) {
					lineupSlot.turnProgress = this.maxProgress;
				}
				
				this.doProgressBar(lineupSlot);
			}
		}
		
		if (nextLineupSlot === null) {
			// Start the new action.
			
			nextAction.timeRemaining = 0;
			this.currentAction = nextAction;
			this.prepareAction(this.currentAction);
		}
		else {
			// Start the new turn.
			
			nextLineupSlot.turnProgress = this.maxProgress;
			
			if (nextLineupSlot.side === 0) {
				this.pendingTurns.push(nextLineupSlot);
			}
			else {
				this.doEnemyTurn(nextLineupSlot);
			}
		}
	},
	
	//== Abilities ==//
	
	doEnemyTurn: function (lineupSlot) {
		var i, target, randWeight;
		
		randWeight = 0;
		
		// Calculate the weight sum.
		
		for (i = this.combatants.length - 1; i >= 0; --i) {
			target = this.combatants[i];
			
			if (target.side !== lineupSlot.side && target.isSelectable() === true) {
				randWeight += 1 + target.row;
			}
		}
		
		// Randomize the random weight within the sum.
		
		randWeight = Math.floor(Math.random() * randWeight);
		
		// Find the corresponding party member.
		
		for (i = this.combatants.length - 1; i >= 0; --i) {
			target = this.combatants[i];
			
			if (target.side !== lineupSlot.side && target.isSelectable() === true) {
				randWeight -= 1 + target.row;
				
				if (randWeight < 0) {
					break;
				}
			}
		}
		
		// Add the pending action.
		
		lineupSlot.pendingAction = new QuestForge.current.BattleAction({
			src: lineupSlot,
			target: target,
			ability: lineupSlot.character.job.abilities[0],
		});
		
		this.pendingActions.push(lineupSlot.pendingAction);
		lineupSlot.turnProgress = 0;
	},
	
	prepareAction: function (action) {
		if (action.targetIsAll === true) {
			action.target = QuestForge.current.battleEngine.arena.getLastSelectableCombatant(action.target.side);
		}
		
		action.ability.prepareBattleAction(action);
	},
	
	useAbility: function (ability, item) {
		var dimensions, inventory, lineupSlot, menuName, props,
		    inventoryEngine;
		
		lineupSlot = this.pendingTurns[this.currentTurn];
		
		if (ability.menu === null) {
			// Actionable ability.
			
			if (ability.selectionType === 6) {
				// Targeting self only.
				
				lineupSlot.pendingAction = new QuestForge.current.BattleAction({
					src: lineupSlot,
					target: lineupSlot,
					ability: ability,
					item: item,
				});
				
				this.pendingActions.push(lineupSlot.pendingAction);
				this.endTurn();
				return true;
			}
			else {
				this.arena.cursor = this.arena.getLastSelectableCombatant(1);
				
				if (this.arena.cursor !== null) {
					this.arena.ability = ability;
					this.arena.item = item;
					this.arena.cursorOnAll = (ability.selectionType % 3 > 1);
					this.arena.sourceState = this.state;
					
					this.state = 5;
					return true;
				}
			}
		}
		else {
			// Skill menu or item menu.
			
			if (ability.menu === QuestForge.current.game.conf.itemMenuName) {
				inventory = QuestForge.current.game.currentParty.items;
			}
			else {
				inventory = lineupSlot.character.skills[ability.menu];
			}
			
			if (inventory === undefined) {
				return false;
			}
			
			menuName = (ability.menu === QuestForge.current.game.conf.itemMenuName) ? 'itemMenu' : 'skillMenu';
			dimensions = this.conf.dialogTypes[menuName];
			
			props = {
				inventory: inventory,
				numCols: 2,
				rearrangeable: false,
				width: dimensions.width - 2,
				x: dimensions.x + 2,
				y: dimensions.y + 1,
				spriteX: this.conf.cursorSpriteX,
				spriteY: this.conf.cursorSpriteY,
				disableString: this.conf.disableString,
				enabledChecker: function (item) {
					if (item.battleAbility === null) {
						return false;
					}
					
					if (lineupSlot.character.mp < item.mp) {
						return false;
					}
					
					return true;
				},
			};
			
			if (menuName === 'skillMenu') {
				props.colSpacing = 1;
				props.numCols = 3;
				props.numDisplayThreshold = 100;
				props.x -= 1;
				props.width -= this.conf.dialogTypes.skillMp.width;
			}
			
			this.menus.push({
				dialogType: menuName,
				props: props
			});
			
			inventoryEngine = QuestForge.current.inventoryEngine;
			inventoryEngine.prepare(props);
			this.view.expandBox(menuName, inventoryEngine.getList(), 'battleMenu'+(this.menus.length - 1));
			
			if (ability.menu !== QuestForge.current.game.conf.itemMenuName) {
				this.view.expandBox('skillMp', QuestForge.current.game.padLeft(lineupSlot.character.mp, 3)+'/'+QuestForge.current.game.padLeft(lineupSlot.character.stats.maxMp, 3)+"\nNeed MP\n");
			}
			
			this.state = 4;
			return true;
		}
		
		return false;
	},
	
	applyDamage: function (target, damage) {
		var i, lineupSlot;
		
		if (target.character.hp > damage) {
			target.character.hp -= damage;
		}
		else {
			target.character.hp = 0;
		}
		
		this.view.addEffectNumber(target, damage);
		
		for (i = this.combatants.length - 1; i >= 0; --i) {
			lineupSlot = this.combatants[i];
			
			if (lineupSlot.side === 0 && lineupSlot.character !== null) {
				this.view.drawTextBehindMenus(this.conf.dialogTypes.partyList.x + 10, this.conf.dialogTypes.partyList.y + 1 + (i << 1), QuestForge.current.game.padLeft(lineupSlot.character.hp, 4));
			}
		}
		
		if (target.character.hp === 0) {
			// The target died.
			
			if (target.side === 1) {
				--this.enemyCounts[target.character.id];
				--this.numEnemies;
				//this.view.clearPortrait(target);
				this.view.drawTextBehindMenus(this.conf.dialogTypes.enemyList.x + 1, this.conf.dialogTypes.enemyList.y + 1, this.stringHelper.getEnemyList());
				
				if (target.isPortrait === true) {
					this.view.addEffectDisintegration(target);
				}
			}
			
			this.removeActivity(target);
		}
		
		if (this.numEnemies === 0 && this.currentTurn < this.pendingTurns.length) {
			this.endTurn();
		}
	},
	
	//== Menu management ==//
	
	// Expand a dialog box and add it to the menu stack.
	
	expandMenu: function (dialogType, message) {
		var menu;
		
		menu = {
			dialogType: dialogType
		};
		
		this.menus.push(menu);
		this.view.expandBox(dialogType, message, 'battleMenu'+(this.menus.length - 1));
		return menu;
	},
	
	// Contract a dialog box, remove it from the menu stack, and restore the menu's source battle engine state.
	
	contractMenu: function () {
		var menu;
		
		menu = this.menus.pop();
		this.view.contractBox(menu.dialogType, 'battleMenu'+this.menus.length);
		
		if (this.menus.length > 0) {
			menu = this.menus[this.menus.length - 1];
			
			switch (menu.dialogType) {
			case 'commandMenu':
				QuestForge.current.cursorEngine.prepare(menu.props);
				this.state = 3;
				break;
			
			case 'itemMenu':
			case 'skillMenu':
				QuestForge.current.inventoryEngine.prepare(menu.props);
				this.state = 4;
				break;
			}
			
			return menu;
		}
		
		return null;
	},
	
	//== Position builders ==//
	
	getCommandPositions: function (character, x, y) {
		var i, positions;
		
		positions = [];
		
		for (i = 0; i < character.job.abilities.length; ++i) {
			if (character.job.abilities[i] === null) {
				positions.push(null);
			}
			else {
				positions.push([x, y + i * 2]);
			}
		}
		
		return positions;
	},
	
	//== Miscellaneous ==//
	
	doProgressBar: function (lineupSlot) {
		if (this.conf.enableProgressBar === true && QuestForge.current.game.settings.battleShowProgressBar === true && lineupSlot.side === 0) {
			this.view.drawProgressBar(lineupSlot);
		}
	},
	
	giveAwards: function () {
		var i, combatant, party, gold, xp;
		
		gold = 0;
		xp = 0;
		
		for (i = 0; i < this.combatants.length; ++i) {
			combatant = this.combatants[i];
			
			if (combatant.side === 1) {
				gold += combatant.character.goldAward;
				xp += combatant.character.xpAward;
			}
		}
		
		party = QuestForge.current.game.currentParty;
		party.giveGold(gold);
		xp = Math.ceil(xp / party.members.length);
		
		for (i = 0; i < party.members.length; ++i) {
			party.members[i].xp += xp;
			
			// TODO: Handle level ups.
		}
		
		this.view.dialog('Gained '+gold+' gold.');
		this.view.dialog('Gained '+xp+' experience.');
	},
	
	endTurn: function () {
		this.takeOver();
		this.removePendingTurn(this.currentTurn);
		
		while (this.menus.length > 0) {
			this.contractMenu();
		}
		
		this.state = 2;
	},
	
	removePendingTurn: function (turn) {
		var lineupSlot;
		
		lineupSlot = this.pendingTurns[turn];
		
		lineupSlot.turnProgress = 0;
		
		if (this.conf.enableProgressBar === true && QuestForge.current.game.settings.battleShowProgressBar === true) {
			this.view.drawProgressBar(lineupSlot);
		}
		
		this.pendingTurns.splice(turn, 1);
		
		if (this.currentTurn > turn) {
			--this.currentTurn;
		}
		else if (this.currentTurn === turn && this.currentTurn >= this.pendingTurns.length) {
			this.currentTurn = 0;
		}
	},
	
	removeActivity: function (lineupSlot) {
		var action, i;
		
		if (lineupSlot.side === 0) {
			// Remove any pending turns for this character.
			
			for (i = 0; i < this.pendingTurns.length; ++i) {
				if (this.pendingTurns[i] === lineupSlot) {
					if (i === this.currentTurn) {
						this.endTurn();
					}
					else {
						this.removePendingTurn(i);
					}
				}
			}
		}
		
		// Reset the character's turn progress.
		
		lineupSlot.turnProgress = 0;
		
		// Remove or adjust all pending actions associated with this character.
		
		for (i = 0; i < this.pendingActions.length; ++i) {
			action = this.pendingActions[i];
			
			if (action !== this.currentAction) {
				if (action.src.side === lineupSlot.side && action.src.position === lineupSlot.position) {
					// Action from this character. Cancel the action.
					
					action.src.pendingAction = null;
					this.pendingActions.splice(i, 1);
					--i;
				}
				else if (action.target.side === lineupSlot.side && action.target.position === lineupSlot.position) {
					// Action directed at this character. Retarget the action.
					
					action.target = this.arena.getPreviousSelectableCombatant(action.target);
					
					if (action.target === null || action.target.position === lineupSlot.position) {
						// There's no one left to retarget to. Cancel the action.
						
						action.src.pendingAction = null;
						this.pendingActions.splice(i, 1);
						--i;
					}
				}
			}
		}
		
		if (this.state === 5 && this.arena.cursor === lineupSlot) {
			// Currently selecting this character. Retarget the selection.
			
			this.arena.cursor = this.arena.getPreviousSelectableCombatant(lineupSlot);
			
			if (this.arena.cursor === null || this.arena.cursor.position === lineupSlot.position) {
				// There's no one left to retarget to. Cancel out of selection.
				
				this.cancelArenaSelection();
			}
		}
	},
	
	cancelArenaSelection: function () {
		this.state = this.arena.sourceState;
		
		if (this.state === 3) {
			QuestForge.current.cursorEngine.prepare(this.menus[this.menus.length - 1].props);
		}
		else {
			QuestForge.current.inventoryEngine.prepare(this.menus[this.menus.length - 1].props);
		}
	},
};
