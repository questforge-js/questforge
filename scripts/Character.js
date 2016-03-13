"use strict";

QuestForge.prototype.Character = function (props) {
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('flashPortraitY') === false) {
		this.flashPortraitY = this.portraitY;
	}
	
	if (props.hasOwnProperty('equipment') === false) {
		this.equipment = {
			lHand: new QuestForge.current.Inventory({length: 1}),
			rHand: new QuestForge.current.Inventory({length: 1}),
			head: new QuestForge.current.Inventory({length: 1}),
			body: new QuestForge.current.Inventory({length: 1}),
			arms: new QuestForge.current.Inventory({length: 1}),
			feet: new QuestForge.current.Inventory({length: 1}),
			access1: new QuestForge.current.Inventory({length: 1}),
			access2: new QuestForge.current.Inventory({length: 1}),
		};
	}
	
	if (props.hasOwnProperty('loot') === false) {
		this.loot = [];
	}
	
	if (props.hasOwnProperty('skills') === false) {
		this.skills = {};
	}
	
	if (props.hasOwnProperty('baseStats') === false) {
		this.baseStats = {};
	}
	
	if (props.hasOwnProperty('stats') === false) {
		this.stats = {};
	}
	
	if (props.hasOwnProperty('effects') === false) {
		this.effects = {
			asleep: false,
			berserk: false,
			blind: false,
			confused: false,
			fast: false,
			paralyzed: false,
			petrified: false,
			poisoned: false,
			regen: false,
			reflect: false,
			silenced: false,
			slow: false,
		};
	}
	
	if (props.hasOwnProperty('job') === false) {
		this.job = QuestForge.current.game.jobs[0];
	}
	
	this.setLevel(this.level);
	
	if (props.hasOwnProperty('hp') === false) {
		this.hp = this.stats.maxHp;
	}
	
	if (props.hasOwnProperty('mp') === false) {
		this.mp = this.stats.maxMp;
	}
};

QuestForge.prototype.Character.prototype = {
	id: null,
	
	name: '',
	
	isPlayable: true, // Only controls whether the character's information is included in save data.
	
	portraitX: 0,
	portraitY: 0,
	portraitWidth: 4,
	portraitHeight: 4,
	flashPortraitX: 0,
	flashPortraitY: null,
	
	// Stats
	
	level: 1,
	xp: 0,
	
	hp: 0,
	mp: 0,
	
	baseStats: null,
	effects: null,
	equipment: null,
	job: null,
	skills: null,
	stats: null,
	
	// Party members
	
	mapSprite: 0,
	battleSprite: 0,
	
	// Enemies
	
	goldAward: 0,
	xpAward: 0,
	loot: null,
	
	canDualWield: function () {
		return this.job.canDualWield;
	},
	
	//== Modification ==//
	
	prepareSkillType: function (skillType) {
		if (this.skills[skillType] === undefined) {
			this.skills[skillType] = new QuestForge.current.Inventory({
				length: QuestForge.current.game.conf.skillInventorySize,
			});
		}
	},
	
	addSkill: function (skillType, skill) {
		this.prepareSkillType(skillType);
		this.skills[skillType].add(skill);
	},
	
	equip: function (equipSlot, item) {
		
	},
	
	//== Dynamic stats ==//
	
	getEvadeChances: function () {
		return (this.stats.dexterity >>> 3);
	},
	
	getHitChances: function () {
		return (this.stats.strength >>> 3) + (this.stats.dexterity >>> 4) + 1;
	},
	
	getSpeed: function () {
		if (this.hp === 0) {
			return 0;
		}
		
		return this.stats.speed;
	},
	
	getStance: function () {
		if (this.hp === 0) {
			// Slain.
			return QuestForge.current.battleEngine.conf.slainStance;
		}
		else if (this.hp * 4 <= this.stats.maxHp) {
			// Weak.
			return 4;
		}
		
		// Normal.
		return 0;
	},
	
	setLevel: function (level) {
		if (level < 1) {
			level = 1;
		}
		else if (level > this.job.maxLevel) {
			level = this.job.maxLevel;
		}
		
		this.baseStats = this.job.getLevelStats(level);
		this.level = level;
		this.updateBaseStats();
	},
	
	// Raise the character's level and apply the delta of the job's
	// primary base stats for those levels. Then, recalculate
	// secondary base stats and final stats.
	
	levelUp: function (numLevels) {
		var postJobStats, preJobStats, statType;
		
		if (numLevels === undefined) {
			numLevels = 1;
		}
		
		if (this.level + numLevels > this.job.maxLevel) {
			numLevels = this.job.maxLevel - this.level;
		}
		
		preJobStats = this.job.getLevelStats(this.level);
		postJobStats = this.job.getLevelStats(this.level + numLevels);
		
		for (statType in postJobStats) {
			if (postJobStats.hasOwnProperty(statType)) {
				if (this.baseStats[statType] === undefined) {
					this.baseStats[statType] = postJobStats[statType];
				}
				else {
					this.baseStats[statType] = postJobStats[statType] - preJobStats[statType];
				}
			}
		}
		
		this.level += numLevels;
		this.updateBaseStats();
	},
	
	// Apply the job's secondary base stats from primary base stats
	// and then update the final stats.
	
	updateBaseStats: function () {
		var secondaryStats, statType;
		
		secondaryStats = this.job.getSecondaryStats(this);
		
		for (statType in secondaryStats) {
			if (secondaryStats.hasOwnProperty(statType)) {
				this.baseStats[statType] = secondaryStats[statType];
			}
		}
		
		this.updateStats();
		
		// Limit HP and MP to the maximums.
		
		if (this.hp > this.stats.maxHp) {
			this.hp = this.stats.maxHp;
		}
		
		if (this.mp > this.stats.maxMp) {
			this.mp = this.stats.maxMp;
		}
	},
	
	// Update final stats (from combining the equipment stats with
	// the existing base stats).
	
	updateStats: function () {
		var equipSlot, item, statType;
		
		for (statType in this.baseStats) {
			if (this.baseStats.hasOwnProperty(statType)) {
				this.stats[statType] = this.baseStats[statType];
				
				for (equipSlot in this.equipment) {
					if (this.equipment.hasOwnProperty(equipSlot)) {
						if (this.equipment[equipSlot].num(0) > 0) {
							item = this.equipment[equipSlot].item(0);
							
							if (item.stats[statType] !== undefined) {
								this.stats[statType] += item.stats[statType];
							}
						}
					}
				}
				
				if (this.stats[statType] > 255) {
					this.stats[statType] = 255;
				}
				else if (this.stats[statType] < 0) {
					this.stats[statType] = 0;
				}
				else {
					switch (statType) {
					case 'evade':
					case 'hitRating':
						if (this.stats[statType] > 99) {
							this.stats[statType] = 99;
						}
						break;
					}
				}
			}
		}
	},
};
