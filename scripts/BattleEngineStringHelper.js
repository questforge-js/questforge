"use strict";

QuestForge.prototype.BattleEngineStringHelper = function (battleEngine) {
	this.engine = battleEngine;
};

QuestForge.prototype.BattleEngineStringHelper.prototype = {
	engine: null,
	
	// Get the list of commands (top-level abilities) available for a character.
	
	getCommandList: function (character) {
		var ability, i, str;
		
		str = '';
		
		for (i = 0; i < character.job.abilities.length; ++i) {
			ability = character.job.abilities[i];
			
			if (ability !== null) {
				str += ability.name;
			}
			
			str += "\n";
		}
		
		return str;
	},
	
	// Get the list of enemy names, one line per enemy type.
	
	getEnemyList: function () {
		var i, j, line, str, width;
		
		width = this.engine.conf.dialogTypes.enemyList.width - 2;
		str = '';
		j = 0;
		
		for (i in this.engine.enemyCounts) {
			if (this.engine.enemyCounts.hasOwnProperty(i) && this.engine.enemyCounts[i] > 0) {
				line = QuestForge.current.game.characters[i].name;
				
				if (QuestForge.current.game.settings.battleShowEnemyCounts === true) {
					if (this.engine.enemyCounts[i] > 1) {
						line += ' ('+this.engine.enemyCounts[i]+')';
					}
				}
				
				// Pad the line to fill the width of the box.
				
				str += QuestForge.current.game.padRight(line, width)+'\n';
				++j;
			}
		}
		
		// Pad fill the rest of the box.
		
		line = QuestForge.current.game.padRight('', width)+'\n';
		
		for (j = ((this.engine.conf.dialogTypes.enemyList.height - 2) >>> 1) - j; j >= 0; --j) {
			str += line;
		}
		
		return str;
	},
	
	// Get the list of party members, with displayed stats.
	
	getPartyList: function () {
		var character, i, lineupSlot, str;
		
		str = '';
		
		for (i = 0; i < this.engine.combatants.length; ++i) {
			lineupSlot = this.engine.combatants[i];
			
			if (lineupSlot.side === 0) {
				character = lineupSlot.character;
				
				if (character !== null) {
					str += QuestForge.current.game.padRight(QuestForge.current.dialogEngine.escapeText(character.name), 9)+QuestForge.current.game.padLeft(character.hp, 4);
					
					if (this.engine.conf.enableProgressBar === true && QuestForge.current.game.settings.battleShowProgressBar === true) {
						str += ' '+this.getProgressBar(lineupSlot);
					}
					else {
						str += '/'+QuestForge.current.game.padLeft(character.stats.maxHp, 4);
					}
				}
				
				str += "\n";
			}
		}
		
		return str;
	},
	
	getProgressBar: function (lineupSlot) {
		var chr, i, remainder, str, x;
		
		remainder = this.engine.conf.progressBarWidth * lineupSlot.turnProgress / this.engine.maxProgress;
		x = Math.floor(remainder);
		remainder = Math.floor((remainder - x) * 4);
		
		str = '';
		
		for (i = 0; i < this.engine.conf.progressBarWidth; ++i) {
			if (i === 0) {
				chr = 0;
			}
			else if (i < this.engine.conf.progressBarWidth - 1) {
				chr = 1;
			}
			else {
				chr = 2;
			}
			
			if (lineupSlot.pendingAction !== null) {
				chr += 12;
			}
			else if (i === x) {
				chr += 16 + remainder * 3;
			}
			else if (i < x) {
				chr += 28;
			}
			else {
				chr += 16;
			}
			
			str += String.fromCharCode(chr + 144);
		}
		
		return str;
	},
};
