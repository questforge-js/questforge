"use strict";

QuestForge.prototype.Job = function (props) {
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('abilities') === false) {
		this.abilities = [null, null, null, null];
	}
	
	// Note: at least levels 1 and this.maxLevel must be defined.
	
	if (props.hasOwnProperty('levels') === false) {
		this.levels = {
			1: {
				strength: 10,
				constitution: 10,
				dexterity: 10,
				wisdom: 10,
			}
		}
		
		this.levels[this.maxLevel] = {
			strength: 200,
			constitution: 200,
			dexterity: 200,
			wisdom: 200,
		};
	}
};

QuestForge.prototype.Job.prototype = {
	id: null,
	
	abilities: null,
	levels: null,
	maxLevel: 99,
	
	hasMp: false,
	canDualWield: false,
	
	//== Functions ==//
	
	getLevelStats: function (level) {
		var nextLevel, nextStats, prevLevel, prevStats, prop, stats, statType;
		
		// Bound the level.
		
		if (level < 1) {
			level = 1;
		}
		else if (level > this.maxLevel) {
			level = this.maxLevel;
		}
		
		if (this.levels[level] !== undefined) {
			// This level was defined explicitly. Return the stats.
			
			return this.levels[level];
		}
		
		// We'll need to extrapolate the stats from surrounding levels.
		
		// Find surrounding levels.
		
		prevLevel = 1;
		nextLevel = this.maxLevel;
		
		for (prop in this.levels) {
			if (this.levels.hasOwnProperty(prop) === true) {
				if (prop < level) {
					if (prop > prevLevel) {
						prevLevel = prop;
					}
				}
				else {
					if (prop < nextLevel) {
						nextLevel = prop;
					}
				}
			}
		}
		
		prevStats = this.levels[prevLevel];
		nextStats = this.levels[nextLevel];
		
		// Extrapolate stat values linearly.
		
		stats = {};
		
		for (statType in prevStats) {
			if (prevStats.hasOwnProperty(statType) === true) {
				stats[statType] = prevStats[statType] + Math.floor((level - prevLevel) * (nextStats[statType] - prevStats[statType]) / (nextLevel - prevLevel));
			}
		}
		
		return stats;
	},
	
	getSecondaryStats: function (character) {
		var secondaryStats;
		
		secondaryStats = {};
		secondaryStats.attack = Math.max(1, (character.baseStats.strength >>> 2) + (character.level >>> 2));
		secondaryStats.defense = 0;
		secondaryStats.hitRating = Math.min(99, 50 + (character.level >>> 2));
		secondaryStats.evade = 50;
		secondaryStats.magicPower = character.baseStats.wisdom;
		secondaryStats.magicBlock = character.baseStats.wisdom >>> 1;
		secondaryStats.speed = character.baseStats.dexterity;
		secondaryStats.maxHp = character.baseStats.constitution * 8;
		secondaryStats.maxMp = (this.hasMp === true ? character.baseStats.wisdom * 3 : 0);
		
		return secondaryStats;
	},
};
