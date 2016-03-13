"use strict";

QuestForge.prototype.EquipScreenEngine = function (props) {
	this.conf = {
		equipSlots: [
			[
				{slot: 'rHand', label: 'Right Hand'},
				{slot: 'lHand', label: 'Left Hand'},
				{slot: 'access1', label: 'Accessory'},
			], [
				{slot: 'head', label: 'Head'},
				{slot: 'body', label: 'Body'},
				{slot: 'arms', label: 'Arms'},
			],
		]
	};
	
	QuestForge.applyProperties(props, this.conf);
};

QuestForge.registerEngine('EquipScreenEngine', []);

QuestForge.prototype.EquipScreenEngine.prototype = {
	conf: null,
	
	character: null,
	cursorPositions: null,
	cursorX: null,
	cursorY: null,
	inventoryOffset: null,
	inventoryX: null,
	inventoryY: null,
	
	init: function (character) {
		var x, y, itemInv, itemText, position,
		    dialogEngine, view;
		
		dialogEngine = QuestForge.current.dialogEngine;
		view = QuestForge.current.view;
		
		this.character = character;
		this.cursorX = 0;
		this.cursorY = 0;
		this.inventoryOffset = 0;
		this.inventoryX = 0;
		this.inventoryY = 0;
		
		// Inventory box.
		dialogEngine.drawBox(2, 15, view.conf.width - 4, view.conf.height - 17, true);
		
		// Equipment box.
		dialogEngine.drawBox(2, 2, view.conf.width - 4, 14, true);
		
		// Portrait.
		view.drawRegion(view.tilesets.portraits, character.portraitX, character.portraitY, character.portraitWidth, character.portraitHeight, 4, 4);
		
		this.updateEquipmentList();
		this.initCursor();
		return true;
	},
	
	tick: function () {
	},
	
	initCursor: function () {
		QuestForge.current.game.currentEngine = this;
		
		QuestForge.current.cursorEngine.init({
			positions: this.cursorPositions,
			x: this.cursorX,
			y: this.cursorY,
		});
		
		this.updateInventoryList();
	},
	
	updateEquipmentList: function () {
		var itemInv, itemText, position, q, s, x, y;
		
		q = QuestForge.current;
		s = q.symbols;
		this.cursorPositions = [];
		
		for (x = 0; x < 2; ++x) {
			this.cursorPositions.push([]);
			
			for (y = 0; y < this.conf.equipSlots[x].length; ++y) {
				position = [
					x === 0 ? 4 : q.view.conf.width - 17,
					9 + y * 2
				];
				
				this.cursorPositions[x].push(position);
				itemInv = this.character.equipment[this.conf.equipSlots[x][y].slot];
				
				if (itemInv.item(0) === null) {
					itemText = q.dialogEngine.getDisabledText(this.conf.equipSlots[x][y].label);
				}
				else {
					itemText = itemInv.item(0).name;
				}
				
				itemText = q.game.padRight(itemText, 10);
				
				if (itemInv.num(0) > 1) {
					itemText += q.game.padLeft(itemInv.num(0), 3);
				}
				else {
					itemText += '   ';
				}
				
				q.dialogEngine.drawText(position[0], position[1], itemText);
			}
		}
		
		q.dialogEngine.drawText(9, 4,
			s.sword2+':'+q.game.padLeft(this.character.stats.attack, 3)+
			q.dialogEngine.getDisabledText(' '+q.game.padLeft(this.character.stats.hitRating, 2)+'%  ')+
			s.rod+':'+q.game.padLeft(this.character.stats.magicPower, 3)+'  '+
			s.boot+':'+q.game.padLeft(this.character.stats.speed, 3)+'\n'+
			s.shield+':'+q.game.padLeft(this.character.stats.defense, 3)+
			q.dialogEngine.getDisabledText(' '+q.game.padLeft(this.character.stats.evade, 2)+'%  ')+
			s.ring+':'+q.game.padLeft(this.character.stats.magicBlock, 3)+'\n'
		);
	},
	
	updateInventoryList: function () {
		QuestForge.current.inventoryEngine.prepare({
			eventHandler: this,
			inventory: QuestForge.current.game.currentParty.items,
			y: 17,
			offset: this.inventoryOffset,
			cursorX: this.inventoryX,
			cursorY: this.inventoryY,
			rearrangeable: false,
			enabledChecker: function (item) {
				return QuestForge.current.equipScreenEngine.isEquippable(item);
			}
		});
		
		QuestForge.current.inventoryEngine.drawList();
	},
	
	isEquippable: function (item) {
		var equipSlot;
		
		if (item === null) {
			return true;
		}
		
		equipSlot = this.conf.equipSlots[this.cursorX][this.cursorY].slot;
		
		if (item.isEquippableAt(equipSlot) === false) {
			if (!(equipSlot === 'lHand' && this.character.canDualWield() === true && item.isEquippableAt('rHand') === false)) {
				return false;
			}
		}
		
		return item.isEquippableBy(this.character);
	},
	
	//== Cursor events ==//
	
	cursorAction: function (x, y) {
		QuestForge.current.soundEngine.play('sfx-cursor');
		QuestForge.current.inventoryEngine.initCursor();
	},
	
	cursorCancel: function () {
		QuestForge.current.soundEngine.play('sfx-cursor');
		QuestForge.current.mainMenuEngine.state = 0;
		QuestForge.current.game.currentEngine = QuestForge.current.mainMenuEngine;
	},
	
	cursorChangeCol: function (oldX, newX) {
		QuestForge.current.cursorEngine.y[newX] = QuestForge.current.cursorEngine.y[oldX];
	},
	
	cursorMove: function (x, y) {
		this.cursorX = x;
		this.cursorY = y;
		this.updateInventoryList();
	},
	
	//== Inventory events ==//
	
	inventoryTick: function () {
		var position, view;
		
		view = QuestForge.current.view;
		position = this.cursorPositions[this.cursorX][this.cursorY];
		
		view.drawSprite(view.tilesets.effects, 0, 0, 2 * view.conf.tileWidth, 2 * view.conf.tileHeight, (position[0] - 2) * view.conf.tileWidth, position[1] * view.conf.tileHeight, 1);
	},
	
	inventoryAction: function (item, current, x, y) {
		var amount, equip, inventory, itemSlot;
		
		equip = this.character.equipment[this.conf.equipSlots[this.cursorX][this.cursorY].slot].items;
		inventory = QuestForge.current.inventoryEngine.inventory.items;
		
		if (item === null) {
			inventory[current] = equip[0];
			equip[0] = null;
		}
		else if (equip[0] === null || equip[0].num === 0) {
			amount = Math.min(inventory[current].num, item.equipMaxStack);
			
			equip[0] = new QuestForge.current.ItemSlot({
				item: item,
				num: amount
			});
			
			if (inventory[current].num > amount) {
				inventory[current].num -= amount;
			}
			else {
				inventory[current] = null;
			}
		}
		else if (item.id === equip[0].item.id) {
			amount = Math.min(equip[0].num, item.maxStack - inventory[current].num);
			inventory[current].num += amount;
			
			if (equip[0].num > amount) {
				equip[0].num -= amount;
			}
			else {
				equip[0] = null;
			}
		}
		else if (inventory[current].num <= item.equipMaxStack) {
			itemSlot = equip[0];
			equip[0] = inventory[current];
			inventory[current] = itemSlot;
		}
		else {
			amount = QuestForge.current.inventoryEngine.inventory.add(equip[0].item, equip[0].num);
			
			if (amount > 0) {
				// Inventory is full.
				
				QuestForge.current.inventoryEngine.inventory.remove(equip[0].item, equip[0].num - amount);
				return;
			}
			else {
				equip[0] = new QuestForge.current.ItemSlot(item, item.equipMaxStack);
				inventory[current].num -= item.equipMaxStack;
			}
		}
		
		this.inventoryOffset = QuestForge.current.inventoryEngine.offset;
		this.inventoryX = x;
		this.inventoryY = y;
		
		this.character.updateStats();
		this.updateEquipmentList();
		QuestForge.current.inventoryEngine.drawList();
		this.initCursor();
	},
	
	inventoryCancel: function (item, current, x, y) {
		QuestForge.current.soundEngine.play('sfx-cursor');
		this.inventoryOffset = QuestForge.current.inventoryEngine.offset;
		this.inventoryX = x;
		this.inventoryY = y;
		this.initCursor();
	},
};
