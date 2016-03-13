"use strict";

QuestForge.prototype.Game = function (props) {
	QuestForge.applyProperties(props, this.conf);
	
	this.abilities = [];
	this.battles = [];
	this.characters = [];
	this.items = [];
	this.jobs = [];
	this.maps = [];
	this.parties = [];
	this.vehicles = [];
	
	this.flags = {};
	this.settings = {
		battleShowEnemyCounts: false,
		battleShowProgressBar: true,
		battleSpeed: 1,
		battleUseLineupPerspective: false,
		battleWaitForSelection: true
	};
	
	QuestForge.current.symbols = {
		//== HTML entities ==//
		
		apos: '\'',
		boxdL: '\u0092',
		boxDl: '\u0099',
		boxDR: '\u0090',
		boxdr: '\u0098',
		boxH: '\u0091',
		boxh: '\u0096',
		boxul: '\u0097',
		boxUL: '\u009b',
		boxuR: '\u009a',
		boxUr: '\u0095',
		boxV: '\u0093',
		boxv: '\u0094',
		Cross: '\u009f',
		cross: '\u009f',
		hellip: '\u0081',
		ldquo: '\u0080',
		lsquo: '`',
		rdquo: '"',
		rsquo: '\'',
		
		//== Custom names ==//
		
		// Standard Unicode symbols.
		
		lbrace: '{',
		rbrace: '}',
		
		// Progress bar.
		
		progl0: '\u00a0',
		progl14: '\u00a3',
		progl12: '\u00a6',
		progl34: '\u00a9',
		progl: '\u00ac',
		Progl: '\u009c',
		prog0: '\u00a1',
		prog14: '\u00a4',
		prog12: '\u00a7',
		prog34: '\u00aa',
		prog: '\u00ad',
		Prog: '\u009d',
		progr0: '\u00a2',
		progr14: '\u00a5',
		progr12: '\u00a8',
		progr34: '\u00ab',
		progr: '\u00ae',
		Progr: '\u009e',
		
		// Items and spells.
		
		potion: '\u00b0',
		tent: '\u00b1',
		pouch: '\u00b2',
		key: '\u00b3',
		book: '\u00b4',
		crystal: '\u00b5',
		wmagic: '\u00b6',
		gmagic: '\u00b7',
		bmagic: '\u00b8',
		spirit: '\u00b9',
		song: '\u00ba',
		monster: '\u00bb',
		holy: '\u00bc',
		
		// Armor.
		
		tunic: '\u00c0',
		armor: '\u00c1',
		pants: '\u00c2',
		armorpants: '\u00c3',
		cap: '\u00c4',
		helmet: '\u00c5',
		boot: '\u00c6',
		shield: '\u00c7',
		cape: '\u00c8',
		glove: '\u00c9',
		belt: '\u00ca',
		ring: '\u00cb',
		necklace: '\u00cc',
		bow: '\u00cd',
		
		// Blades.
		
		knife: '\u00d0',
		sword1: '\u00d1',
		sword2: '\u00d2',
		sword3: '\u00d3',
		rapier: '\u00d4',
		katana: '\u00d5',
		thinsword: '\u00d6',
		scimitar: '\u00d7',
		powersword: '\u00d8',
		
		// Other weapons.
		
		staff: '\u00e0',
		rod: '\u00e1',
		quarterstaff: '\u00e2',
		lance: '\u00e3',
		hammer: '\u00e4',
		axe: '\u00e5',
		wrench: '\u00e6',
		nunchucks: '\u00e7',
		whip: '\u00e8',
		claw: '\u00e9',
		boomerang: '\u00ea',
		bow: '\u00eb',
		arrow: '\u00ec',
		shuriken: '\u00ed',
		bomb: '\u00ee',
		
		// Status effects.
		
		petrify: '\u00f0',
		silence: '\u00f1',
		blind: '\u00f2',
		poison: '\u00f3',
		float: '\u00f4',
		paralyze: '\u00f5',
		sleep: '\u00f6',
		confuse: '\u00f7',
	};
};

QuestForge.registerEngine('Game', []);

QuestForge.prototype.Game.prototype = {
	conf: {
		frameInterval: 33,
		partyInventorySize: 256,
		skillInventorySize: 64,
		
		// When an ability is a menu referencing this value,
		// treat it as pointing to the party's item inventory
		// instead of the character's skill inventory.
		itemMenuName: 'items',
	},
	
	currentEngine: null,
	
	autoSpeed: true,
	lastFrameTime: null,
	skippedFrame: false,
	
	// This loops from 0 through 32767.
	ticksElapsed: 0,
	
	// These values are calculated by incrementing the milliseconds
	// by the frameInterval after each tick. Inaccuracy can result
	// due to sub-millisecond lags, or any lag when autoSpeed is off.
	// Once the hours are 999 and the minutes are 59, the hours and
	// minutes stop incrementing.
	hoursPlayed: 0,
	minutesPlayed: 0,
	secondsPlayed: 0,
	millisecondsPlayed: 0,
	
	abilities: null,
	battles: null,
	characters: null,
	items: null,
	jobs: null,
	maps: null,
	parties: null,
	vehicles: null,
	
	currentParty: null,
	
	flags: null,
	settings: null,
	
	//== Functions ==//
	
	addAbility: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.Ability, this.abilities, props);
	},
	
	addBattle: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.Battle, this.battles, props);
	},
	
	addCharacter: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.Character, this.characters, props);
	},
	
	addEnemy: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.Character, this.characters, props, {
			isPlayable: false
		});
	},
	
	addItem: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.Item, this.items, props);
	},
	
	addJob: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.Job, this.jobs, props);
	},
	
	addMap: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.Map, this.maps, props);
	},
	
	addParty: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.Party, this.parties, props);
	},
	
	addVehicle: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.Vehicle, this.vehicles, props);
	},
	
	// Attempts to add an item to the first null entry in an array.
	
	addToInventory: function (inventory, item) {
		var i;
		
		for (i = 0; i < inventory.length; ++i) {
			if (inventory[i] === null) {
				inventory[i] = item;
				
				return true;
			}
		}
		
		// Inventory is full.
		
		return false;
	},
	
	createInventory: function (size) {
		var i, inventory;
		
		inventory = [];
		
		inventory.length = size;
		
		// Set all values to null.
		
		for (i = 0; i < size; ++i) {
			inventory[i] = null;
		}
		
		return inventory;
	},
	
	recalculateCharacterStats: function () {
		var i;
		
		for (i = 0; i < this.characters.length; ++i) {
			this.characters[i].updateBaseStats();
		}
	},
	
	findMatchingProperty: function (object, value, property) {
		var i;
		
		if (object instanceof Array) {
			return object.indexOf(value);
		}
		
		for (i in object) {
			if (object.hasOwnProperty(i) === true && (property === undefined ? object[i] === value : object[i][property] === value)) {
				return i;
			}
		}
		
		return -1;
	},
	
	getPositiveIntDigits: function (integer) {
		var i, numDigits;
		
		numDigits = 1;
		
		for (i = 10; i <= integer; i *= 10) {
			++numDigits;
		}
		
		return numDigits;
	},
	
	padLeft: function (str, size, padChar) {
		var i, padding;
		
		if (padChar === undefined) {
			padChar = ' ';
		}
		
		str = str.toString();
		
		padding = '';
		
		for (i = size - str.length; i > 0; --i) {
			padding += padChar;
		}
		
		return padding+str;
	},
	
	padRight: function (str, size, padChar) {
		var i, padding;
		
		if (padChar === undefined) {
			padChar = ' ';
		}
		
		str = str.toString();
		
		padding = '';
		
		for (i = size - str.length; i > 0; --i) {
			padding += padChar;
		}
		
		return str+padding;
	},
	
	save: function () {
		var data, i, j, k, member, source, submember, subsource;
		
		data = {
			currentParty: this.serialize(this.currentParty),
			hoursPlayed: this.hoursPlayed,
			minutesPlayed: this.minutesPlayed,
			secondsPlayed: this.secondsPlayed,
			millisecondsPlayed: this.millisecondsPlayed,
			flags: this.flags,
			settings: this.settings,
			characters: [],
			parties: [],
			warps: [],
		};
		
		// Populate the characters.
		
		for (i = 0; i < this.characters.length; ++i) {
			source = this.characters[i];
			
			if (source.isPlayable === true) {
				member = {
					id: source.id,
					name: source.name,
					level: source.level,
					xp: source.xp,
					hp: source.hp,
					mp: source.mp,
					job: source.job.id,
					skills: {},
					equipment: {
						lHand: this.serialize(source.equipment.lHand),
						rHand: this.serialize(source.equipment.rHand),
						head: this.serialize(source.equipment.head),
						body: this.serialize(source.equipment.body),
						arms: this.serialize(source.equipment.arms),
						access1: this.serialize(source.equipment.access1),
						access2: this.serialize(source.equipment.access2),
					},
				};
				
				// Populate the character's skills.
				
				for (j in source.skills) {
					if (source.skills.hasOwnProperty(j)) {
						member.skills[j] = this.serialize(source.skills[j]);
					}
				}
				
				data.characters.push(member);
			}
		}
		
		// Populate the parties.
		
		for (i = 0; i < this.parties.length; ++i) {
			source = this.parties[i];
			
			member = {
				gold: source.gold,
				items: this.serialize(source.items),
				leader: this.serialize(source.leader),
				lineup: [],
			};
			
			for (j = 0; j < source.lineup.length; ++j) {
				subsource = source.lineup[j];
				
				submember = {
					character: this.serialize(subsource.character),
					row: subsource.row,
				};
				
				member.lineup.push(submember);
			}
			
			data.parties.push(member);
		}
		
		// Populate the warps.
		
		source = QuestForge.current.mapEngine.warps;
		
		for (i = 0; i < source.length; ++i) {
			subsource = source[i];
			
			member = {
				map: this.serialize(subsource.map),
				x: subsource.x,
				y: subsource.y,
				vehicle: this.serialize(subsource.vehicle),
			};
			
			data.warps.push(member);
		}
		
		// Add current map to warps.
		
		source = QuestForge.current.mapEngine;
		
		member = {
			map: this.serialize(source.currentMap),
			x: source.player.x,
			y: source.player.y,
			vehicle: this.serialize(source.player.currentVehicle),
		};
		
		data.warps.push(member);
		
		localStorage.setItem('QuestForgeSave001', JSON.stringify(data));
	},
	
	setCurrentParty: function (party) {
		this.currentParty = party;
		
		QuestForge.current.mapEngine.player.tileY = party.leader.character.mapSprite;
	},
	
	tick: function () {
		var date, lateness,
		    inputEngine, view;
		
		inputEngine = QuestForge.current.inputEngine;
		view = QuestForge.current.view;
		
		do {
			if (this.currentEngine !== null) {
				inputEngine.tick();
			}
			
			if (this.autoSpeed === true) {
				if (lateness === undefined) {
					if (this.lastFrameTime === null) {
						lateness = 0;
						
						this.lastFrameTime = (new Date()).getTime();
					}
					else {
						date = (new Date()).getTime();
						
						lateness = date - this.lastFrameTime;
					}
				}
				
				this.lastFrameTime += this.conf.frameInterval;
				
				if (lateness < this.conf.frameInterval) {
					QuestForge.setTimeout(QuestForge.tick, this.conf.frameInterval - lateness, QuestForge.current);
					this.skippedFrame = false;
				}
				else {
					this.skippedFrame = true;
					
					lateness -= this.conf.frameInterval;
				}
			}
			else {
				QuestForge.setTimeout(QuestForge.tick, this.conf.frameInterval, QuestForge.current);
				
				this.skippedFrame = false;
			}
			
			if (this.currentEngine !== null) {
				this.currentEngine.tick();
				
				if (this.ticksElapsed === 32767) {
					this.ticksElapsed = 0;
				}
				else {
					++this.ticksElapsed;
				}
				
				this.millisecondsPlayed += this.conf.frameInterval;
				
				while (this.millisecondsPlayed > 999) {
					this.millisecondsPlayed -= 999;
					++this.secondsPlayed;
					
					if (this.secondsPlayed > 59) {
						this.secondsPlayed = 0;
						++this.minutesPlayed;
						
						if (this.minutesPlayed > 59 && this.hoursPlayed < 999) {
							this.minutesPlayed = 0;
							++this.hoursPlayed;
						}
					}
				}
				
				if (this.skippedFrame === true) {
					view.skippedFrameTick();
				}
			}
		} while (this.skippedFrame === true);
		
		if (this.currentEngine !== null) {
			view.tick();
		}
	},
	
	serialize: function (entry) {
		var arr, i;
		
		if (entry === null) {
			return null;
		}
		
		if (entry.id !== undefined && entry.id !== null) {
			return entry.id;
		}
		
		if (entry.items !== undefined) {
			// Assume this is an inventory.
			
			arr = new Array(entry.items.length);
			
			for (i = arr.length - 1; i >= 0; --i) {
				if (entry.items[i] === null) {
					arr[i] = null;
				}
				else {
					arr[i] = [entry.items[i].item.id, entry.items[i].num];
				}
			}
			
			return arr;
		}
		
		return null;
	},
};
