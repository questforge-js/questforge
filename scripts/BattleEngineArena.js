"use strict";

QuestForge.prototype.BattleEngineArena = function (battleEngine) {
	this.engine = battleEngine;
};

QuestForge.prototype.BattleEngineArena.prototype = {
	ability: null,
	item: null,
	sourceState: 0,
	cursor: null,
	cursorOnAll: false,
	
	selectionTick: function () {
		var lineupSlot,
		    input;
		
		input = QuestForge.current.input;
		
		this.engine.progress(true);
		
		if (input.throttledCancel === true) {
			this.engine.cancelArenaSelection();
		}
		else if (input.throttledAction === true) {
			lineupSlot = this.engine.pendingTurns[this.engine.currentTurn];
			
			lineupSlot.pendingAction = new QuestForge.current.BattleAction({
				src: this.engine.pendingTurns[this.engine.currentTurn],
				target: this.cursor,
				targetIsAll: this.cursorOnAll,
				ability: this.ability,
				item: this.item,
				timeRemaining: QuestForge.current.game.settings.battleSpeed * 256
			});
			
			this.engine.pendingActions.push(lineupSlot.pendingAction);
			this.engine.endTurn();
		}
		else if (input.throttledDown === true) {
			if (this.ability.selectionType % 3 < 2) {
				if (this.cursorOnAll === true) {
					this.cursor = this.getFirstSelectableCombatant(this.cursor.side);
				}
				else {
					this.cursor = this.getNextSelectableCombatant(this.cursor);
				}
				
				this.cursorOnAll = false;
			}
		}
		else if (input.throttledUp === true) {
			if (this.ability.selectionType % 3 < 2) {
				if (this.cursorOnAll === true) {
					this.cursor = this.getLastSelectableCombatant(this.cursor.side);
				}
				else {
					this.cursor = this.getPreviousSelectableCombatant(this.cursor);
				}
				
				this.cursorOnAll = false;
			}
		}
		else if (this.engine.battle.fromBehind === false && input.throttledLeft === true || this.engine.battle.fromBehind === true && input.throttledRight === true) {
			// Pressed direction toward the enemies.
			
			if (this.ability.selectionType % 3 > 1) {
				// Can only select all.
				
				this.cursor = this.getLastSelectableCombatant(1);
			}
			else if (this.cursorOnAll === true) {
				// Was selecting all. Switch to single selection.
				
				this.cursor = this.getFirstSelectableCombatant(this.cursor.side);
				this.cursorOnAll = false;
			}
			else if (this.cursor.side === 0) {
				// Was selecting the party. Switch to the enemies.
				
				this.cursor = this.getLastSelectableCombatant(1);
			}
			else {
				// Try to find an enemy in a previous row.
				
				lineupSlot = this.getAdjacentSelectableCombatant(this.cursor, false);
				
				if (lineupSlot === null) {
					// No previous row.
					
					if (this.ability.selectionType % 3 > 0) {
						// Select all enemies.
						
						this.cursorOnAll = true;
					}
				}
				else {
					// Select the enemy in the previous row.
					
					this.cursor = lineupSlot;
				}
			}
		}
		else if (this.engine.battle.fromBehind === false && input.throttledRight === true || this.engine.battle.fromBehind === true && input.throttledLeft === true) {
			// Pressed direction toward the party.
			
			if (this.ability.selectionType % 3 > 1) {
				// Can only select all.
				
				this.cursor = this.getFirstSelectableCombatant(0);
			}
			else if (this.cursorOnAll === true) {
				// Was selecting all. Switch to single selection.
				
				this.cursor = this.getFirstSelectableCombatant(this.cursor.side);
				
				this.cursorOnAll = false;
			}
			else if (this.cursor.side === 0) {
				// Was selecting a party member.
				
				if (this.ability.selectionType % 3 > 0) {
					// Select entire party.
					
					this.cursorOnAll = true;
				}
			}
			else {
				// Try to find an enemy in a next row.
				
				lineupSlot = this.getAdjacentSelectableCombatant(this.cursor, true);
				
				if (lineupSlot === null) {
					// No next row. Select a party member.
					
					this.cursor = this.getFirstSelectableCombatant(0);
				}
				else {
					// Select the enemy in the next row.
					
					this.cursor = lineupSlot;
				}
			}
		}
		
		this.engine.view.drawSprites();
	},
	
	//== Target selection ==//
	
	// Get the nearest selectable enemy index from a row in the specified direction.
	
	getAdjacentSelectableCombatant: function (lineupSlot, isNext) {
		var character, initPosition, initX, initY, match, minDeltaY, x;
		
		minDeltaY = null;
		match = null;
		x = null;
		
		initPosition = lineupSlot.position;
		initX = lineupSlot.arenaX;
		initY = lineupSlot.arenaY;
		
		do {
			if (isNext === true) {
				lineupSlot = this.getNextSelectableCombatant(lineupSlot);
			}
			else {
				lineupSlot = this.getPreviousSelectableCombatant(lineupSlot);
			}
			
			if (x === null && lineupSlot.arenaX !== initX && (isNext === true && lineupSlot.arenaX > initX) || (isNext === false && lineupSlot.arenaX < initX)) {
				x = lineupSlot.arenaX;
			}
			
			if (lineupSlot.arenaX === x) {
				if (match === null || Math.abs(lineupSlot.arenaY - initY) < minDeltaY) {
					match = lineupSlot;
					minDeltaY = Math.abs(lineupSlot.arenaY - initY);
				}
			}
		} while (lineupSlot.position !== initPosition);
		
		return match;
	},
	
	getFirstSelectableCombatant: function (side) {
		var i, lineupSlot;
		
		for (i = 0; i < this.engine.combatants.length; ++i) {
			lineupSlot = this.getSelectableCombatantHelper(i, side);
			
			if (lineupSlot !== null) {
				return lineupSlot;
			}
		}
		
		return null;
	},
	
	getLastSelectableCombatant: function (side) {
		var i, lineupSlot;
		
		for (i = this.engine.combatants.length - 1; i >= 0; --i) {
			lineupSlot = this.getSelectableCombatantHelper(i, side);
			
			if (lineupSlot !== null) {
				return lineupSlot;
			}
		}
		
		return null;
	},
	
	getNextSelectableCombatant: function (refLineupSlot) {
		var i, lineupSlot;
		
		for (i = refLineupSlot.position + 1; i < this.engine.combatants.length; ++i) {
			lineupSlot = this.getSelectableCombatantHelper(i, refLineupSlot.side);
			
			if (lineupSlot !== null) {
				return lineupSlot;
			}
		}
		
		for (i = 0; i <= refLineupSlot.position; ++i) {
			lineupSlot = this.getSelectableCombatantHelper(i, refLineupSlot.side);
			
			if (lineupSlot !== null) {
				return lineupSlot;
			}
		}
		
		return null;
	},
	
	getPreviousSelectableCombatant: function (refLineupSlot) {
		var i, lineupSlot;
		
		for (i = refLineupSlot.position - 1; i >= 0; --i) {
			lineupSlot = this.getSelectableCombatantHelper(i, refLineupSlot.side);
			
			if (lineupSlot !== null) {
				return lineupSlot;
			}
		}
		
		for (i = this.engine.combatants.length - 1; i >= refLineupSlot.position; --i) {
			lineupSlot = this.getSelectableCombatantHelper(i, refLineupSlot.side);
			
			if (lineupSlot !== null) {
				return lineupSlot;
			}
		}
		
		return null;
	},
	
	getSelectableCombatantHelper: function (position, side) {
		var lineupSlot;
		
		lineupSlot = this.engine.combatants[position];
		
		if (lineupSlot.side === side && lineupSlot.isSelectable() === true) {
			return lineupSlot;
		}
		
		return null;
	},
};
