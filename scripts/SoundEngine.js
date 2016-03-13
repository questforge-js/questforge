"use strict";

QuestForge.prototype.SoundEngine = function (props) {
	this.conf = {
	};
	
	QuestForge.applyProperties(props, this.conf);
	
	this.tracks = {};
	this.trackList = [];
	this.current = {};
};

QuestForge.registerEngine('SoundEngine', []);

QuestForge.prototype.SoundEngine.prototype = {
	conf: null,
	
	context: null,
	
	tracks: null,
	trackList: null,
	current: null,
	music: null,
	
	addTrack: function (props) {
		var track;
		
		track = QuestForge.addIdentifiable(QuestForge.current.Track, this.trackList, props);
		this.tracks[track.name] = track;
		return track;
	},
	
	init: function () {
		var i, j, channel, node, track;
		
		if (AudioContext !== undefined) {
			this.context = new AudioContext();
		}
		else if (webkitAudioContext !== undefined) {
			this.context = new webkitAudioContext();
		}
		else {
			// Browser doesn't support Web Audio API.
			return;
		}
		
		for (i = 0; i < this.trackList.length; ++i) {
			track = this.trackList[i];
			
			for (channel in track.urls) {
				if (track.urls.hasOwnProperty(channel) === true) {
					(function (q, track, channel) {
						var r;
						
						++q.numPreloads;
						
						r = new XMLHttpRequest();
						r.open('GET', track.urls[channel], true);
						r.responseType = 'arraybuffer';
						
						r.onload = function () {
							q.soundEngine.context.decodeAudioData(r.response, function (buffer) {
								track.buffers[channel] = buffer;
								q.itemPreloaded();
							});
						}
						
						r.send();
					})(QuestForge.current, track, channel);
				}
			}
		}
	},
	
	play: function (track, channel, time, delay) {
		var bufferSource, i;
		
		if (typeof track === 'string') {
			track = this.tracks[track];
		}
		
		if (channel === undefined) {
			if (track.loopStart >= 0) {
				this.music = track;
			}
			
			for (channel in track.buffers) {
				if (track.buffers.hasOwnProperty(channel) === true) {
					this.play(track, channel, time, delay);
				}
			}
		}
		else {
			if (delay === undefined) {
				this.stop(channel);
			}
			
			if (track.buffers.hasOwnProperty(channel) === true) {
				bufferSource = this.context.createBufferSource();
				bufferSource.buffer = track.buffers[channel];
				
				if (this.current[channel] === undefined) {
					this.current[channel] = {};
				}
				
				this.current[channel].track = track;
				this.current[channel].bufferSource = bufferSource;
				
				if (track.loopStart >= 0) {
					bufferSource.loop = true;
					bufferSource.loopStart = track.loopStart;
					this.current[channel].refTime = this.context.currentTime - (time === undefined ? 0 : time) + (delay === undefined ? 0 : delay);
					
					if (track.loopEnd === null) {
						bufferSource.loopEnd = track.buffers[channel].duration;
					}
					else {
						bufferSource.loopEnd = track.loopEnd;
					}
				}
				
				bufferSource.connect(this.context.destination);
				bufferSource.start(this.context.currentTime + (delay === undefined ? 0 : delay), time === undefined ? 0 : time);
				
				if (track.loopStart < 0 && this.music !== null && this.music.buffers.hasOwnProperty(channel) === true) {
					// We're playing a sound effect, and we want
					// to resume music playback on this channel
					// once the sound effect finishes playing.
					
					this.resume(channel, track.buffers[channel].duration + (delay === undefined ? 0 : delay));
				}
			}
		}
	},
	
	resume: function (channel, delay) {
		var refTime, time;
		
		if (channel === undefined) {
			for (channel in this.current) {
				if (this.current.hasOwnProperty(channel) === true) {
					this.resume(channel, delay);
				}
			}
		}
		else if (this.current.hasOwnProperty(channel) === true) {
			if (this.music !== null && this.music.buffers.hasOwnProperty(channel) === true) {
				if (this.current[channel].track !== this.music || this.current[channel].bufferSource === null) {
					time = this.context.currentTime - this.current[channel].refTime + (delay === undefined ? 0 : delay);
					
					if (this.music.loopStart >= 0 && time >= this.music.loopStart) {
						time -= this.music.loopStart;
						time %= (this.music.loopEnd === null ? this.music.buffers[channel].duration : this.music.loopEnd) - this.music.loopStart;
						time += this.music.loopStart;
					}
					
					refTime = this.current[channel].refTime;
					this.play(this.music, channel, time, delay);
					this.current[channel].refTime = refTime;
				}
			}
		}
	},
	
	stop: function (channel, delay) {
		var i;
		
		if (channel === undefined) {
			for (channel in this.current) {
				if (this.current.hasOwnProperty(channel) === true) {
					this.stop(channel, delay);
				}
			}
		}
		else if (this.current.hasOwnProperty(channel) === true && this.current[channel].bufferSource !== null) {
			this.current[channel].bufferSource.stop(this.context.currentTime + (delay === undefined ? 0 : delay));
			this.current[channel].bufferSource = null;
		}
	},
};
