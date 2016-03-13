"use strict";

QuestForge.prototype.Custom = function () {
	var match;
	
	this.abilities = {};
	this.battles = {};
	this.chars = {};
	this.enemies = {};
	this.items = {};
	this.jobs = {};
	this.parties = {};
	this.vehicles = {};
	
	if (window.location.search.match(/(?:^\?|&)mode=editor(?:&|$)/) !== null) {
		this.state = 2;
		
		match = window.location.search.match(/(?:^\?|&)map=(0|[1-9][0-9]*)(?:&|$)/);
		
		if (match !== null) {
			this.initMapId = +match[1];
		}
	}
};

QuestForge.prototype.Custom.prototype = {
	initMapId: 0,
	initX: 0,
	initY: 0,
	
	state: 1,
	
	engineSetup: {
		soundEngine: function (soundEngine) {
			soundEngine.addTrack({
				name: 'overworld',
				urls: {
					0: 'sounds/overworld-0.ogg',
					1: 'sounds/overworld-1.ogg',
					2: 'sounds/overworld-2.ogg'
				},
				loopStart: 128 * 23537 / (64 * 22050), // 23537 * 8 / (23520 * 3), // 367.765625 * 8/ (3 * 367.5),
				loopEnd: 9 * 128 * 23537 / (64 * 22050) // 23537 * 136 / (23520 * 3) // 367.765625 * 136/ (3 * 367.5)
			});
			
			soundEngine.addTrack({
				name: 'overworld2',
				urls: {
					0: 'sounds/overworld-0.ogg',
					1: 'sounds/overworld-1.ogg',
					2: 'sounds/overworld-2.ogg'
				},
				loopStart: 128 * 23537 / (64 * 22050), // 23537 * 8 / (23520 * 3), // 367.765625 * 8/ (3 * 367.5),
				loopEnd: 9 * 128 * 23537 / (64 * 22050) // 23537 * 136 / (23520 * 3) // 367.765625 * 136/ (3 * 367.5)
			});
			
			soundEngine.addTrack({
				name: 'town',
				urls: {
					0: 'sounds/town1-0.ogg',
					1: 'sounds/town1-1.ogg',
					2: 'sounds/town1-2.ogg'
				},
				loopStart: 160 * 23537 / (64 * 22050), // 23537 * 8 / (23520 * 3), // 367.765625 * 8/ (3 * 367.5),
				loopEnd: 17 * 160 * 23537 / (64 * 22050) // 23537 * 136 / (23520 * 3) // 367.765625 * 136/ (3 * 367.5)
			});
			
			soundEngine.addTrack({
				name: 'sfx-cursor',
				urls: {
					1: 'sounds/sfx-cursor-1.ogg',
				},
				loopStart: -1,
			});
			
			soundEngine.addTrack({
				name: 'sfx-open',
				urls: {
					3: 'sounds/sfx-open-3.ogg',
				},
				loopStart: -1,
			});
			
			soundEngine.init();
		},
		
		view: function (view) {
			// Set up tilesets.
			
			view.addTileset({name: 'dialog', url: 'tilesets/tiles.png', offsetY: 0});
			view.addTileset({name: 'overworld', url: 'tilesets/tiles.png', offsetY: 16});
			view.addTileset({name: 'town', url: 'tilesets/tiles.png', offsetY: 32});
			view.addTileset({name: 'battleBackgrounds', url: 'tilesets/tiles.png', offsetY: 96});
			view.addTileset({name: 'portraits', url: 'tilesets/tiles.png', offsetY: 160});
			
			view.addTileset({name: 'avatars', url: 'tilesets/sprites.png', offsetY: 0});
			view.addTileset({name: 'mapChars', url: 'tilesets/sprites.png', offsetY: 48});
			view.addTileset({name: 'effects', url: 'tilesets/sprites.png', offsetY: 128});
			
			view.init();
			
			view.draw(view.tilesets.overworld, 0, 0, 0, 0, view.conf.width, view.conf.height);
		}
	},
	
	start: function () {
		var dialogEngine, game, mapEngine, s;
		
		dialogEngine = QuestForge.current.dialogEngine;
		game = QuestForge.current.game;
		mapEngine = QuestForge.current.mapEngine;
		s = QuestForge.current.symbols;
		
		// Set up abilities.
		
		this.abilities.fight = game.addAbility({
			name: 'Fight',
			effectType: -1,
			prepareBattleAction: QuestForge.current.Ability.prepareBattleActionFight
		});
		
		this.abilities.fightAll = game.addAbility({
			name: 'Fire',
			selectionType: 1
		});
		
		this.abilities.magic = game.addAbility({
			name: 'Magic',
			menu: 'magic'
		});
		
		this.abilities.item = game.addAbility({
			name: 'Item',
			menu: game.conf.itemMenuName
		});
		
		this.abilities.fire1 = game.addAbility({
			name: s.bmagic+'Fire1',
			selectionType: 1
		});
		
		// Set up jobs.
		
		this.jobs.fighter = game.addJob({
			abilities: [
				this.abilities.fight,
				null,
				null,
				this.abilities.item
			],
			levels: {
				1: {
					strength: 10,
					constitution: 3,
					dexterity: 2,
					wisdom: 1
				},
				99: {
					strength: 255,
					constitution: 200,
					dexterity: 200,
					wisdom: 200
				},
			}
		});
		
		this.jobs.mage = game.addJob({
			abilities: [
				this.abilities.fight,
				this.abilities.magic,
				null,
				this.abilities.item
			],
			levels: {
				1: {
					strength: 2,
					constitution: 2,
					dexterity: 2,
					wisdom: 5
				},
				99: {
					strength: 255,
					constitution: 200,
					dexterity: 200,
					wisdom: 200
				},
			},
			hasMp: true
		});
		
		this.jobs.imp = game.addJob({
			abilities: [
				this.abilities.fight,
				null,
				null,
				null
			],
			levels: {
				1: {
					strength: 5,
					constitution: 1,
					dexterity: 1,
					wisdom: 1
				},
				99: {
					strength: 100,
					constitution: 200,
					dexterity: 100,
					wisdom: 40
				},
			}
		});
		
		// Set up characters.
		
		this.chars.lyulf = game.addCharacter({
			name: 'Lyulf',
			job: this.jobs.fighter,
			mapSprite: 0,
			battleSprite: 0,
			portraitX: 0,
			portraitY: 0
		});
		
		this.chars.ember = game.addCharacter({
			name: 'Ember',
			job: this.jobs.fighter,
			mapSprite: 1,
			battleSprite: 1,
			portraitX: 4,
			portraitY: 0
		});
		
		this.chars.howard = game.addCharacter({
			name: 'Howard',
			job: this.jobs.mage,
			mapSprite: 2,
			battleSprite: 2,
			portraitX: 8,
			portraitY: 0
		});
		
		this.chars.willa = game.addCharacter({
			name: 'Willa',
			job: this.jobs.mage,
			mapSprite: 3,
			battleSprite: 3,
			portraitX: 12,
			portraitY: 0
		});
		
		this.chars.kayla = game.addCharacter({
			name: 'Kayla',
			job: this.jobs.fighter,
			mapSprite: 4,
			battleSprite: 4,
			portraitX: 16,
			portraitY: 0
		});
		
		this.chars.mendel = game.addCharacter({
			name: 'Mendel',
			job: this.jobs.mage,
			mapSprite: 5,
			battleSprite: 5,
			portraitX: 20,
			portraitY: 0
		});
		
		this.chars.nevan = game.addCharacter({
			name: 'Nevan',
			job: this.jobs.mage,
			mapSprite: 6,
			battleSprite: 6,
			portraitX: 24,
			portraitY: 0
		});
		
		// Set up items (including skills in submenus).
		
		this.items.healPotion = game.addItem({
			name: s.potion+'Heal'
		});
		
		this.items.heal2Potion = game.addItem({
			name: s.potion+'Heal2'
		});
		
		this.items.heal3Potion = game.addItem({
			name: s.potion+'Heal3'
		});
		
		this.items.heal4Potion = game.addItem({
			name: s.potion+'Heal4'
		});
		
		this.items.manaPotion = game.addItem({
			name: s.potion+'Mana'
		});
		
		this.items.mana2Potion = game.addItem({
			name: s.potion+'Mana2'
		});
		
		this.items.mana3Potion = game.addItem({
			name: s.potion+'Mana3'
		});
		
		this.items.mana4Potion = game.addItem({
			name: s.potion+'Mana4'
		});
		
		this.items.antidotePotion = game.addItem({
			name: s.potion+'Antidote'
		});
		
		this.items.eyedropPotion = game.addItem({
			name: s.potion+'Eyedrop'
		});
		
		this.items.tent = game.addItem({
			name: s.tent+'Tent'
		});
		
		this.items.fire1Spell = game.addItem({
			name: s.bmagic+'Fire1',
			battleAbility: this.abilities.fire1
		});
		
		this.items.dirk = game.addItem({
			name: s.knife+'Dirk',
			equipPositions: ['rHand'],
			equippableBy: [this.jobs.fighter, this.jobs.mage],
			spriteX: 0,
			spriteY: 10,
			stats: {
				attack: 2
			}
		});
		
		this.items.shortSword = game.addItem({
			name: s.sword1+'Short',
			equipPositions: ['rHand'],
			equippableBy: [this.jobs.fighter],
			spriteX: 0,
			spriteY: 12,
			stats: {
				attack: 5
			}
		});
		
		this.items.capHelmet = game.addItem({
			name: s.tunic+'Cloth',
			equipPositions: ['body'],
			equippableBy: [this.jobs.fighter, this.jobs.mage],
			stats: {
				defense: 1
			}
		});
		
		this.items.capHelmet = game.addItem({
			name: s.helmet+'Cap',
			equipPositions: ['head'],
			equippableBy: [this.jobs.fighter, this.jobs.mage],
			stats: {
				defense: 1
			}
		});
		
		
		
		this.items.superfight = game.addItem({
			name: '\xB7FIGHT',
			battleAbility: this.abilities.fight
		});
		
		this.items.fightAll = game.addItem({
			name: '\xB7Bah',
			battleAbility: this.abilities.fightAll,
			mp: 999
		});
		
		this.items.test = game.addItem({
			name: '\xB7Test',
			battleAbility: this.abilities.fight
		});
		
		// Set up starting equipment and skills.
		
		this.chars.lyulf.equipment.rHand.add(this.items.dirk);
		this.chars.ember.equipment.rHand.add(this.items.dirk);
		this.chars.willa.addSkill('magic', this.items.fire1Spell);
		
		/*
		this.chars.howard.equipment.rHand.add(this.items.dirk);
		this.chars.howard.addSkill('magic', this.items.superfight);
		this.chars.howard.addSkill('magic', this.items.fightAll);
		this.chars.howard.addSkill('magic', this.items.test);
		this.chars.willa.equipment.rHand.add(this.items.dirk);
		this.chars.willa.addSkill('magic', this.items.superfight);
		this.chars.willa.addSkill('magic', this.items.fightAll);
		this.chars.willa.addSkill('magic', this.items.test);
		this.chars.mendel.addSkill('magic', this.items.superfight);
		this.chars.mendel.addSkill('magic', this.items.fightAll);
		this.chars.mendel.addSkill('magic', this.items.test);
		*/
		
		// Set up parties.
		
		this.parties.main = game.addParty();
		
		// Make sure the leader is always either Lyulf or Ember.
		
		(function (party, lyulf, ember) {
			var getNewLeader;
			
			getNewLeader = function (lineup) {
				var i, lineupSlot, newLeader;
				
				// Get the top-ranked frontmost character
				// of Lyulf or Ember.
				
				for (i = 0; i < lineup.length; ++i) {
					lineupSlot = lineup[i];
					
					if (lineupSlot.character === lyulf || lineupSlot.character === ember) {
						if (newLeader === undefined || lineupSlot.row > newLeader.row) {
							newLeader = lineupSlot;
						}
					}
				}
				
				return newLeader;
			};
			
			party.swapPositions = function (position1, position2) {
				QuestForge.current.Party.prototype.swapPositions.call(this, position1, position2);
				this.setLeader(getNewLeader(this.lineup));
			};
			
			party.setRow = function (position, row) {
				QuestForge.current.Party.prototype.setRow.call(this, position, row);
				this.setLeader(getNewLeader(this.lineup));
			};
		})(this.parties.main, this.chars.lyulf, this.chars.ember);
		
		this.parties.main.addMember(this.chars.lyulf);
		this.parties.main.addMember(this.chars.ember);
		this.parties.main.addMember(this.chars.howard);
		this.parties.main.addMember(this.chars.willa);
		
		//this.parties.main.addMember(this.chars.kayla);
		//this.parties.main.addMember(this.chars.mendel);
		//this.parties.main.addMember(this.chars.nevan);
		//this.parties.main.addMember(this.chars.catalyn);
		//this.parties.main.addMember(this.chars.catalyn2);
		
		this.parties.main.lineup[2].row = 0;
		this.parties.main.lineup[3].row = 0;
		
		/*
		this.items.test = game.addItem({
			name: s.potion+'234567890123456'
		});
		
		this.items.test2 = game.addItem({
			name: s.tent+'234567890123456'
		});
		
		this.parties.main.items.add(this.items.test, 12);
		this.parties.main.items.add(this.items.test2, 1);
		*/
		
		game.setCurrentParty(this.parties.main);
		
		// Set up enemies.
		
		this.enemies.goblin = game.addEnemy({
			name: 'Goblin',
			job: this.jobs.imp,
			portraitX: 4,
			portraitY: 8,
			portraitWidth: 4,
			portraitHeight: 4,
			goldAward: 8,
			xpAward: 8
		});
		
		this.enemies.spider = game.addEnemy({
			name: 'Spider',
			job: this.jobs.imp,
			portraitX: 24,
			portraitY: 16,
			portraitWidth: 4,
			portraitHeight: 4,
			goldAward: 4,
			xpAward: 12
		});
		
		this.enemies.snake = game.addEnemy({
			name: 'Snake',
			job: this.jobs.imp,
			portraitX: 12,
			portraitY: 35,
			portraitWidth: 4,
			portraitHeight: 4
		});
		
		this.enemies.bat = game.addEnemy({
			name: 'Bat',
			job: this.jobs.imp,
			portraitX: 0,
			portraitY: 12,
			portraitWidth: 4,
			portraitHeight: 4
		});
		
		this.enemies.knight = game.addEnemy({
			name: 'Knight',
			job: this.jobs.imp,
			portraitX: 0,
			portraitY: 58,
			portraitWidth: 6,
			portraitHeight: 6
		});
		
		// Set up battles.
		
		this.battles.test = game.addBattle({
			enemyPacks: [
				[
					this.enemies.goblin,
					this.enemies.goblin,
					this.enemies.goblin,
					this.enemies.goblin,
					this.enemies.spider,
					this.enemies.spider
				],
				[
					this.enemies.goblin,
					this.enemies.goblin,
					this.enemies.spider
				]
			]
		});
		
		// Set up vehicles.
		
		this.vehicles.walking = game.addVehicle();
		
		this.vehicles.canoe = game.addVehicle({
			minTerrainLevel: 40,
			maxTerrainLevel: 69,
			tileX: 0,
			tileY: 1,
			bob: 0,
			autoSwitchVehicles: [this.vehicles.walking],
			overrideSprite: true
		});
		
		this.vehicles.npcWalking = game.addVehicle();
		
		//this.vehicles.walking.autoSwitchVehicles.push(this.vehicles.canoe);
		
		// Set up maps.
		
		this.setUpMaps();
		
		game.recalculateCharacterStats();
		
		// Start the game engine.
		
		game.currentEngine = this;
		
		game.tick();
	},
	
	tick: function () {
		var game, mapEngine;
		
		switch (this.state) {
		case 0:
			QuestForge.current.dialogEngine.dialog(QuestForge.current.dialogEngine.prepareText('\n   Welcome to QuestForge!\n\n       (Press Enter)\nThis is an early concept demo of the QuestForge game engine, an upcoming open source JavaScript engine for creating story/adventure games similar to classic Final Fantasy titles from Square Enix. QuestForge has no affiliation with Square Enix or the Final Fantasy game series.'));
			this.state = 1;
			break;
		
		case 1:
			// Load first map.
			
			game = QuestForge.current.game;
			mapEngine = QuestForge.current.mapEngine;
			
			mapEngine.loadMap(game.maps[this.initMapId], this.initX, this.initY);
			
			mapEngine.transitionType = 1;
			
			game.currentEngine = mapEngine;
			break;
		
		case 2:
			// Start the map editor.
			
			QuestForge.current.mapEditorEngine.init(QuestForge.current.game.maps[this.initMapId], this.initX, this.initY);
		}
	},
	
	setUpMaps: function () {

		// Map 0 BEGIN
		QuestForge.current.game.addMap({
			"width": 256,
			"height": 256,
			"tileset": QuestForge.current.view.tilesets["overworld"],
			"music": "overworld",
			"domainWidth": 32,
			"domainHeight": 32,
			"battles": [
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]},
				{"default": [this.battles["test"].id]}
			],
			"tilesEncoded": [5,1,1,11,2,12,14,10,1,15,1,6,219,0,1,7,1,8,1,17,1,16,1,15,12,1,1,11,16,10,1,15,1,6,222,0,2,7,1,8,12,1,1,18,1,10,4,16,6,10,
1,57,3,10,1,15,1,6,226,0,4,7,1,8,3,1,2,49,1,50,1,1,1,17,1,15,1,39,2,38,1,40,1,17,4,10,1,15,1,38,1,17,1,10,1,14,1,1,1,5,231,
0,1,8,2,1,2,0,1,51,2,1,5,38,1,40,1,18,2,10,1,14,1,39,1,38,1,40,1,18,1,14,1,1,1,5,232,0,2,7,2,0,6,7,1,8,2,38,1,17,2,10,1,14,
3,38,1,17,1,15,1,6,243,0,1,9,2,38,1,40,1,18,1,10,1,14,3,38,1,6,1,7,244,0,1,9,1,42,2,38,1,18,1,10,1,14,2,38,1,41,1,5,246,0,
1,8,2,38,1,17,1,16,1,15,2,38,1,6,245,0,1,2,1,5,1,9,1,42,6,38,1,5,244,0,1,9,1,40,1,4,1,3,1,8,1,42,4,38,1,6,245,0,1,9,1,42,
1,40,1,4,1,2,1,38,1,42,2,38,1,6,3,0,1,3,243,0,1,8,7,38,1,5,2,0,1,2,1,6,1,9,1,4,241,0,1,9,1,42,2,38,1,6,1,9,1,42,1,38,1,4,
1,3,1,2,1,6,1,0,1,2,1,40,1,5,241,0,1,8,1,42,1,38,1,4,1,0,1,8,1,42,2,38,1,6,1,3,1,2,1,39,1,41,1,5,242,0,1,8,1,42,1,38,1,4,
1,3,1,8,1,42,5,38,1,6,244,0,1,7,1,8,1,42,1,6,1,0,1,8,1,42,1,38,1,11,1,13,1,41,1,5,246,0,1,7,3,0,1,8,1,42,1,17,1,15,1,6,252,
0,3,7,50909,0,10,10,245,0,3,10,5,16,4,10,244,0,2,10,1,14,1,34,3,33,1,35,1,18,3,10,243,0,3,10,1,14,5,33,1,18,3,10,243,0,3,
10,1,14,1,37,3,33,1,36,1,18,5,10,1,14,239,0,5,10,1,12,1,13,1,56,1,11,1,12,6,10,1,14,239,0,5,10,1,16,1,15,1,56,1,17,2,16,5,
10,1,14,239,0,4,10,1,15,1,20,1,22,1,33,1,20,1,21,1,22,1,17,4,10,1,15,226,0,16,10,1,15,1,20,1,19,1,23,1,33,1,26,1,25,1,19,
1,22,1,17,2,10,1,14,1,6,226,0,3,10,6,16,6,10,1,14,1,20,2,19,1,23,1,37,1,33,1,35,1,27,1,19,1,22,1,18,1,10,1,14,1,5,226,0,2,
10,1,14,1,34,4,33,1,35,1,18,5,10,1,14,1,27,2,19,1,24,1,85,1,86,1,33,1,27,1,19,1,23,1,18,1,10,1,15,1,5,226,0,2,10,1,14,6,33,
1,18,5,10,1,14,1,27,2,19,1,22,1,87,1,88,1,33,1,26,1,25,1,24,1,17,1,15,1,6,227,0,2,10,1,14,1,37,4,33,1,36,1,18,5,10,1,14,1,
26,3,19,1,21,1,22,1,37,5,33,228,0,3,10,1,12,1,13,2,56,1,11,1,12,7,10,1,13,1,26,4,19,1,21,1,22,1,1,1,11,1,12,1,13,1,5,227,
0,4,10,1,14,2,56,1,18,9,10,1,13,1,26,4,19,1,24,1,11,2,10,1,14,1,5,229,0,2,10,1,14,2,56,1,18,10,10,1,13,1,27,2,19,1,23,1,11,
3,10,1,14,1,4,229,0,2,10,1,14,2,56,1,17,1,57,4,16,5,10,1,14,1,27,2,19,1,23,1,18,4,10,1,13,1,4,1,0,14,3,213,0,2,10,1,14,1,
37,6,33,1,35,1,18,4,10,1,14,1,26,2,25,1,24,1,18,5,10,1,13,1,4,14,1,1,5,212,0,3,10,6,12,1,13,1,33,1,18,4,10,1,14,4,1,1,18,
6,10,1,13,14,1,1,5,1,0,5,3,207,0,8,10,1,14,1,33,1,18,4,10,1,14,4,1,1,18,6,10,1,14,4,1,1,11,2,12,1,13,5,1,1,6,1,0,1,2,1,20,
1,22,3,1,1,4,207,0,7,10,1,14,1,33,1,18,2,10,2,16,1,15,4,1,1,17,6,10,1,14,1,13,2,1,1,11,4,10,1,12,1,13,2,1,1,6,2,0,1,20,1,
19,1,24,1,67,1,68,1,69,1,1,1,4,207,0,1,18,5,10,1,14,1,33,1,17,1,16,1,15,4,1,1,20,1,21,1,22,1,1,1,17,7,10,2,12,7,10,1,13,1,
6,3,0,1,27,1,23,1,65,1,66,1,57,1,70,1,71,1,1,1,4,3,3,203,0,1,18,5,10,1,14,1,37,3,33,1,35,1,11,1,13,1,1,1,27,2,19,1,22,1,1,
1,18,15,10,1,14,1,5,2,0,1,9,1,27,1,23,1,64,3,57,1,72,1,20,3,21,1,22,1,4,202,0,1,18,6,10,2,12,1,13,2,56,1,18,1,10,1,13,1,26,
2,19,1,23,1,1,1,18,15,10,1,14,1,5,2,0,1,9,1,26,1,24,1,61,1,58,1,57,1,77,1,76,1,27,4,19,1,22,202,0,1,17,8,10,1,14,2,56,1,18,
2,10,1,13,1,27,1,19,1,23,1,1,1,18,15,10,1,14,1,4,3,0,1,8,2,49,1,50,3,1,1,26,1,25,3,19,1,23,203,0,1,18,7,10,1,15,2,56,1,17,
2,10,1,14,1,27,1,19,1,24,1,1,1,18,16,10,1,13,1,4,5,3,1,51,5,1,1,26,2,19,1,23,203,0,1,18,6,10,1,14,1,34,2,33,1,35,1,18,1,10,
1,14,1,26,1,24,2,1,1,18,17,10,2,12,1,13,10,1,1,26,1,25,1,24,203,0,1,17,6,10,1,14,4,33,1,18,1,10,1,14,3,1,1,11,21,10,6,12,
1,13,5,1,1,5,204,0,1,17,5,10,1,14,1,37,2,33,1,36,1,18,1,10,1,14,3,1,1,18,6,10,4,16,18,10,1,13,4,1,1,5,205,0,1,17,2,16,3,10,
4,12,2,10,1,14,3,1,1,18,4,10,2,16,3,21,1,22,1,17,1,16,16,10,1,14,1,39,1,40,2,1,1,5,205,0,2,7,1,8,1,17,1,16,7,10,1,15,3,1,
1,17,2,10,1,16,1,15,1,20,1,21,4,19,1,21,1,22,1,17,1,16,12,10,1,57,1,16,1,15,3,38,1,40,1,5,208,0,1,7,1,8,1,17,2,16,2,10,1,
16,1,15,5,1,1,17,1,15,1,20,1,21,2,19,2,25,4,19,1,21,1,22,1,17,10,10,1,15,1,39,6,38,1,5,210,0,2,7,1,8,1,17,1,15,7,1,1,20,1,
21,4,19,1,80,1,81,1,26,4,19,1,23,1,1,1,18,8,10,1,14,1,39,6,38,1,41,1,5,213,0,1,8,4,1,1,29,1,28,1,30,1,1,1,27,4,19,1,24,1,
78,1,79,1,69,1,26,3,19,1,23,1,1,1,17,9,10,4,12,1,13,1,42,1,41,1,6,214,0,1,9,3,1,1,29,2,28,1,31,1,1,1,27,3,19,1,24,1,67,1,
82,1,83,1,70,1,71,1,27,2,19,1,24,2,1,1,18,12,10,1,14,1,6,1,7,215,0,1,9,3,1,1,32,2,28,1,30,1,1,1,26,2,19,1,23,1,65,1,66,2,
57,1,84,1,72,1,26,1,25,1,24,3,1,1,18,12,10,1,14,1,5,216,0,1,9,4,1,1,32,2,28,1,30,1,1,1,26,1,25,1,24,1,64,1,84,2,57,1,84,1,
73,5,1,1,11,13,10,1,14,1,5,216,0,1,2,1,11,2,12,1,13,1,1,1,32,2,28,1,30,3,1,1,63,1,84,2,57,1,84,1,74,5,1,1,18,13,10,1,15,1,
5,216,0,1,8,1,17,3,10,1,12,1,13,1,32,2,28,1,30,2,1,1,62,1,84,2,57,1,77,1,75,4,1,1,11,13,10,1,14,1,1,1,5,217,0,1,8,1,17,1,
16,2,10,1,14,1,1,1,32,1,28,1,31,2,1,1,60,1,58],
			"defs": {
				"tilePatterns": [
					{"tileX": 1, "tileY": 4, "terrainLevel": 20, "editorInfo": {"name":"Ocean"}}, // 0
					{"tileX": 1, "tileY": 0, "editorInfo": {"name":"Grass"}}, // 1
					{"tileX": 2, "tileY": 5, "editorInfo": {"name":"Shore top-left"}}, // 2
					{"tileX": 1, "tileY": 5, "terrainLevel": 20, "editorInfo": {"name":"Shore top"}}, // 3
					{"tileX": 0, "tileY": 5, "editorInfo": {"name":"Shore top-right"}}, // 4
					{"tileX": 0, "tileY": 4, "terrainLevel": 20, "editorInfo": {"name":"Shore right"}}, // 5
					{"tileX": 0, "tileY": 3, "editorInfo": {"name":"Shore bottom-right"}}, // 6
					{"tileX": 1, "tileY": 3, "terrainLevel": 20, "editorInfo": {"name":"Shore bottom"}}, // 7
					{"tileX": 2, "tileY": 3, "editorInfo": {"name":"Shore bottom-left"}}, // 8
					{"tileX": 2, "tileY": 4, "terrainLevel": 20, "editorInfo": {"name":"Shore left"}}, // 9
					{"tileX": 4, "tileY": 4, "terrainLevel": 80, "editorInfo": {"name":"Mountains"}}, // 10
					{"tileX": 3, "tileY": 3, "terrainLevel": 80, "editorInfo": {"name":"Mountains top-left"}}, // 11
					{"tileX": 4, "tileY": 3, "terrainLevel": 80, "editorInfo": {"name":"Mountains top"}}, // 12
					{"tileX": 5, "tileY": 3, "terrainLevel": 80, "editorInfo": {"name":"Mountains top-right"}}, // 13
					{"tileX": 5, "tileY": 4, "terrainLevel": 80, "editorInfo": {"name":"Mountains right"}}, // 14
					{"tileX": 5, "tileY": 5, "editorInfo": {"name":"Mountains bottom-right"}}, // 15
					{"tileX": 4, "tileY": 5, "terrainLevel": 80, "editorInfo": {"name":"Mountains bottom"}}, // 16
					{"tileX": 3, "tileY": 5, "editorInfo": {"name":"Mountains bottom-left"}}, // 17
					{"tileX": 3, "tileY": 4, "terrainLevel": 80, "editorInfo": {"name":"Mountains left"}}, // 18
					{"tileX": 7, "tileY": 4, "battleRate": 2, "overlays": 2, "editorInfo": {"name":"Forest"}}, // 19
					{"tileX": 6, "tileY": 3, "battleRate": 2, "editorInfo": {"name":"Forest top-left"}}, // 20
					{"tileX": 7, "tileY": 3, "battleRate": 2, "overlays": 2, "editorInfo": {"name":"Forest top"}}, // 21
					{"tileX": 8, "tileY": 3, "battleRate": 2, "editorInfo": {"name":"Forest top-right"}}, // 22
					{"tileX": 8, "tileY": 4, "battleRate": 2, "overlays": 2, "editorInfo": {"name":"Forest right"}}, // 23
					{"tileX": 8, "tileY": 5, "battleRate": 2, "editorInfo": {"name":"Forest bottom-right"}}, // 24
					{"tileX": 7, "tileY": 5, "battleRate": 2, "overlays": 2, "editorInfo": {"name":"Forest bottom"}}, // 25
					{"tileX": 6, "tileY": 5, "battleRate": 2, "editorInfo": {"name":"Forest bottom-left"}}, // 26
					{"tileX": 6, "tileY": 4, "battleRate": 2, "overlays": 2, "editorInfo": {"name":"Forest left"}}, // 27
					{"tileX": 3, "tileY": 0, "editorInfo": {"name":"Plains"}}, // 28
					{"tileX": 0, "tileY": 1, "editorInfo": {"name":"Plains top-left"}}, // 29
					{"tileX": 1, "tileY": 1, "editorInfo": {"name":"Plains top-right"}}, // 30
					{"tileX": 1, "tileY": 2, "editorInfo": {"name":"Plains bottom-right"}}, // 31
					{"tileX": 0, "tileY": 2, "editorInfo": {"name":"Plains bottom-left"}}, // 32
					{"tileX": 4, "tileY": 0, "terrainLevel": 30, "editorInfo": {"name":"River"}}, // 33
					{"tileX": 2, "tileY": 1, "terrainLevel": 30, "editorInfo": {"name":"River top-left"}}, // 34
					{"tileX": 3, "tileY": 1, "terrainLevel": 30, "editorInfo": {"name":"River top-right"}}, // 35
					{"tileX": 3, "tileY": 2, "terrainLevel": 30, "editorInfo": {"name":"River bottom-right"}}, // 36
					{"tileX": 2, "tileY": 2, "terrainLevel": 30, "editorInfo": {"name":"River bottom-left"}}, // 37
					{"tileX": 5, "tileY": 0, "speedDenominator": 2, "battleRate": 2, "overlays": 8, "spriteOffset": 0, "editorInfo": {"name":"Swamp"}}, // 38
					{"tileX": 4, "tileY": 1, "speedDenominator": 2, "battleRate": 2, "overlays": 8, "spriteOffset": 0, "editorInfo": {"name":"Swamp top-left"}}, // 39
					{"tileX": 5, "tileY": 1, "speedDenominator": 2, "battleRate": 2, "overlays": 8, "spriteOffset": 0, "editorInfo": {"name":"Swamp top-right"}}, // 40
					{"tileX": 5, "tileY": 2, "speedDenominator": 2, "battleRate": 2, "overlays": 8, "spriteOffset": 0, "editorInfo": {"name":"Swamp bottom-right"}}, // 41
					{"tileX": 4, "tileY": 2, "speedDenominator": 2, "battleRate": 2, "overlays": 8, "spriteOffset": 0, "editorInfo": {"name":"Swamp bottom-left"}}, // 42
					{"tileX": 6, "tileY": 0, "editorInfo": {"name":"Desert"}}, // 43
					{"tileX": 6, "tileY": 1, "editorInfo": {"name":"Desert top-left"}}, // 44
					{"tileX": 7, "tileY": 1, "editorInfo": {"name":"Desert top-right"}}, // 45
					{"tileX": 7, "tileY": 2, "editorInfo": {"name":"Desert bottom-right"}}, // 46
					{"tileX": 6, "tileY": 2, "editorInfo": {"name":"Desert bottom-left"}}, // 47
					{"tileX": 9, "tileY": 3, "editorInfo": {"name":"Dock top-left"}}, // 48
					{"tileX": 10, "tileY": 3, "editorInfo": {"name":"Dock top"}}, // 49
					{"tileX": 11, "tileY": 3, "editorInfo": {"name":"Dock top-right"}}, // 50
					{"tileX": 11, "tileY": 4, "editorInfo": {"name":"Dock right"}}, // 51
					{"tileX": 11, "tileY": 5, "editorInfo": {"name":"Dock bottom-right"}}, // 52
					{"tileX": 10, "tileY": 5, "editorInfo": {"name":"Dock bottom"}}, // 53
					{"tileX": 9, "tileY": 5, "editorInfo": {"name":"Dock bottom-left"}}, // 54
					{"tileX": 9, "tileY": 4, "editorInfo": {"name":"Dock left"}}, // 55
					{"tileX": 7, "tileY": 0, "terrainLevel": 70, "editorInfo": {"name":"Waterfall"}}, // 56
					{"tileX": 2, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"Pavement"}}, // 57
					{"tileX": 13, "tileY": 6, "terrainLevel": 70, "editorInfo": {"name":"Gate left"}}, // 58
					{"tileX": 11, "tileY": 6, "terrainLevel": 70, "editorInfo": {"name":"Wall bottom"}}, // 59
					{"tileX": 12, "tileY": 6, "terrainLevel": 70, "editorInfo": {"name":"Wall bottom-left"}}, // 60
					{"tileX": 12, "tileY": 1, "terrainLevel": 70, "editorInfo": {"name":"Wall bottom-left small"}}, // 61
					{"tileX": 12, "tileY": 5, "terrainLevel": 70, "editorInfo": {"name":"Wall left 4/4"}}, // 62
					{"tileX": 12, "tileY": 4, "terrainLevel": 70, "editorInfo": {"name":"Wall left 3/4"}}, // 63
					{"tileX": 12, "tileY": 3, "terrainLevel": 70, "editorInfo": {"name":"Wall left 2/4"}}, // 64
					{"tileX": 12, "tileY": 2, "terrainLevel": 70, "editorInfo": {"name":"Wall left 1/4"}}, // 65
					{"tileX": 13, "tileY": 2, "battleRate": 0, "editorInfo": {"name":"Wall left 1/4 inner"}}, // 66
					{"tileX": 13, "tileY": 1, "terrainLevel": 70, "editorInfo": {"name":"Wall top-left"}}, // 67
					{"tileX": 10, "tileY": 6, "terrainLevel": 70, "editorInfo": {"name":"Wall top"}}, // 68
					{"tileX": 14, "tileY": 1, "terrainLevel": 70, "editorInfo": {"name":"Wall top-right"}}, // 69
					{"tileX": 14, "tileY": 2, "battleRate": 0, "editorInfo": {"name":"Wall right 1/4 inner"}}, // 70
					{"tileX": 15, "tileY": 2, "terrainLevel": 70, "editorInfo": {"name":"Wall right 1/4"}}, // 71
					{"tileX": 15, "tileY": 3, "terrainLevel": 70, "editorInfo": {"name":"Wall right 2/4"}}, // 72
					{"tileX": 15, "tileY": 4, "terrainLevel": 70, "editorInfo": {"name":"Wall right 3/4"}}, // 73
					{"tileX": 15, "tileY": 5, "terrainLevel": 70, "editorInfo": {"name":"Wall right 4/4"}}, // 74
					{"tileX": 15, "tileY": 6, "terrainLevel": 70, "editorInfo": {"name":"Wall bottom-right"}}, // 75
					{"tileX": 15, "tileY": 1, "terrainLevel": 70, "editorInfo": {"name":"Wall bottom-right small"}}, // 76
					{"tileX": 14, "tileY": 6, "terrainLevel": 70, "editorInfo": {"name":"Gate right"}}, // 77
					{"tileX": 13, "tileY": 4, "terrainLevel": 70, "editorInfo": {"name":"Gated castle middle-left"}}, // 78
					{"tileX": 14, "tileY": 4, "terrainLevel": 70, "editorInfo": {"name":"Gated castle middle-right"}}, // 79
					{"tileX": 13, "tileY": 3, "terrainLevel": 70, "editorInfo": {"name":"Gated castle top-left"}}, // 80
					{"tileX": 14, "tileY": 3, "terrainLevel": 70, "editorInfo": {"name":"Gated castle top-right"}}, // 81
					{"tileX": 13, "tileY": 5, "battleRate": 0, "editorInfo": {"name":"Gated castle entrance left"}}, // 82
					{"tileX": 14, "tileY": 5, "battleRate": 0, "editorInfo": {"name":"Gated castle entrance right"}}, // 83
					{"tileX": 11, "tileY": 0, "battleRate": 0, "onpressure": (function () {
"use strict";
this.teleport(1, 0, 0, 0);}), "editorInfo": {"name":"Town"}}, // 84
					{"tileX": 8, "tileY": 1, "terrainLevel": 70, "editorInfo": {"name":"Castle top-left"}}, // 85
					{"tileX": 9, "tileY": 1, "terrainLevel": 70, "editorInfo": {"name":"Castle top-right"}}, // 86
					{"tileX": 8, "tileY": 2, "battleRate": 0, "editorInfo": {"name":"Castle entrance left"}}, // 87
					{"tileX": 9, "tileY": 2, "battleRate": 0, "editorInfo": {"name":"Castle entrance right"}}, // 88
					{"tileX": 8, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"Cave"}} // 89
				],
				"sprites": [
				]
			}
		});
		// Map 0 END



		// Map 1 BEGIN
		QuestForge.current.game.addMap({
			"width": 64,
			"height": 64,
			"tileset": QuestForge.current.view.tilesets["town"],
			"music": "town",
			"tilesEncoded": [2,3,13,27,1,1,33,0,14,27,1,4,2,33,61,0,1,33,2176,0,15,28,34,0,30,28,34,0,15,28,13,27,2,28,1,2,33,0,2,28,26,27,2,28,1,2,33,
0,2,28,13,27,7,35,1,0,1,29,4,32,2,28,1,2,33,0,2,28,1,0,5,32,1,0,6,35,1,45,5,46,1,38,1,34,1,32,4,31,2,28,1,2,33,0,2,28,1,32,
4,47,1,31,1,0,1,37,5,46,1,45,1,18,1,22,1,18,1,19,1,18,1,40,1,2,5,31,2,28,1,2,33,0,2,28,1,30,1,47,2,31,1,47,1,30,1,0,1,37,
1,18,1,19,1,18,1,21,1,18,1,45,1,17,1,59,3,17,1,39,1,2,4,31,1,30,2,28,1,2,33,0,2,28,1,64,1,47,1,30,1,31,1,47,2,0,1,37,3,17,
1,58,1,17,1,45,1,44,1,41,1,44,2,29,1,38,1,2,4,31,1,29,2,28,1,2,33,0,2,28,1,29,1,30,1,32,2,30,1,32,1,0,1,37,2,38,1,44,1,41,
1,44,3,41,4,38,1,2,1,30,3,31,1,32,2,28,1,2,33,0,2,28,2,0,1,30,1,29,1,0,1,30,1,0,1,37,1,32,2,38,4,41,5,38,1,2,1,0,4,31,2,28,
1,2,33,0,2,28,2,11,2,0,1,10,2,0,1,37,1,30,3,38,1,41,2,36,5,12,1,1,1,0,1,31,1,30,2,31,2,28,1,2,33,0,2,28,1,11,1,10,1,11,4,
0,1,37,3,38,1,12,1,36,2,3,2,0,5,20,1,31,1,29,2,31,2,28,1,2,33,0,2,28,3,11,2,0,1,10,1,0,1,37,3,38,1,2,3,3,2,0,2,18,1,24,2,
18,1,31,1,32,2,31,2,28,1,2,33,0,2,28,1,11,6,0,4,12,1,1,2,3,3,12,2,17,1,57,2,17,1,30,3,31,2,28,1,2,33,0,2,28,13,12,1,16,3,
7,1,66,1,65,4,3,2,31,1,30,2,28,1,2,33,0,2,28,1,68,12,7,2,3,1,10,1,7,1,48,5,3,1,31,1,30,1,0,2,28,1,2,33,0,7,28,1,7,1,0,4,11,
1,10,3,3,1,10,1,9,6,3,1,30,1,29,1,0,2,28,1,2,33,0,7,28,1,9,1,0,1,67,3,11,1,10,3,3,1,0,1,9,2,12,1,6,1,12,1,0,1,3,3,0,2,28,
1,2,33,0,7,28,1,9,6,0,3,3,1,0,1,9,4,7,1,0,1,3,3,0,2,28,1,2,33,0,7,28,1,9,1,0,5,20,3,3,1,0,1,9,4,7,1,0,1,3,3,0,2,28,1,2,33,
0,7,28,1,9,1,0,1,18,1,19,1,23,1,19,1,18,1,5,2,3,1,0,1,9,4,7,1,0,1,3,2,0,1,32,2,28,1,2,33,0,2,28,5,27,1,9,1,10,5,17,1,5,2,
3,1,10,6,0,1,3,1,0,1,29,1,31,2,28,1,2,33,0,2,28,1,27,1,13,3,27,1,9,1,10,2,17,1,56,2,17,1,4,10,3,1,0,1,32,1,31,2,28,1,2,33,
0,2,28,1,32,1,13,3,0,1,9,1,10,8,3,3,32,6,0,2,31,2,28,1,2,33,0,2,28,1,31,1,9,3,12,1,8,3,0,3,32,3,3,3,30,6,0,2,30,2,28,1,2,
33,0,2,28,1,30,1,9,4,7,1,0,1,14,1,0,3,30,3,3,13,28,1,2,33,0,14,28,3,3,13,27,1,2,33,0,14,27,1,5],
			"defs": {
				"tilePatterns": [
					{"tileX": 1, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"Grass"}}, // 0
					{"tileX": 1, "tileY": 2, "battleRate": 0, "editorInfo": {"name":"Grass shadow bottom"}}, // 1
					{"tileX": 1, "tileY": 1, "battleRate": 0, "editorInfo": {"name":"Grass shadow"}}, // 2
					{"tileX": 2, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"Stone path"}}, // 3
					{"tileX": 2, "tileY": 2, "battleRate": 0, "editorInfo": {"name":"Stone path shadow bottom"}}, // 4
					{"tileX": 2, "tileY": 1, "battleRate": 0, "editorInfo": {"name":"Stone path shadow"}}, // 5
					{"tileX": 11, "tileY": 0, "terrainLevel": 49, "battleRate": 0, "editorInfo": {"name":"Steps to water"}}, // 6
					{"tileX": 4, "tileY": 0, "terrainLevel": 48, "battleRate": 0, "overlays": 8, "editorInfo": {"name":"Water"}}, // 7
					{"tileX": 4, "tileY": 2, "terrainLevel": 48, "battleRate": 0, "overlays": 8, "editorInfo": {"name":"Water shadow bottom"}}, // 8
					{"tileX": 4, "tileY": 1, "terrainLevel": 48, "battleRate": 0, "overlays": 8, "editorInfo": {"name":"Water shadow"}}, // 9
					{"tileX": 3, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"Flowers"}}, // 10
					{"tileX": 5, "tileY": 0, "battleRate": 0, "overlays": 2, "editorInfo": {"name":"Tall grass"}}, // 11
					{"tileX": 6, "tileY": 0, "terrainLevel": 30, "battleRate": 0, "editorInfo": {"name":"Cliff"}}, // 12
					{"tileX": 7, "tileY": 0, "terrainLevel": 30, "battleRate": 0, "editorInfo": {"name":"Waterfall"}}, // 13
					{"tileX": 10, "tileY": 0, "terrainLevel": 60, "battleRate": 0, "onaction": (function () {
	"use strict";
	this.say('It\'s a well.');
}), "editorInfo": {"name":"Well"}}, // 14
					{"tileX": 3, "tileY": 1, "lowerTilePatternId": 7, "battleRate": 0, "editorInfo": {"name":"Bridge horizontal"}}, // 15
					{"tileX": 3, "tileY": 2, "lowerTilePatternId": 7, "battleRate": 0, "editorInfo": {"name":"Bridge vertical"}}, // 16
					{"tileX": 5, "tileY": 2, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Building wall"}}, // 17
					{"tileX": 5, "tileY": 1, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Roof"}}, // 18
					{"tileX": 6, "tileY": 2, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Roof truss"}}, // 19
					{"tileX": 6, "tileY": 1, "terrainLevel": 60, "lowerTilePatternId": 0, "battleRate": 0, "editorInfo": {"name":"Roof ridge"}}, // 20
					{"tileX": 8, "tileY": 1, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Weapon sign"}}, // 21
					{"tileX": 8, "tileY": 2, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Armor sign"}}, // 22
					{"tileX": 9, "tileY": 1, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Inn sign"}}, // 23
					{"tileX": 9, "tileY": 2, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Item sign"}}, // 24
					{"tileX": 10, "tileY": 1, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Black magic sign"}}, // 25
					{"tileX": 10, "tileY": 2, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"White magic sign"}}, // 26
					{"tileX": 7, "tileY": 2, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Wall"}}, // 27
					{"tileX": 7, "tileY": 1, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Wall top"}}, // 28
					{"tileX": 13, "tileY": 0, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Bush"}}, // 29
					{"tileX": 12, "tileY": 2, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Tree bottom"}}, // 30
					{"tileX": 12, "tileY": 1, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Tree middle"}}, // 31
					{"tileX": 12, "tileY": 0, "terrainLevel": 60, "battleRate": 0, "editorInfo": {"name":"Tree top"}}, // 32
					{"tileX": 1, "tileY": 0, "battleRate": 0, "blocksNpcs": true, "onpressure": (function () {
	"use strict";
	this.exit();
}), "editorInfo": {"name":"Exit"}}, // 33
					{"tileX": 0, "tileY": 2, "battleRate": 0, "editorInfo": {"name":"Grass right ledge"}}, // 34
					{"tileX": 0, "tileY": 1, "battleRate": 0, "editorInfo": {"name":"Grass top ledge"}}, // 35
					{"tileX": 11, "tileY": 0, "terrainLevel": 51, "battleRate": 0, "editorInfo": {"name":"Steps to L2"}}, // 36
					{"tileX": 0, "tileY": 2, "terrainLevel": 52, "battleRate": 0, "editorInfo": {"name":"L2 Grass left ledge"}}, // 37
					{"tileX": 1, "tileY": 0, "terrainLevel": 52, "battleRate": 0, "editorInfo": {"name":"L2 Grass"}}, // 38
					{"tileX": 1, "tileY": 2, "terrainLevel": 52, "battleRate": 0, "editorInfo": {"name":"L2 Grass shadow bottom"}}, // 39
					{"tileX": 1, "tileY": 1, "terrainLevel": 52, "battleRate": 0, "editorInfo": {"name":"L2 Grass shadow"}}, // 40
					{"tileX": 2, "tileY": 0, "terrainLevel": 52, "battleRate": 0, "editorInfo": {"name":"L2 Stone path"}}, // 41
					{"tileX": 2, "tileY": 2, "terrainLevel": 52, "battleRate": 0, "editorInfo": {"name":"L2 Stone path shadow bottom"}}, // 42
					{"tileX": 2, "tileY": 1, "terrainLevel": 52, "battleRate": 0, "editorInfo": {"name":"L2 Stone path shadow"}}, // 43
					{"tileX": 3, "tileY": 0, "terrainLevel": 52, "battleRate": 0, "editorInfo": {"name":"L2 Flowers"}}, // 44
					{"tileX": 5, "tileY": 0, "terrainLevel": 52, "battleRate": 0, "overlays": 2, "editorInfo": {"name":"L2 Tall grass"}}, // 45
					{"tileX": 6, "tileY": 1, "terrainLevel": 60, "lowerTilePatternId": 38, "battleRate": 0, "editorInfo": {"name":"L2 Roof ridge"}}, // 46
					{"tileX": 12, "tileY": 1, "battleRate": 0, "overlays": 3, "editorInfo": {"name":"Tree pathway"}}, // 47
					{"tileX": 14, "tileY": 0, "terrainLevel": 60, "battleRate": 0, "onaction": QuestForge.current.MapPattern["treasureAction"], "editorInfo": {"name":"Empty pot"}}, // 48
					{"tileX": 0, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"(unused 1)"}}, // 49
					{"tileX": 0, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"(unused 2)"}}, // 50
					{"tileX": 0, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"(unused 3)"}}, // 51
					{"tileX": 0, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"(unused 4)"}}, // 52
					{"tileX": 0, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"(unused 5)"}}, // 53
					{"tileX": 0, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"(unused 6)"}}, // 54
					{"tileX": 0, "tileY": 0, "battleRate": 0, "editorInfo": {"name":"(unused 7)"}}, // 55
					{"tileX": 8, "tileY": 0, "terrainLevel": 51, "blocksNpcs": true, "battleRate": 0, "openTileX": 9, "onpressurestart": QuestForge.current.MapPattern["openTile"], "editorInfo": {"name":"Door (inn)"}}, // 56
					{"tileX": 8, "tileY": 0, "terrainLevel": 51, "blocksNpcs": true, "battleRate": 0, "openTileX": 9, "onpressurestart": QuestForge.current.MapPattern["openTile"], "editorInfo": {"name":"Door (items)"}}, // 57
					{"tileX": 8, "tileY": 0, "terrainLevel": 51, "blocksNpcs": true, "battleRate": 0, "openTileX": 9, "onpressurestart": QuestForge.current.MapPattern["openTile"], "editorInfo": {"name":"Door (weapons)"}}, // 58
					{"tileX": 8, "tileY": 0, "terrainLevel": 51, "blocksNpcs": true, "battleRate": 0, "openTileX": 9, "onpressurestart": QuestForge.current.MapPattern["openTile"], "editorInfo": {"name":"Door (armor)"}}, // 59
					{"tileX": 8, "tileY": 0, "terrainLevel": 51, "blocksNpcs": true, "battleRate": 0, "openTileX": 9, "onpressurestart": QuestForge.current.MapPattern["openTile"], "editorInfo": {"name":"Door (unused 1)"}}, // 60
					{"tileX": 8, "tileY": 0, "terrainLevel": 51, "blocksNpcs": true, "battleRate": 0, "openTileX": 9, "onpressurestart": QuestForge.current.MapPattern["openTile"], "editorInfo": {"name":"Door (unused 2)"}}, // 61
					{"tileX": 8, "tileY": 0, "terrainLevel": 51, "blocksNpcs": true, "battleRate": 0, "openTileX": 9, "onpressurestart": QuestForge.current.MapPattern["openTile"], "editorInfo": {"name":"Door (unused 3)"}}, // 62
					{"tileX": 8, "tileY": 0, "terrainLevel": 51, "blocksNpcs": true, "battleRate": 0, "openTileX": 9, "onpressurestart": QuestForge.current.MapPattern["openTile"], "editorInfo": {"name":"Door (unused 4)"}}, // 63
					{"tileX": 13, "tileY": 1, "terrainLevel": 60, "battleRate": 0, "openTileY": 2, "treasure": this.items.capHelmet, "onaction": QuestForge.current.MapPattern["treasureAction"], "ontilerender": QuestForge.current.MapPattern["treasureTilerender"], "editorInfo": {"name":"Chest (cap)"}}, // 64
					{"tileX": 14, "tileY": 0, "terrainLevel": 60, "battleRate": 0, "treasure": this.items.healPotion, "onaction": QuestForge.current.MapPattern["treasureAction"], "editorInfo": {"name":"Pot (heal)"}}, // 65
					{"tileX": 14, "tileY": 0, "terrainLevel": 60, "battleRate": 0, "treasure": this.items.tent, "onaction": QuestForge.current.MapPattern["treasureAction"], "editorInfo": {"name":"Pot (tent)"}}, // 66
					{"tileX": 5, "tileY": 0, "terrainLevel": 60, "battleRate": 0, "treasureAmount": 60, "onaction": QuestForge.current.MapPattern["treasureAction"], "editorInfo": {"name":"Secret (gold)"}}, // 67
					{"tileX": 4, "tileY": 1, "terrainLevel": 60, "battleRate": 0, "treasure": this.items.shortSword, "onaction": QuestForge.current.MapPattern["treasureAction"], "editorInfo": {"name":"Secret (short sword)"}} // 68
				],
				"sprites": [
					{ // 0
						"template": {
							"type": "WalkingNpc",
							"props": {
								"x": 1,
								"y": 57,
								"tileX": 0,
								"tileY": 17,
								"message": "Hi. What's QuestForge, you ask? It's a game engine currently in development. You're playing it right now!\n\nIt's being developed out of nostalgia for the classic Final Fantasy games for the NES. They don't make games like those anymore, so why not let other people make some? QuestForge provides a framework for building games in this kind of style.\n\nThe {symbols.ldquo}launch title\" will be called Mendel's Flame. QuestForge and Mendel's Flame are being made by one dude, and it'll be free and open source."
							}
						}
					},
					{ // 1
						"template": {
							"type": "WalkingNpc",
							"props": {
								"x": 60,
								"y": 47,
								"tileX": 0,
								"tileY": 18,
								"floorLevel": 52,
								"message": "Want to hear a joke?\n\n\nWhat did the old wise man say to the village idiot?\n\n{symbols.ldquo}Want to hear a joke?\""
							}
						}
					}
				]
			}
		});
		// Map 1 END





	}
};
