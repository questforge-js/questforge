"use strict";

QuestForge.prototype.InputEngine = function (props) {
	var key, keyUCFirst;
	
	this.conf = {
		debug: false,
		distinguishGamepads: false,
		keybindings: {
			action: [222, 69, 'button2'], // ', E
			run: [59, 186, 81, 16, 'button3'], // ;, Q, Shift
			cancel: [59, 186, 81, 'button3'], // ;, Q
			menu: [13, 'button8'], // Enter
			left: [65, 37, 'button15'], // A, Left arrow
			up: [87, 38, 'button12'], // W, Up arrow
			right: [68, 39, 'button13'], // D, Right arrow
			down: [83, 40, 'button14'], // S, Down arrow
			critical: [222, 69, 'button2'], // ', E
			cycleUp: [33], // PageUp
			cycleDown: [34], // PageDown
			
			// Editor
			export: [27], // Esc
			grab: [13, 'button2'], // Enter
			plot: [32, 'button1'], // Space
			patternInfo: [73, 'button9'], // "i" key
		},
	};
	
	QuestForge.applyProperties(props, this.conf);
	
	this.keyNamesThrottled = {};
	this.keyNamesProgressive = {};
	this.keyStates = {};
	this.gamepadButtonStates = [];
	
	for (key in this.conf.keybindings) {
		if (this.conf.keybindings.hasOwnProperty(key)) {
			this.keyStates[key] = false;
			
			keyUCFirst = key.substr(0, 1).toUpperCase()+key.substr(1);
			
			this.keyNamesThrottled[key] = 'throttled'+keyUCFirst;
			this.keyNamesProgressive[key] = 'progressive'+keyUCFirst;
			this.keyStates[this.keyNamesThrottled[key]] = false;
			this.keyStates[this.keyNamesProgressive[key]] = false;
		}
	}
	
	QuestForge.current.input = this.keyStates;
};

QuestForge.registerEngine('InputEngine', []);

QuestForge.prototype.InputEngine.prototype = {
	conf: null,
	
	keyNamesThrottled: null,
	keyNamesProgressive: null,
	
	keyStates: null,
	gamepadButtonStates: null,
	
	repeatDelay: 20,
	repeatRate: 4,
	
	repeatKey: null,
	repeatTime: 0,
	repeatProgTime: 0,
	repeatProgInitRate: 12,
	repeatProgRate: 0,
	
	//== Functions ==//
	
	throttledActive: function (key) {
		return (this.keyStates[this.keyNamesThrottled[key]] === true || (this.repeatTime > this.repeatDelay && this.conf.keybindings[key].indexOf(this.repeatKey) !== -1));
	},
	
	setPulsingKey: function (keyCode, throttledValue, progressiveValue) {
		var key;
		
		for (key in this.conf.keybindings) {
			if (this.conf.keybindings.hasOwnProperty(key) && this.conf.keybindings[key].indexOf(keyCode) !== -1) {
				this.keyStates[this.keyNamesThrottled[key]] = throttledValue;
				this.keyStates[this.keyNamesProgressive[key]] = progressiveValue;
			}
		}
	},
	
	blur: function () {
		var key;
		
		for (key in this.conf.keybindings) {
			if (this.conf.keybindings.hasOwnProperty(key)) {
				this.keyStates[key] = false;
			}
		}
		
		if (this.repeatKey !== null) {
			this.setPulsingKey(this.repeatKey, false, false);
			this.repeatKey = null;
			this.repeatTime = 0;
			this.repeatProgTime = 0;
			this.repeatProgRate = this.repeatProgInitRate;
		}
	},
	
	keyChange: function (keyCode, keyIsDown) {
		var key, matched;
		
		if (this.conf.debug === true) {
			console.log('Input code '+JSON.stringify(keyCode)+': '+(keyIsDown ? '1' : '0'));
		}
		
		matched = false;
		
		for (key in this.conf.keybindings) {
			if (this.conf.keybindings.hasOwnProperty(key) && this.conf.keybindings[key].indexOf(keyCode) !== -1) {
				this.keyStates[key] = keyIsDown;
				matched = true;
			}
		}
		
		if (keyIsDown === true && this.repeatKey !== keyCode) {
			this.setPulsingKey(this.repeatKey, false, false);
			this.setPulsingKey(keyCode, true, true);
			this.repeatKey = keyCode;
			this.repeatTime = 0;
			this.repeatProgTime = 0;
			this.repeatProgRate = this.repeatProgInitRate;
		}
		else if (keyIsDown === false && this.repeatKey === keyCode) {
			this.setPulsingKey(this.repeatKey, false, false);
			this.repeatKey = null;
			this.repeatTime = 0;
			this.repeatProgTime = 0;
			this.repeatProgRate = this.repeatProgInitRate;
		}
		
		return matched;
	},
	
	tick: function () {
		var progressiveValue, throttledValue;
		
		if (navigator.getGamepads !== undefined) {
			this.gamepadTick();
		}
		
		if (this.repeatKey !== null) {
			throttledValue = (this.repeatTime === 0 || this.repeatTime === this.repeatDelay + 1);
			progressiveValue = (this.repeatProgTime === 0);
			
			this.setPulsingKey(this.repeatKey, throttledValue, progressiveValue);
			
			++this.repeatTime;
			
			if (this.repeatTime > this.repeatDelay + this.repeatRate) {
				this.repeatTime = this.repeatDelay + 1;
			}
			
			if (this.repeatProgRate > 1) {
				++this.repeatProgTime;
				
				if (this.repeatProgTime > this.repeatProgRate - 1) {
					this.repeatProgTime = 0;
					--this.repeatProgRate;
				}
			}
		}
	},
	
	gamepadTick: function () {
		var button, gamepad, gamepads, i, j, pressed;
		
		gamepads = navigator.getGamepads();
		
		for (i = 0; i < gamepads.length; ++i) {
			gamepad = gamepads[i];
			
			if (gamepad !== undefined && gamepad.connected === true) {
				if (this.gamepadButtonStates[i] === undefined) {
					this.gamepadButtonStates[i] = [];
				}
				
				for (j = 0; j < gamepad.buttons.length; ++j) {
					button = gamepad.buttons[j];
					
					if (button.pressed !== undefined) {
						pressed = (button.value > 0 || button.pressed === true);
					}
					else {
						pressed = (button > 0);
					}
					
					if (this.gamepadButtonStates[i][j] === undefined) {
						this.gamepadButtonStates[i][j] = false;
					}
					
					if (this.gamepadButtonStates[i][j] !== pressed) {
						this.gamepadButtonStates[i][j] = pressed;
						this.keyChange(this.conf.distinguishGamepads ? 'button'+i+','+j : 'button'+j, pressed);
					}
				}
			}
		}
	},
};
