"use strict";

QuestForge.prototype.InventoryEngine = function (props) {
	this.conf = {
	};
	
	QuestForge.applyProperties(props, this.conf);
};

QuestForge.registerEngine('InventoryEngine', []);

QuestForge.prototype.InventoryEngine.prototype = {
	conf: null,
	
	colSpacing: null,
	disableChar: null,
	enabledChecker: null,
	eventHandler: null,
	height: null,
	inventory: null,
	nameRewriter: null,
	numCols: null,
	numDisplayThreshold: null,
	offset: null,
	rearrangeable: null,
	spriteX: null,
	spriteY: null,
	width: null,
	x: null,
	y: null,
	
	initCursorX: null,
	initCursorY: null,
	
	colWidth: null,
	itemsPerPage: null,
	positions: null,
	numReachableItems: null, // Will only be unequal to the inventory size if the inventory size isn't divisible by the number of columns.
	
	eventHandler: null,
	
	selection: null,
	
	dialogs: [],
	
	//== Initialization ==//
	
	expandBox: function (bufferName, x, y, width, height, props) {
		var dialogProps;
		
		this.prepare(props);
		
		dialogProps = {
			bufferName: bufferName,
			message: this.getList(),
			x: x,
			y: y,
			width: width,
			height: height,
		};
		
		this.dialogs.push(dialogProps);
		QuestForge.current.dialogEngine.expandBox(dialogProps);
	},
	
	contractBox: function () {
		QuestForge.current.dialogEngine.contractBox(this.dialogs.pop());
	},
	
	prepare: function (props) {
		var numRows, positions, x, y,
		    view;
		
		view = QuestForge.current.view;
		
		this.colSpacing = (props.colSpacing !== undefined ? props.colSpacing : 2);
		this.disableString = (props.disableString !== undefined ? props.disableString : null);
		this.enabledChecker = (props.enabledChecker !== undefined ? props.enabledChecker : null);
		this.eventHandler = (props.eventHandler !== undefined ? props.eventHandler : QuestForge.current.game.currentEngine);
		this.inventory = (props.inventory !== undefined ? props.inventory : QuestForge.current.game.currentParty.items);
		this.nameRewriter = (props.nameRewriter !== undefined ? props.nameRewriter : null);
		this.numCols = (props.numCols !== undefined ? props.numCols : 2);
		this.numDisplayThreshold = (props.numDisplayThreshold !== undefined ? props.numDisplayThreshold : 1);
		this.offset = (props.offset !== undefined ? props.offset : 0);
		this.rearrangeable = (props.rearrangeable !== undefined ? props.rearrangeable : true);
		this.spriteX = (props.spriteX !== undefined ? props.spriteX : 0);
		this.spriteY = (props.spriteY !== undefined ? props.spriteY : 0);
		this.x = (props.x !== undefined ? props.x : 4);
		this.y = (props.y !== undefined ? props.y : 5);
		
		this.initCursorX = (props.cursorX !== undefined ? props.cursorX : 0);
		this.initCursorY = (props.cursorY !== undefined ? props.cursorY : 0);
		
		this.height = (props.height !== undefined ? props.height : view.conf.height - 2 - this.y);
		this.width = (props.width !== undefined ? props.width : view.conf.width - 2 - this.x);
		
		this.selection = null;
		this.dialogProps = null;
		
		this.eventHandler = (props.eventHandler !== undefined ? props.eventHandler : QuestForge.current.game.currentEngine);
		
		numRows = this.height >>> 1;
		this.colWidth = Math.floor(this.width / this.numCols);
		this.itemsPerPage = this.numCols * numRows;
		this.numReachableItems = this.inventory.length - (this.inventory.length % this.numCols);
		
		// Make sure the offset is a multiple of numCols.
		
		this.offset -= this.offset % this.numCols;
		
		// Set up cursor positions.
		
		this.positions = new Array(this.numCols);
		
		for (x = 0; x < this.numCols; ++x) {
			this.positions[x] = new Array(numRows);
			
			for (y = 0; y < numRows; ++y) {
				this.positions[x][y] = [
					x * this.colWidth + this.x,
					y * 2 + this.y
				];
			}
		}
	},
	
	init: function (props) {
		this.prepare(props);
		this.drawList();
		this.initCursor();
	},
	
	initCursor: function () {
		var x, y;
		
		x = this.initCursorX;
		y = this.initCursorY - Math.floor(this.offset / this.numCols);
		QuestForge.current.game.currentEngine = this;
		
		QuestForge.current.cursorEngine.init({
			positions: this.positions,
			x: x,
			y: y,
			spriteX: this.spriteX,
			spriteY: this.spriteY,
		});
		
		this.cursorMove(x, y);
	},
	
	//== Tick functions ==//
	
	tick: function () {
	},
	
	cursorTick: function (x, y) {
		var props, q;
		
		q = QuestForge.current;
		
		if (this.eventHandler.inventoryTick !== undefined) {
			this.eventHandler.inventoryTick(x, y);
		}
		
		if (q.input.throttledCycleUp === true) {
			if (this.offset <= 0) {
				q.cursorEngine.moveToFirst();
			}
			else {
				if (this.offset >= this.itemsPerPage) {
					this.offset -= this.itemsPerPage;
				}
				else {
					this.offset = 0;
				}
				
				this.drawList();
				QuestForge.current.soundEngine.play('sfx-cursor');
				this.cursorMove(q.cursorEngine.x, q.cursorEngine.y[q.cursorEngine.x]);
			}
		}
		else if (q.input.throttledCycleDown === true) {
			if (this.offset >= this.numReachableItems - this.itemsPerPage) {
				q.cursorEngine.moveToLast();
			}
			else {
				if (this.offset <= this.numReachableItems - this.itemsPerPage * 2) {
					this.offset += this.itemsPerPage;
				}
				else {
					this.offset = this.numReachableItems - this.itemsPerPage;
					
					// Make sure the offset is a multiple of numCols.
					
					this.offset -= this.offset % this.numCols;
				}
				
				this.drawList();
				QuestForge.current.soundEngine.play('sfx-cursor');
				this.cursorMove(q.cursorEngine.x, q.cursorEngine.y[q.cursorEngine.x]);
			}
		}
		
		if (this.selection !== null && ((q.game.ticksElapsed & 2) === 0 || q.game.skippedFrame === true) && this.selection >= this.offset && this.selection < this.offset + this.itemsPerPage) {
			q.view.drawSprite(q.view.tilesets.effects, this.spriteX, this.spriteY, 2 * q.view.conf.tileWidth, 2 * q.view.conf.tileHeight,
				(((this.selection - this.offset) % this.numCols) * this.colWidth + this.x - 2) * q.view.conf.tileWidth + (q.view.conf.tileWidth >>> 1),
				(Math.floor((this.selection - this.offset) / this.numCols) * 2 + this.y) * q.view.conf.tileHeight,
				1
			);
		}
	},
	
	dialogTick: function (dialogState, newHeight) {
		if (this.eventHandler.dialogTick !== undefined) {
			this.eventHandler.dialogTick(dialogState, newHeight);
		}
	},
	
	//== Drawing ==//
	
	drawList: function () {
		QuestForge.current.dialogEngine.drawText(this.x, this.y, this.getList());
	},
	
	getList: function () {
		var i, item, itemLength, j, list, listItem, num, numItems,
		    dialogEngine, game;
		
		dialogEngine = QuestForge.current.dialogEngine;
		game = QuestForge.current.game;
		
		numItems = this.itemsPerPage;
		
		if (numItems > this.numReachableItems - this.offset) {
			numItems = this.numReachableItems - this.offset;
		}
		
		list = '';
		
		for (i = 0, j = 1; i < numItems; ++i) {
			num = this.inventory.num(i + this.offset);
			item = this.inventory.item(i + this.offset);
			listItem = item === null ? '' : item.name;
			
			if (this.nameRewriter !== null) {
				listItem = this.nameRewriter(listItem);
			}
			
			itemLength = this.colWidth - this.colSpacing - (num >= this.numDisplayThreshold ? 3 : 0);
			listItem = listItem.substr(0, itemLength);
			listItem = game.padRight(listItem, itemLength);
			
			if (num >= this.numDisplayThreshold) {
				listItem += game.padLeft(num, 3);
			}
			
			if (item !== null && this.enabledChecker !== null && this.enabledChecker(item) === false) {
				if (this.disableString === null) {
					listItem = dialogEngine.getDisabledText(listItem);
				}
				else {
					listItem = dialogEngine.overlayString(listItem, this.disableString);
				}
			}
			
			list += listItem;
			
			if (j < this.numCols) {
				list += game.padLeft('', this.colSpacing);
				
				++j;
			}
			else {
				list += "\n";
				
				j = 1;
			}
		}
		
		return list;
	},
	
	//== Cursor events ==//
	
	cursorAction: function (x, y) {
		var amount, current, item, selection;
		
		current = this.offset + y * this.numCols + x;
		
		if (this.rearrangeable === false || this.selection === current) {
			this.selection = null;
			
			if (this.eventHandler.inventoryAction !== undefined) {
				item = this.inventory.item(current);
				
				if (this.enabledChecker === null || this.enabledChecker(item) === true) {
					QuestForge.current.soundEngine.play('sfx-cursor');
					this.eventHandler.inventoryAction(item, current, x, y + Math.floor(this.offset / this.numCols));
				}
			}
		}
		else if (this.rearrangeable === true) {
			QuestForge.current.soundEngine.play('sfx-cursor');
			
			if (this.selection === null) {
				this.selection = current;
			}
			else {
				if (this.inventory.item(current) === null || this.inventory.item(this.selection) === null || this.inventory.item(current).id !== this.inventory.item(this.selection).id) {
					// Swapping the contents of two item slots.
					
					this.inventory.swap(current, this.selection);
					selection = this.selection;
					this.selection = null;
					this.drawList();
					
					if (this.eventHandler.inventorySwap !== undefined) {
						this.eventHandler.inventorySwap(this.inventory.item(current), current, selection, x, y + Math.floor(this.offset / this.numCols));
					}
				}
				else {
					// Moving items between two slots of the same item type.
					
					amount = Math.min(this.inventory.num(this.selection), this.inventory.item(current).maxStack - this.inventory.num(current));
					this.inventory.items[current].num += amount;
					
					if (this.inventory.num(this.selection) > amount) {
						this.inventory.items[this.selection].num -= amount;
					}
					else {
						this.inventory.items[this.selection] = null;
					}
				}
				
				selection = this.selection;
				this.selection = null;
				this.drawList();
				
				if (this.eventHandler.inventorySwap !== undefined) {
					this.eventHandler.inventorySwap(this.inventory.item(current), current, selection, x, y + Math.floor(this.offset / this.numCols));
				}
			}
		}
	},
	
	cursorCancel: function (x, y) {
		var current;
		
		if (this.selection !== null) {
			this.selection = null;
		}
		else if (this.eventHandler.inventoryCancel !== undefined) {
			current = this.offset + y * this.numCols + x;
			this.eventHandler.inventoryCancel(this.inventory.item(current), current, x, y + Math.floor(this.offset / this.numCols));
		}
	},
	
	cursorChangeCol: function (oldX, newX) {
		QuestForge.current.cursorEngine.y[newX] = QuestForge.current.cursorEngine.y[oldX];
	},
	
	cursorMove: function (x, y) {
		var current;
		
		if (this.eventHandler.inventoryMove !== undefined) {
			current = this.offset + y * this.numCols + x;
			this.eventHandler.inventoryMove(this.inventory.item(current), current, x, y + Math.floor(this.offset / this.numCols));
		}
	},
	
	cursorThudDown: function (x) {
		if (this.offset < this.numReachableItems - this.itemsPerPage) {
			this.offset += this.numCols;
			this.drawList();
			QuestForge.current.soundEngine.play('sfx-cursor');
			this.cursorMove(x, QuestForge.current.cursorEngine.y[x]);
		}
	},
	
	cursorThudLeft: function (y) {
		var cursorEngine;
		
		if (y > 0 || this.offset > 0) {
			cursorEngine = QuestForge.current.cursorEngine;
			cursorEngine.x = this.numCols - 1;
			cursorEngine.y[cursorEngine.x] = y;
			cursorEngine.moveUp();
		}
	},
	
	cursorThudRight: function (y) {
		var i,
		    cursorEngine;
		
		cursorEngine = QuestForge.current.cursorEngine;
		
		if (y < cursorEngine.positions[cursorEngine.x].length - 1 || this.offset < this.numReachableItems - this.itemsPerPage) {
			cursorEngine.x = 0;
			cursorEngine.y[cursorEngine.x] = y;
			cursorEngine.moveDown();
		}
	},
	
	cursorThudUp: function (x) {
		if (this.offset > 0) {
			this.offset -= this.numCols;
			this.drawList();
			QuestForge.current.soundEngine.play('sfx-cursor');
			this.cursorMove(x, 0);
		}
	},
};
