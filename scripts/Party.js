"use strict";

QuestForge.prototype.Party = function (props) {
	var i;
	
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('items') === false) {
		this.items = new QuestForge.current.Inventory({
			length: QuestForge.current.game.conf.partyInventorySize,
		});
	}
	
	if (props.hasOwnProperty('lineup') === false) {
		this.lineup = new Array(this.maxMembers);
		
		for (i = 0; i < this.maxMembers; ++i) {
			this.lineup[i] = new QuestForge.current.LineupSlot({
				lineup: this.lineup,
				position: i,
			});
		}
	}
	
	if (props.hasOwnProperty('members') === false) {
		this.members = [];
	}
};

QuestForge.prototype.Party.prototype = {
	id: null,
	
	items: null,
	gold: 0,
	
	maxMembers: 4,
	members: null,
	lineup: null,
	
	leader: null,
	
	//== Functions ==//
	
	addMember: function (character) {
		var i;
		
		if (this.members.length >= this.maxMembers) {
			// QuestForge.Party is full.
			
			return false;
		}
		
		for (i = 0; i < this.members.length; ++i) {
			if (this.members[i].id === character.id) {
				// Character is already a member.
				
				return false;
			}
		}
		
		// Add the character to the party.
		
		this.members.push(character);
		
		// Find an empty slot in the lineup and add the character.
		
		for (i = 0; i < this.lineup.length; ++i) {
			if (this.lineup[i].character === null) {
				this.lineup[i].character = character;
				
				if (this.leader === null) {
					this.setLeader(this.lineup[i]);
				}
				break;
			}
		}
		
		return true;
	},
	
	removeMember: function (character) {
		var i;
		
		// Remove the character from the lineup.
		
		for (i = 0; i < this.lineup.length; ++i) {
			if (this.lineup[i].character !== null && this.lineup[i].character.id === character.id) {
				this.lineup[i].character = null;
				break;
			}
		}
		
		if (this.leader.character === null) {
			// The leader has been removed. Pick another leader.
			
			this.setNextLeader(i);
		}
		
		// Remove the character from the party membership.
		
		for (i = 0; i < this.members.length; ++i) {
			if (this.members[i].id === character.id) {
				this.members.splice(i, 1);
				return true;
			}
		}
		
		// The character wasn't a member.
		
		return false;
	},
	
	setLeader: function (lineupSlot) {
		var game;
		
		game = QuestForge.current.game;
		
		this.leader = lineupSlot;
		
		if (game.currentParty !== null && game.currentParty.id === this.id) {
			game.setCurrentParty(this);
		}
	},
	
	setLeaderHelper: function (i, inc) {
		while (i >= 0 && i < this.lineup.length) {
			if (this.lineup[i].character !== null) {
				this.setLeader(this.lineup[i]);
				return true;
			}
			
			i += inc;
		}
		
		return false;
	},
	
	setNextLeader: function (i) {
		if (i === undefined) {
			if (this.leader === null) {
				i = 0;
			}
			else {
				i = this.leader.position + 1;
			}
		}
		
		this.leader = null;
		
		if (i !== 0) {
			if (this.setLeaderHelper(i, 1)) {
				return;
			}
		}
		
		this.setLeaderHelper(0, 1);
		
		// If there are no current members, the leader will be null. Adding a member will set the leader to that new member. If the active party finishes a tick without any members, bad things may happen.
	},
	
	setPreviousLeader: function (i) {
		var lastI;
		
		lastI = this.lineup.length - 1;
		
		if (i === undefined) {
			if (this.leader === null) {
				i = lastI;
			}
			else {
				i = this.leader.position - 1;
			}
		}
		
		this.leader = null;
		
		if (i !== lastI) {
			if (this.setLeaderHelper(i, -1)) {
				return;
			}
		}
		
		this.setLeaderHelper(lastI, -1);
		
		// If there are no current members, the leader will be null. Adding a member will set the leader to that new member. If the active party finishes a tick without any members, bad things may happen.
	},
	
	swapPositions: function (position1, position2) {
		var lineupSlot;
		
		lineupSlot = this.lineup[position1];
		this.lineup[position1] = this.lineup[position2];
		this.lineup[position2] = lineupSlot;
		
		this.lineup[position1].position = position1;
		this.lineup[position2].position = position2;
	},
	
	setRow: function (position, row) {
		this.lineup[position].row = row;
	},
	
	toggleRow: function (position) {
		this.setRow(position, this.lineup[position].row ^ 1);
	},
	
	giveGold: function (amount) {
		this.gold += amount;
		
		if (this.gold > 9999999) {
			this.gold = 9999999;
		}
	},
	
	takeGold: function (amount) {
		if (this.gold >= amount) {
			this.gold -= amount;
			return true;
		}
		
		return false;
	},
};
