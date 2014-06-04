/**
 * music21j -- Javascript reimplementation of Core music21p features.  
 * music21/stream -- Streams -- objects that hold other Music21Objects
 * 
 * Does not implement the full features of music21p Streams by a long shot...
 *
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */
define(['music21/base','music21/renderOptions','music21/clef', 'music21/vfShow', 'jquery'], function(require) {   
    var stream = {};
	
	stream.Stream = function () {
		music21.base.Music21Object.call(this);
		this.classes.push('Stream');
		this._duration = undefined;
		
	    this._elements = [];
	    this._elementOffsets = [];
	    this._clef = undefined;
	    this.displayClef = undefined;
	    
	    this._keySignature =  undefined; // a music21.key.KeySignature object
	    this._timeSignature = undefined; // temp hack -- a string...
	    
	    this.autoBeam = true;
	    this.activeVFStave = undefined;
	    this.renderOptions = new music21.renderOptions.RenderOptions();
	    this._tempo = undefined;

        this.staffLines = 5;

	    this._stopPlaying = false;
	    this._allowMultipleSimultaneousPlays = true; // not implemented yet.

	    
	    Object.defineProperties(this, {
            'duration': {
                configurable: true,
                enumerable: true,
                get: function () {
                    if (this._duration !== undefined) {
                        return this._duration;
                    }
                    var highestTime = 0.0;
                    for (var i = 0; i < this.length; i++) {
                        var el = this.get(i);
                        var endTime = el.offset;
                        if (el.duration !== undefined) {
                            endTime += el.duration.quarterLength;                            
                        } 
                        if (endTime > highestTime) {
                            highestTime = endTime;
                        }
                    }
                    return new music21.duration.Duration(highestTime);
                },
                set: function(newDuration) {
                    this._duration = newDuration;
                }
            },
	        'flat': {
                configurable: true,
                enumerable: true,
	    		get: function () {
	    			if (this.hasSubStreams()) {
	        			var tempEls = [];
	        			for (var i = 0; i < this.length; i++) {
	        				var el = this.get(i);
	        				//console.log(i, this.length);
	        				if (el.elements !== undefined) {
	                            var offsetShift = el.offset;
	                            //console.log('offsetShift', offsetShift, el.classes[el.classes.length -1]);
	                            var elFlat = el.flat;
	                            for (var j = 0; j < elFlat.length; j++) {
	                                // offset should NOT be null because already in Stream
	                                elFlat.get(j).offset += offsetShift;
	                            }
	                            tempEls.push.apply(tempEls, elFlat._elements);
	        				} else {
	        				    tempEls.push(el);
	        				}	        				
	        			}
	                    var newSt = music21.common.copyStream(this);
	                    newSt.elements = tempEls;
	        			return newSt;
	    			} else {
	    				return this;
	    			}
	    		},
	    	},
	    	'notes': {
                configurable: true,
                enumerable: true,
                get: function () { return this.getElementsByClass(['Note','Chord']); },
	    	},
            'notesAndRests': {
                configurable: true,
                enumerable: true,
                get: function () { return this.getElementsByClass('GeneralNote'); },
            },

	    	'tempo': {
                configurable: true,
                enumerable: true,
				get: function () {
					if (this._tempo == undefined && this.parent != undefined) {
						return this.parent.tempo;
					} else if (this._tempo == undefined) {
						return 150;
					} else {
						return this._tempo;
					}
				},
				set: function (newTempo) {
					this._tempo = newTempo;
				}
			},
			'clef': {
                configurable: true,
                enumerable: true,
				get: function () {
					if (this._clef == undefined && this.parent == undefined) {
						return new music21.clef.Clef('treble');
					} else if (this._clef == undefined) {
						return this.parent.clef;
					} else {
						return this._clef;
					}
				},
				set: function (newClef) {
					this._clef = newClef;
				}
			},
			'keySignature': {
                configurable: true,
                enumerable: true,
				get: function () {
					if (this._keySignature == undefined && this.parent != undefined) {
						return this.parent.keySignature;
					} else {
						return this._keySignature;
					}
				},
				set: function (newKeySignature) {
					this._keySignature = newKeySignature;
				}
			},
			'timeSignature': {
                configurable: true,
                enumerable: true,
				get: function () {
					if (this._timeSignature == undefined && this.parent != undefined) {
						return this.parent.timeSignature;
					} else {
						return this._timeSignature;
					}
				},
				set: function (newTimeSignature) {
					if (typeof(newTimeSignature) == 'string') {
					    newTimeSignature = new music21.meter.TimeSignature(newTimeSignature);
					}
				    this._timeSignature = newTimeSignature;
				}
			},
			'maxSystemWidth': {
                configurable: true,
                enumerable: true,
				get: function () {
					if (this.renderOptions.maxSystemWidth == undefined && this.parent != undefined) {
						return this.parent.maxSystemWidth;
					} else if (this.renderOptions.maxSystemWidth != undefined) {
						return this.renderOptions.maxSystemWidth;
					} else {
						return 750;
					}
				},
				set: function (newSW) {
					this.renderOptions.maxSystemWidth = newSW;
				}
			},
			'parts': {
                configurable: true,
                enumerable: true,
				get: function() {
					var parts = [];
					for (var i = 0; i < this.length; i++) {
					    var el = this.get(i);
						if (el.inClass('Part')) {
							parts.push(el);
						}
					}
					return parts;
				}
			},
			'measures': {
                configurable: true,
                enumerable: true,
                /* TODO -- make Stream */
				get: function() {
					var measures = [];
					for (var i = 0; i < this.length; i++) {
						var el = this.get(i);
					    if (el.inClass('Measure')) {
							measures.push(el);
						}
					}
					return measures;
				}
			},
			'length': {
                configurable: true,
                enumerable: true,
				get: function() {
					return this.elements.length;
				}
			},
			'elements': {
                configurable: true,
                enumerable: true,
				get: function() {
					return this._elements;
				},
				set: function(newElements) {
//				    this._elements = newElements;
//				    
				    var highestOffsetSoFar = 0.0;
				    this._elements = [];
				    this._elementOffsets = [];
				    var tempInsert = [];
				    for (var i = 0; i < newElements.length; i++) {
				        var thisEl = newElements[i];
				        var thisElOffset = thisEl.offset;
				        if (thisElOffset == null || thisElOffset == highestOffsetSoFar) {
				            // append
				            this._elements.push(thisEl);
				            thisEl.offset = highestOffsetSoFar;
				            this._elementOffsets.push(highestOffsetSoFar);
				            highestOffsetSoFar += thisEl.duration.quarterLength;
				        } else { // append -- slow
				            tempInsert.push(thisEl);
				        }
				    }
				    //console.warn('end', highestOffsetSoFar, tempInsert);
				    for (var i = 0; i < tempInsert.length; i++ ) {
				        var thisEl = tempInsert[i];
				        this.insert(thisEl.offset, thisEl);
				    }
				}
			}
	    });
	    
	    
	    /*  VexFlow functionality */
	    
   
	    this.vexflowStaffWidth = undefined;
	    this.estimateStaffLength = function () {
	    	if (this.vexflowStaffWidth != undefined) {
	    		//console.log("Overridden staff width: " + this.vexflowStaffWidth);
	    		return this.vexflowStaffWidth;
	    	}
	    	if (this.hasSubStreams()) { // part
	    		var totalLength = 0;
	    		for (var i = 0; i < this.length; i++) {
	    			var m = this.get(i);
	    			totalLength += m.estimateStaffLength() + m.renderOptions.staffPadding;
	    			if ((i != 0) && (m.renderOptions.startNewSystem == true)) {
	    				break;
	    			}
	    		}
	    		return totalLength;
	    	} else {
	    		var rendOp = this.renderOptions;
		    	var totalLength = 30 * this.length;
				totalLength += rendOp.displayClef ? 20 : 0;
				totalLength += (rendOp.displayKeySignature && this.keySignature) ? this.keySignature.width : 0;
				totalLength += rendOp.displayTimeSignature ? 30 : 0; 
				//totalLength += rendOp.staffPadding;
				return totalLength;
	    	}
	    };

	    this.estimateStreamHeight = function (ignoreSystems) {
	    	var staffHeight = 120;
	    	var systemPadding = 30;
	    	if (this.isClassOrSubclass('Score')) {
	    		var numParts = this.length;
	    		var numSystems = this.numSystems();
	    		if (numSystems == undefined || ignoreSystems) {
	    			numSystems = 1;
	    		}
	    		var scoreHeight = (numSystems * staffHeight * numParts) + ((numSystems - 1) * systemPadding);
	    		//console.log('scoreHeight of ' + scoreHeight);
	    		return scoreHeight;
	    	} else if (this.isClassOrSubclass('Part')) {
	    		var numSystems = 1;
	    		if (!ignoreSystems) {
	    			numSystems = this.numSystems();
	    		}
	    		if (music21.debug) {
	    			console.log("estimateStreamHeight for Part: numSystems [" + numSystems +
	    			"] * staffHeight [" + staffHeight + "] + (numSystems [" + numSystems +
	    			"] - 1) * systemPadding [" + systemPadding + "]."
	    			);
	    		}
	    		return numSystems * staffHeight + (numSystems - 1) * systemPadding;
	    	} else {
	    		return staffHeight;
	    	}
	    };

	    this.setSubstreamRenderOptions = function () {
	    	/* does nothing for standard streams ... */
	    };
	    this.resetRenderOptionsRecursive = function () {
	    	this.renderOptions = new music21.renderOptions.RenderOptions();
	    	for (var i = 0; i < this.length; i++) {
	    		var el = this.get(i);
	    		if (el.isClassOrSubclass('Stream')) {
	    			el.resetRenderOptionsRecursive();
	    		}
	    	}
	    };
       this.renderVexflowOnCanvas = function (canvas) {
           vfr = new music21.vfShow.Renderer(this, canvas);
           vfr.render();
       };

	    /* MIDI related routines... */
	    
	    this.playStream = function (startNote) {
	    	/*
	    	 */
	        var currentNote = 0;
	        if (startNote !== undefined) {
	        	currentNote = startNote;
	        }
	        var flatEls = this.flat.elements;
	        var lastNote = flatEls.length;
	        var tempo = this.tempo;
	        this._stopPlaying = false;
	        var thisStream = this;
	        
	        var playNext = function (elements) {
	            if (currentNote < lastNote && !thisStream._stopPlaying) {
	                var el = elements[currentNote];
	                var nextNote = undefined;
	                if (currentNote < lastNote + 1) {
	                    nextNote = elements[currentNote + 1];
	                }
	                var milliseconds = 60 * 1000 / tempo;
	                if (el.duration !== undefined) {
    	                    
    	                var ql = el.duration.quarterLength;
    	                milliseconds = 60 * ql * 1000 / tempo;
    	                if (el.isClassOrSubclass('Note')) { // Note, not rest
    				 	    var midNum = el.pitch.midi;
    				 	    music21.MIDI.noteOn(0, midNum, 100, 0);
    				 	    var stopTime = milliseconds/1000;
    				 	    if (nextNote !== undefined && nextNote.isClassOrSubclass('Note')) {
    				 	        if (nextNote.pitch.midi != el.pitch.midi) {
    				 	            stopTime += 60 * .25 / tempo; // legato -- play 16th note longer
    				 	        }
    				 	    } else if (nextNote === undefined) {
    				 	        // let last note ring an extra beat...
    				 	        stopTime += 60 * 1 / tempo;
    				 	    }
    				 	    //console.log(stopTime);
    				 	    music21.MIDI.noteOff(0, midNum, stopTime);
    				    } else if (el.isClassOrSubclass('Chord')) {
    					    for (var j = 0; j < el._noteArray.length; j++) {
    					 	    var midNum = el._noteArray[j].pitch.midi;
    					 	   music21.MIDI.noteOn(0, midNum, 100, 0);					   
                               music21.MIDI.noteOff(0, midNum, milliseconds/1000);                     
    					    }
    				    } // rest -- do nothing -- milliseconds takes care of it...
	                }
	                currentNote += 1;
	            	setTimeout( function () { playNext(elements); }, milliseconds);
	            }
	        };
	        playNext(flatEls);
	    };
	    
	    this.stopPlayStream = function () {
	        // turns off all currently playing MIDI notes (on any stream) and stops playback.
	    	this._stopPlaying = true;
	    	for (var i = 0; i < 127; i++) {
	    	    music21.MIDI.noteOff(0, midNum, 0);
	    	}
		};
	    
		/** ----------------------------------------------------------------------
		 * 
		 *  Canvas routines -- to be factored out eventually.
		 * 
		 */
		
		this.createNewCanvas = function (scaleInfo, width, height) {
	    	if (this.hasSubStreams() ) { 
	    		this.setSubstreamRenderOptions();
	    	}

			if (scaleInfo == undefined) {
	    		scaleInfo = { height: '100px', width: 'auto'};
	    	}
			var newCanvas = $('<canvas/>', scaleInfo);

			if (width != undefined) {
				newCanvas.attr('width', width);
			} else {
			    var computedWidth = this.estimateStaffLength() + this.renderOptions.staffPadding + 0;
				newCanvas.attr('width', computedWidth);
			}
			if (height != undefined) {
				newCanvas.attr('height', height);		
			} else {
				var computedHeight;
				if (this.renderOptions.height == undefined) {
					computedHeight = this.estimateStreamHeight();
					//console.log('computed Height estim: ' + computedHeight);
				} else {
					computedHeight = this.renderOptions.height;
					//console.log('computed Height: ' + computedHeight);
				}
				newCanvas.attr('height', computedHeight );
				// TODO: CUT HEIGHT! -- use VexFlow ctx.scale(0.7, 0.7);
				newCanvas.css('height', Math.floor(computedHeight * 0.7).toString() + "px");
			}
			return newCanvas;
		};
	    this.createPlayableCanvas = function (scaleInfo, width, height) {
			this.renderOptions.events['click'] = 'play';
			return this.createCanvas();
	    };
	    this.createCanvas = function(scaleInfo, width, height) {
			var newCanvas = this.createNewCanvas(scaleInfo, width, height);
	        this.drawCanvas(newCanvas[0]);
	        return newCanvas;    
	    };
	    
	    this.drawCanvas = function (canvas) {
	    	this.renderVexflowOnCanvas(canvas);
	        canvas.storedStream = this;
	        this.setRenderInteraction(canvas);    
	    };    
	    
	    this.appendNewCanvas = function (bodyElement, scaleInfo, width, height) {
	        if (bodyElement == undefined) {
	            bodyElement = 'body';
	        }
	        canvasBlock = this.createCanvas(scaleInfo, width, height);
	        $(bodyElement).append(canvasBlock);
			return canvasBlock[0];
	    };
	    
	    this.replaceLastCanvas = function (bodyElement, scaleInfo) {
	        if (bodyElement == undefined) {
	            bodyElement = 'body';
	        }
	        canvasBlock = this.createCanvas(scaleInfo);
	        $(bodyElement + " " + 'canvas').replaceWith(canvasBlock);
			return canvasBlock[0];
		};
        this.renderScrollableCanvas = function (where) {
            var $where = where;
            if (where === undefined) {
                $where = $(document.body);
            } else if (where.jquery === undefined) {
                $where = $(where);
            }
            var $innerDiv = $("<div>").css('position', 'absolute');
            var c = undefined;            
            this.renderOptions.events.click = function(storedThis) { 
                return function (event) {
                    storedThis.scrollScoreStart(c, event);
                };
            }(this); // create new function with this stream as storedThis
            // remove 0.7 when height is normalized...
            c = this.appendNewCanvas( $innerDiv, {} );
            var h = $(c).css('height');
            h = h.substring(0, h.length - 2);
            $(c).css('height', h / 0.7 );
            this.setRenderInteraction( $innerDiv );
            $where.append( $innerDiv );
        };
        this.scrollScoreStart = function (c, event) {
            var offsetToPixelMaps = function(s, c) {
                var ns = s.flat.notesAndRests;
                var allMaps = [];
                var pixelScaling = s.getPixelScaling(c);
                for (var i = 0; i < ns.length; i++) {
                    var n = ns.get(i);
                    var currentOffset = n.offset;
                    var foundPreviousMap = false; // multi parts...
                    for (var j = allMaps.length - 1; j >= 0; j = j - 1) {
                        // find the last map with this offset. searches backwards for speed.
                        var oldMap = allMaps[j];
                        if (oldMap.offset == currentOffset) {
                            //console.log('found element at offset', currentOffset, 'existing el', 
                            //        oldMap.elements[0].nameWithOctave, 'new el', n.nameWithOctave);
                            oldMap.elements.push(n);
                            foundPreviousMap = true;
                        }
                    }
                    if (foundPreviousMap == false) {
                        var map = {};
                        map.elements = [n];
                        map.offset = currentOffset;
                        map.x = n.x * pixelScaling;
                        allMaps.push(map);
                    }
                }
                allMaps.push( {
                    elements: [undefined],
                    offset: ns.get(-1).duration.quarterLength + ns.get(-1).offset,
                    x: ns.get(-1).x + 12, // hack -- assume 12 pixels wide final note
                });
                return allMaps;            
            };
            var getXAtOffset = function(offset, offsetToPixelMap) {
                var prevNoteMap = undefined;
                var nextNoteMap = undefined;
                for (var i = 0; i < offsetToPixelMap.length; i++) {
                    thisMap = offsetToPixelMap[i];
                    if (thisMap.offset <= offset) {
                        prevNoteMap = thisMap;
                    } 
                    if (thisMap.offset >= offset ) {
                        nextNoteMap = thisMap;
                        break;
                    }
                }
                if (prevNoteMap === undefined && nextNoteMap === undefined) {
                    return offsetToPixelMap[offsetToPixelMap.length - 1].x;   
                } else if (prevNoteMap === undefined) {
                    prevNoteMap = nextNoteMap;
                } else if (nextNoteMap === undefined) {
                    nextNoteMap = prevNoteMap;
                }
                var offsetFromPrev = offset - prevNoteMap.offset;
                var offsetDistance = nextNoteMap.offset - prevNoteMap.offset;
                var pixelDistance = nextNoteMap.x - prevNoteMap.x;
                var offsetToPixelScale = 0;
                if (offsetDistance != 0) {
                    offsetToPixelScale = pixelDistance/offsetDistance;                    
                } else {
                    offsetToPixelScale = 0;   
                }
                var pixelsFromPrev = offsetFromPrev * offsetToPixelScale;
                var offsetX = prevNoteMap.x + pixelsFromPrev;
                return offsetX;
            };            

            var tempo = this.tempo;
            //console.log('tempo' , tempo);
            var pm = offsetToPixelMaps(this);
            var maxX = pm[pm.length - 1].x;
            var svgDOM = music21.common.makeSVGright('svg', {
                'height': c.height.toString() +'px',
                'width': c.width.toString() + 'px',
                'style': 'position:absolute; top: 0px; left: 0px;',
            });
            var startX = pm[0].x;
            var barDOM = music21.common.makeSVGright('rect', {
                width: 10, 
                height: c.height - 6, 
                x: startX, 
                y: 3,
                style: 'fill: rgba(255, 255, 20, .5);stroke:white',    
            } );
            svgDOM.appendChild(barDOM);
      
            // TODO: generalize...
            var parent = $(c).parent()[0];
            parent.appendChild(svgDOM);
            lastX = 0;
            lastNoteIndex = -1;
            scrollInfo = {
                    pm: pm, 
                    startTime: new Date().getTime(),
                    tempo: tempo,
                    maxX: maxX,
                    barDOM: barDOM,
                    lastX: lastX,
                    lastNoteIndex: lastNoteIndex,
                    svgDOM: svgDOM,
                    canvasParent: parent,
                    storedStream: this,
                    lastTimeout: undefined, // setTimeout
            };
            var scrollScore = function (i) {
                var timeSinceStartInMS = new Date().getTime() - i.startTime;
                var offset = timeSinceStartInMS/1000 * i.tempo/60;
                var pm = i.pm;
                var x = getXAtOffset(offset, pm);
                x = Math.floor(x);
                if (x > i.lastX) {
                    i.barDOM.setAttribute('x', x);
                    i.lastX = x;    
                }
                // pm is a pixelMap not a Stream
                for (var j = 0; j < pm.length; j++) {
                    var pmOff = pm[j].offset;
                    if (j <= lastNoteIndex) {
                        continue;
                    } else if (Math.abs(offset - pmOff) > .1) {
                        continue;
                    }
                    var elList = pm[j].elements;
                    for (var elIndex = 0; elIndex < elList.length; elIndex++) {
                        var el = elList[elIndex];
                        if (el !== undefined) {
                            var offTime = el.duration.quarterLength * 60/i.tempo;
                            if (el.pitch !== undefined) {
                                var midNum = el.pitch.midi;
                                music21.MIDI.noteOn(0, midNum, 100, 0);
                                music21.MIDI.noteOff(0, midNum, offTime);                                                    
                            } else if (el.pitches !== undefined) {
                                for (var pitchIndex = 0; pitchIndex < el.pitches.length; pitchIndex++) {
                                    var p = el.pitches[pitchIndex];
                                    var midNum = p.midi;
                                    music21.MIDI.noteOn(0, midNum, 100, 0);
                                    music21.MIDI.noteOff(0, midNum, offTime);
                                }
                            }
                        }
                    }
                    lastNoteIndex = j;
                    
                }
                //console.log(x, offset);
                //console.log(barDOM.setAttribute);
                var advanceTime = 0.05;
                var newTimeout = undefined;
                if (x < i.maxX) {
                    newTimeout = setTimeout( function () { scrollScore(i); }, advanceTime * 1000);                  
                    i.lastTimeout = newTimeout;
                } else {
                    var fauxEvent = undefined;
                    i.storedStream.scrollScoreStop(fauxEvent, i);
                }
            };
            this.savedRenderOptionClick = this.renderOptions.events.click;
            this.renderOptions.events.click = function (e) { scrollInfo.storedStream.scrollScoreStop(e, scrollInfo); };
            this.setRenderInteraction(parent);
            scrollScore(scrollInfo); 
            if (event !== undefined) {
                event.stopPropagation();
            }
        };
        this.scrollScoreStop = function(event, i) {
            this.renderOptions.events.click = this.savedRenderOptionClick;
            i.barDOM.setAttribute('style', 'display:none');
            // TODO: generalize...
            i.canvasParent.removeChild(i.svgDOM);
            if (i.lastTimeout !== undefined) {
                clearTimeout(i.lastTimeout);
            }
            this.setRenderInteraction(parent);
            if (event !== undefined) {
                event.stopPropagation();
            }
            //console.log('should stop', this, i);
        };
        
        this.setRenderInteraction = function (canvasOrDiv) {
			/*
			 * Set the type of interaction on the canvas based on 
			 *    Stream.renderOptions.events['click']
			 *    Stream.renderOptions.events['dblclick']
             *    Stream.renderOptions.events['resize']
			 *    
			 * Currently the only options available for each are:
			 *    'play' (string)
			 *    'reflow' (string; only on event['resize'])
			 *    customFunction (will receive event as a first variable; should set up a way to
			 *                    find the original stream; var s = this; var f = function () { s...}
			 *                   )
			 */
		    var $canvas = canvasOrDiv;
		    if (canvasOrDiv === undefined) {
		        return;
		    } else if (canvasOrDiv.jquery === undefined) {
		        $canvas = $(canvasOrDiv);
		    }
		    // TODO: assumes that canvas has a .storedStream function? can this be done by setting
		    // a variable var storedStream = this; and thus get rid of the assumption?
		    
			$.each(this.renderOptions.events, $.proxy(function (eventType, eventFunction) {
			    $canvas.off(eventType);
				if (typeof(eventFunction) == 'string' && eventFunction == 'play') {
					$canvas.on(eventType, function () { this.storedStream.playStream(); });
				} else if (typeof(eventFunction) == 'string' && eventType == 'resize' && eventFunction == 'reflow') {
				    this.windowReflowStart($canvas);
				} else if (eventFunction != undefined) {
					$canvas.on(eventType, eventFunction);
				}
			}, this ) );
		};
		this.recursiveGetStoredVexflowStave = function () {
			/*
			 * Recursively search downward for the closest storedVexflowStave...
			 */
			var storedVFStave = this.storedVexflowStave;
			if (storedVFStave == undefined) {
				if (!this.hasSubStreams()) {
					return undefined;
				} else {
					storedVFStave = this.get(0).storedVexflowStave;
					if (storedVFStave == undefined) {
						// bad programming ... should support continuous recurse
						// but good enough for now...
						if (this.get(0).hasSubStreams()) {
							storedVFStave = this.get(0).get(0).storedVexflowStave;
						}
					}
				}
			}
			return storedVFStave;
		};
		
		this.getPixelScaling = function (canvas) {
			if (canvas == undefined) {
				return 1;
			}
			var canvasHeight = $(canvas).height();
			//var css = parseFloat(jCanvas.css('height'));
			
			var storedVFStave = this.recursiveGetStoredVexflowStave();
			var lineSpacing = storedVFStave.options.spacing_between_lines_px;
			var linesAboveStaff = storedVFStave.options.space_above_staff_ln;
			var totalLines = (storedVFStave.options.num_lines - 1) + linesAboveStaff + storedVFStave.options.space_below_staff_ln;
			/* var firstLineOffset = ( (storedVFStave.options.num_lines - 1) + linesAboveStaff) * lineSpacing; 
			   var actualVFStaffOnlyHeight = (storedVFStave.height - (linesAboveStaff * lineSpacing)); */
			var pixelScaling = totalLines * lineSpacing/canvasHeight;		
			if (music21.debug) {
				console.log('canvasHeight: ' + canvasHeight + " totalLines*lineSpacing: " + totalLines*lineSpacing + " staveHeight: " + storedVFStave.height);
			}
			return pixelScaling;
		};
		this.getUnscaledXYforCanvas = function (canvas, e) {
			/*
			 * return a list of [Y, X] for
			 * a canvas element
			 */
			var offset = null;
			if (canvas == undefined) {
				offset = {left: 0, top: 0};
			} else {
				offset = $(canvas).offset();			
			}
			/*
			 * mouse event handler code from: http://diveintohtml5.org/canvas.html
			 */
			var xClick, yClick;
			if (e.pageX != undefined && e.pageY != undefined) {
				xClick = e.pageX;
				yClick = e.pageY;
			} else { 
				xClick = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				yClick = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}
			var xPx = (xClick - offset.left);
			var yPx = (yClick - offset.top);
			return [yPx, xPx];
		};
		
		this.getScaledXYforCanvas = function (canvas, e) {
			/*
			 * return a list of [scaledY, scaledX] for
			 * a canvas element
			 */
			var _ = this.getUnscaledXYforCanvas(canvas, e);
			var xPx = _[1];
			var yPx = _[0];
			var pixelScaling = this.getPixelScaling(canvas);
			
			var yPxScaled = yPx * pixelScaling;
			var xPxScaled = xPx * pixelScaling;
			return [yPxScaled, xPxScaled];
		};
		this.diatonicNoteNumFromScaledY = function (yPxScaled) {
			/*
			 * Given a Y position find the note at that position.
			 * searches this.storedVexflowStave
			 */
			var storedVFStave = this.recursiveGetStoredVexflowStave();
			var lineSpacing = storedVFStave.options.spacing_between_lines_px;
			var linesAboveStaff = storedVFStave.options.space_above_staff_ln;

			var notesFromTop = yPxScaled * 2 / lineSpacing;
			var notesAboveFirstLine = ((storedVFStave.options.num_lines - 1 + linesAboveStaff) * 2 ) - notesFromTop;
			var clickedDiatonicNoteNum = this.clef.firstLine + Math.round(notesAboveFirstLine);
			return clickedDiatonicNoteNum;
		};
		this.noteElementFromScaledX = function (xPxScaled, allowablePixels, y) {
			/*
			 * Return the note at pixel X (or within allowablePixels [default 10])
			 * of the note.
			 * 
			 * y element is optional and used to discover which part or system
			 * we are on
			 */
			var foundNote = undefined;
			if (allowablePixels == undefined) {
				allowablePixels = 10;	
			}

			for (var i = 0; i < this.length; i ++) {
				var n = this.get(i);
				/* should also
				 * compensate for accidentals...
				 */
				if (xPxScaled > (n.x - allowablePixels) && 
						xPxScaled < (n.x + n.width + allowablePixels)) {
					foundNote = n;
					break; /* O(n); can be made O(log n) */
				}
			}		
			//console.log(n.pitch.nameWithOctave);
			return foundNote;
		};
		
		this.canvasClickedNotes = function (canvas, e, x, y) {
			/*
			 * Return a list of [diatonicNoteNum, closestXNote]
			 * for an event (e) called on the canvas (canvas)
			 */
			if (x == undefined || y == undefined) {
				var _ = this.getScaledXYforCanvas(canvas, e);
				y = _[0];
				x = _[1];
			}
			var clickedDiatonicNoteNum = this.diatonicNoteNumFromScaledY(y);
			var foundNote = this.noteElementFromScaledX(x, undefined, y);
			return [clickedDiatonicNoteNum, foundNote];
		};
		
		this.changedCallbackFunction = undefined;
		
		this.canvasChangerFunction = function (e) {
			/* N.B. -- not to be called on a stream -- "this" refers to the CANVAS
			
				var can = s.appendNewCanvas();
				$(can).on('click', s.canvasChangerFunction);
			
			*/
			var ss = this.storedStream;
			var _ = ss.canvasClickedNotes(this, e),
				 clickedDiatonicNoteNum = _[0],
				 foundNote = _[1];
			if (foundNote == undefined) {
				if (music21.debug) {
					console.log('No note found');				
				}
			}
			return ss.noteChanged(clickedDiatonicNoteNum, foundNote, this);
		};

		this.noteChanged = function (clickedDiatonicNoteNum, foundNote, canvas) {
			if (foundNote != undefined) {
				var n = foundNote;
				p = new music21.pitch.Pitch("C");
				p.diatonicNoteNum = clickedDiatonicNoteNum;
				p.accidental = n.pitch.accidental;
				n.pitch = p;
				n.stemDirection = undefined;
				this.clef.setStemDirection(n);
				this.activeNote = n;
				this.redrawCanvas(canvas);
				if (this.changedCallbackFunction != undefined) {
					this.changedCallbackFunction({foundNote: n, canvas: canvas});
				}
			}
		};
		
		this.redrawCanvas = function (canvas) {
			//this.resetRenderOptionsRecursive();
			//this.setSubstreamRenderOptions();
			var newCanv = this.createNewCanvas( { height: canvas.style.height,
												   width: canvas.style.width },
												canvas.width,
												canvas.height );
			this.drawCanvas(newCanv[0]);
			$(canvas).replaceWith( newCanv );		
			stream.jQueryEventCopy($.event, $(canvas), newCanv); /* copy events -- using custom extension... */
		};
		
		this.editableAccidentalCanvas = function (scaleInfo, width, height) {
			/*
			 * Create an editable canvas with an accidental selection bar.
			 */
			var d = $("<div/>").css('text-align','left').css('position','relative');
			var buttonDiv = this.getAccidentalToolbar();
			d.append(buttonDiv);
			d.append( $("<br clear='all'/>") );
			this.renderOptions.events['click'] = this.canvasChangerFunction;
			var can = this.appendNewCanvas(d, scaleInfo, width, height);
			if (scaleInfo == undefined) {
				$(can).css('height', '140px');
			}
			return d;
		};

		
		/*
		 * Canvas toolbars...
		 */
		
		this.getAccidentalToolbar = function () {
			
			var addAccidental = function (clickedButton, alter) {
				/*
				 * To be called on a button...
				 *   this will usually refer to a window Object
				 */
				var accidentalToolbar = $(clickedButton).parent();
				var siblingCanvas = accidentalToolbar.parent().find("canvas");
				var s = siblingCanvas[0].storedStream;
				if (s.activeNote != undefined) {
					n = s.activeNote;
					n.pitch.accidental = new music21.pitch.Accidental(alter);
					/* console.log(n.pitch.name); */
					s.redrawCanvas(siblingCanvas[0]);
					if (s.changedCallbackFunction != undefined) {
						s.changedCallbackFunction({canvas: siblingCanvas[0]});
					}
				}
			};

			
			var buttonDiv = $("<div/>").attr('class','buttonToolbar vexflowToolbar').css('position','absolute').css('top','10px');
			buttonDiv.append( $("<span/>").css('margin-left', '50px'));
			buttonDiv.append( $("<button>♭</button>").click( function () { addAccidental(this, -1); } ));
			buttonDiv.append( $("<button>♮</button>").click( function () { addAccidental(this, 0); } ));
			buttonDiv.append( $("<button>♯</button>").click( function () { addAccidental(this, 1); } ));
			return buttonDiv;

		};
		this.getPlayToolbar = function () {
			var playStream = function (clickedButton) {
				var playToolbar = $(clickedButton).parent();
				var siblingCanvas = playToolbar.parent().find("canvas");
				var s = siblingCanvas[0].storedStream;
				s.playStream();
			};
			var stopStream = function (clickedButton) {
				var playToolbar = $(clickedButton).parent();
				var siblingCanvas = playToolbar.parent().find("canvas");
				var s = siblingCanvas[0].storedStream;
				s.stopStream();
			};
			var buttonDiv = $("<div/>").attr('class','playToolbar vexflowToolbar').css('position','absolute').css('top','10px');
			buttonDiv.append( $("<span/>").css('margin-left', '50px'));
			buttonDiv.append( $("<button>&#9658</button>").click( function () { playStream(this); } ));
			buttonDiv.append( $("<button>&#9724</button>").click( function () { stopStream(this); } ));
			return buttonDiv;		
		};
        // reflow
        
        this.windowReflowStart = function (jCanvas) {
            // set up a bunch of windowReflow bindings that affect the canvas.
            var callingStream = this;
            var jCanvasNow = jCanvas;
            $(window).bind('resizeEnd', function() {
                //do something, window hasn't changed size in 500ms
                var jCanvasParent = jCanvasNow.parent();
                var newWidth = jCanvasParent.width();
                var canvasWidth = newWidth;
                //console.log(canvasWidth);
                //console.log('resizeEnd triggered', newWidth);
                callingStream.resetRenderOptionsRecursive();
                callingStream.maxSystemWidth = canvasWidth - 40;
                jCanvasNow.remove();
                var canvasObj = callingStream.appendNewCanvas(jCanvasParent);
                jCanvasNow = $(canvasObj);
            });
            $(window).resize( function() {
                if (this.resizeTO) {
                    clearTimeout(this.resizeTO);
                }
                this.resizeTO = setTimeout(function() {
                    $(this).trigger('resizeEnd');
                }, 200);
            });
            setTimeout(function() {
                $(this).trigger('resizeEnd');
            }, 1000);
        };

	};

	stream.Stream.prototype = new music21.base.Music21Object();
	stream.Stream.prototype.constructor = stream.Stream;

	stream.Stream.prototype.append = function (el) {
        try {
            if ((el.isClassOrSubclass !== undefined) && el.isClassOrSubclass('NotRest')) {
                this.clef.setStemDirection(el);         
            }
            var elOffset = 0.0;
            if (this._elements.length > 0) {
                var lastQL = this._elements[this._elements.length - 1].duration.quarterLength;
                elOffset = this._elementOffsets[this._elementOffsets.length - 1] + lastQL;
            }
            this._elementOffsets.push(elOffset);
            this._elements.push(el);
            el.offset = elOffset;
            el.parent = this; // would prefer weakref, but does not exist in JS.
        } catch (err) {
            console.error("Cannot append element ", el, " to stream ", this, " : ", err);
        }
    };

    stream.Stream.prototype.insert = function (offset, el) {
        try {
            if ((el.isClassOrSubclass !== undefined) && el.isClassOrSubclass('NotRest')) {
                this.clef.setStemDirection(el);         
            }
            for (var i = 0; i < this._elements.length; i++) {
                var testOffset = this._elementOffsets[i];
                if (testOffset <= offset) {
                    continue;
                } else {
                    this._elementOffsets.splice(i, 0, offset);
                    this._elements.splice(i, 0, el);
                    el.offset = offset;
                    el.parent = this;
                    return;
                }
            }
            // no element found. insert at end;
            this._elementOffsets.push(offset);
            this._elements.push(el);
            el.offset = offset;
            el.parent = this; // would prefer weakref, but does not exist in JS.
        } catch (err) {
            console.error("Cannot insert element ", el, " to stream ", this, " : ", err);
        }
    };
    stream.Stream.prototype.get = function(index) {
        // substitute for Python stream __getitem__; supports -1 indexing, etc.
        if (index === undefined) { 
            return undefined;
        } else if (Math.abs(index) >= this._elements.length) {
            return undefined;
        } else if (index == this._elements.length) {
            return undefined;
        } else if (index < 0) {
            var el = this._elements[this._elements.length + index];
            el.offset = this._elementOffsets[this._elements.length + index];
            return el;
        } else {
            var el = this._elements[index];
            el.offset = this._elementOffsets[index];
            return el;
        }  
    };
    
    stream.Stream.prototype.hasSubStreams = function () {
        var hasSubStreams = false;
        for (var i = 0; i < this.length; i++) {
            var el = this.elements[i];
            if (el.isClassOrSubclass('Stream')) {
                hasSubStreams = true;
                break;
            }
        }
        return hasSubStreams;
    };
    stream.Stream.prototype.getElementsByClass = function (classList) {
        var tempEls = [];
        for (var i = 0; i < this.length; i++ ) {
            var thisEl = this.get(i);
            //console.warn(thisEl);
            if (thisEl.isClassOrSubclass === undefined) {
                console.err('what the hell is a ', thisEl, 'doing in a Stream?');
            } else if (thisEl.isClassOrSubclass(classList)) {
                tempEls.push(thisEl);
            }
        }
        var newSt = new stream.Stream(); // TODO: take Stream class Part, etc.
        newSt.elements = tempEls;
        return newSt;           
    };
    
    stream.Stream.prototype.makeAccidentals = function () {
        // cheap version of music21p method
        var extendableStepList = {};
        var stepNames = ['C','D','E','F','G','A','B'];
        for (var i = 0; i < stepNames.length; i++) {
            var stepName = stepNames[i];
            var stepAlter = 0;
            if (this.keySignature != undefined) {
                var tempAccidental = this.keySignature.accidentalByStep(stepName);
                if (tempAccidental != undefined) {
                    stepAlter = tempAccidental.alter;
                    //console.log(stepAlter + " " + stepName);
                }
            }
            extendableStepList[stepName] = stepAlter;
        }
        var lastOctaveStepList = [];
        for (var i =0; i < 10; i++) {
            var lastStepDict = $.extend({}, extendableStepList);
            lastOctaveStepList.push(lastStepDict);
        }
        var lastOctavelessStepDict = $.extend({}, extendableStepList); // probably unnecessary, but safe...
        for (var i = 0; i < this.length; i++) {
            el = this.get(i);
            if (el.pitch != undefined) {
                var p = el.pitch;
                var lastStepDict = lastOctaveStepList[p.octave];
                this.makeAccidentalForOnePitch(p, lastStepDict, lastOctavelessStepDict);
            } else if (el._noteArray != undefined) {
                for (var j = 0; j < el._noteArray.length; j++) {
                    var p = el._noteArray[j].pitch;
                    var lastStepDict = lastOctaveStepList[p.octave];
                    this.makeAccidentalForOnePitch(p, lastStepDict, lastOctavelessStepDict);
                }
            }
        }
    };

    stream.Stream.prototype.makeAccidentalForOnePitch = function (p, lastStepDict, lastOctavelessStepDict) {
        var newAlter;
        if (p.accidental == undefined) {
            newAlter = 0;
        } else {
            newAlter = p.accidental.alter;
        }
        //console.log(p.name + " " + lastStepDict[p.step].toString());
        if ((lastStepDict[p.step] != newAlter) ||
            (lastOctavelessStepDict[p.step] != newAlter)
             ) {
            if (p.accidental === undefined) {
                p.accidental = new music21.pitch.Accidental('natural');
            }
            p.accidental.displayStatus = true;
            //console.log("setting displayStatus to true");
        } else if ( (lastStepDict[p.step] == newAlter) &&
                    (lastOctavelessStepDict[p.step] == newAlter) ) {
            if (p.accidental !== undefined) {
                p.accidental.displayStatus = false;
            }
            //console.log("setting displayStatus to false");
        }
        lastStepDict[p.step] = newAlter;
        lastOctavelessStepDict[p.step] = newAlter;
    };	
	
	
	stream.Measure = function () { 
		stream.Stream.call(this);
		this.classes.push('Measure');
	};

	stream.Measure.prototype = new stream.Stream();
	stream.Measure.prototype.constructor = stream.Measure;

	stream.Part = function () {
		stream.Stream.call(this);
		this.classes.push('Part');
		this.systemHeight = 120;
		
		this.canvasChangerFunction = function (e) {
			/* N.B. -- not to be called on a stream -- "this" refers to the CANVAS
			
				var can = s.appendNewCanvas();
				$(can).on('click', s.canvasChangerFunction);
			
				overrides Stream().canvasChangerFunction
			*/
			var ss = this.storedStream;
			var _ = ss.findSystemForClick(this, e),
				 clickedDiatonicNoteNum = _[0],
				 foundNote = _[1];
			return ss.noteChanged(clickedDiatonicNoteNum, foundNote, this);
		};

		this.findSystemForClick = function(canvas, e) {
			var _ = this.getUnscaledXYforCanvas(canvas, e);
			var y = _[0];
			var x = _[1];
			
			var scalingFunction = this.estimateStreamHeight()/$(canvas).height();
			if (music21.debug) {
				console.log('Scaling function: ' + scalingFunction + ', i.e. this.estimateStreamHeight(): ' + 
						this.estimateStreamHeight() + " / $(canvas).height(): " + $(canvas).height());
			}
			var scaledY = y * scalingFunction;
			var systemIndex = Math.floor(scaledY / this.systemHeight);
			var clickedDiatonicNoteNum = this.diatonicNoteNumFromScaledY(scaledY);
			
			var scaledX = x * scalingFunction;
			var foundNote = this.noteElementFromScaledX(scaledX, undefined, scaledY, systemIndex);
			return [clickedDiatonicNoteNum, foundNote];
		};
		
		this.noteElementFromScaledX = function (scaledX, allowablePixels, scaledY, systemIndex) {
			/*
			 * Override the noteElementFromScaledX for Stream
			 * to take into account sub measures...
			 * 
			 */
			var gotMeasure = undefined;
			for (var i = 0; i < this.length; i++) {
				var m = this.get(i);
				var rendOp = m.renderOptions;
				var left = rendOp.left;
				var right = left + rendOp.width;
				var top = rendOp.top;
				var bottom = top + rendOp.height;
				if (music21.debug) {
					console.log("Searching for X:" + Math.round(scaledX) + 
							" Y:" + Math.round(scaledY) + " in M " + i + 
							" with boundaries L:" + left + " R:" + right +
							" T: " + top + " B: " + bottom);
				}
				if (scaledX >= left && scaledX <= right ){
					if (systemIndex == undefined) {
						gotMeasure = m;
						break;
					} else if (rendOp.systemIndex == systemIndex) {
						gotMeasure = m;
						break;
					}
				}
			}
			if (gotMeasure) {
				return gotMeasure.noteElementFromScaledX(scaledX, allowablePixels);
			}
		};
		this.setSubstreamRenderOptions = function () {
			var currentMeasureIndex = 0; /* 0 indexed for now */
			var currentMeasureLeft = 20;
			var rendOp = this.renderOptions;
			for (var i = 0; i < this.length; i++) {
				var el = this.get(i);
				if (el.isClassOrSubclass('Measure')) {
					var elRendOp = el.renderOptions;
					elRendOp.measureIndex = currentMeasureIndex;
					elRendOp.top = rendOp.top;
					elRendOp.partIndex = rendOp.partIndex;
					elRendOp.left = currentMeasureLeft;
					
					if (currentMeasureIndex == 0) {
						elRendOp.displayClef = true;
						elRendOp.displayKeySignature = true;
						elRendOp.displayTimeSignature = true;
					} else {
						elRendOp.displayClef = false;
						elRendOp.displayKeySignature = false;
						elRendOp.displayTimeSignature = false;					
					}
					elRendOp.width = el.estimateStaffLength() + elRendOp.staffPadding;
					elRendOp.height = el.estimateStreamHeight();
					currentMeasureLeft += elRendOp.width;
					currentMeasureIndex++;
				}
			}
		};
		
		this.getMeasureWidths = function () {
			/* call after setSubstreamRenderOptions */
			var measureWidths = [];
			for (var i = 0; i < this.length; i++) {
				var el = this.get(i);
				if (el.isClassOrSubclass('Measure')) {
					var elRendOp = el.renderOptions;
					measureWidths[elRendOp.measureIndex] = elRendOp.width;
				}
			}
			/* console.log(measureWidths);
			 * 
			 */
			return measureWidths;
		};
		this.estimateStaffLength = function () {
	        if (this.vexflowStaffWidth != undefined) {
	            //console.log("Overridden staff width: " + this.vexflowStaffWidth);
	            return this.vexflowStaffWidth;
	        }
	        if (this.hasSubStreams()) { // part with Measures underneath
	            var totalLength = 0;
	            for (var i = 0; i < this.length; i++) {
	                var m = this.get(i);
	                // this looks wrong, but actually seems to be right. moving it to
	                // after the break breaks things.
                    totalLength += m.estimateStaffLength() + m.renderOptions.staffPadding;
	                if ((i != 0) && (m.renderOptions.startNewSystem == true)) {
	                    break;
	                }
	            }
	            return totalLength;
	        };		    
	        // no measures found in part... treat as measure
	        var tempM = new music21.stream.Measure();
	        tempM.elements = this.elements;
	        return tempM.estimateStaffLength();
		};
		
		this.fixSystemInformation = function (systemHeight) {
			/*
			 * Divide a part up into systems and fix the measure
			 * widths so that they are all even.
			 * 
			 * Note that this is done on the part level even though
			 * the measure widths need to be consistent across parts.
			 * 
			 * This is possible because the system is deterministic and
			 * will come to the same result for each part.  Opportunity
			 * for making more efficient through this...
			 */
			/* 
			 * console.log('system height: ' + systemHeight);
			 */
			if (systemHeight == undefined) {
				systemHeight = this.systemHeight; /* part.show() called... */
			} else {
				if (music21.debug) {
					console.log ('overridden systemHeight: ' + systemHeight);
				}
			}
			var measureWidths = this.getMeasureWidths();
			var maxSystemWidth = this.maxSystemWidth; /* of course fix! */
			var systemCurrentWidths = [];
			var systemBreakIndexes = [];
			var lastSystemBreak = 0; /* needed to ensure each line has at least one measure */
			var startLeft = 20; /* TODO: make it obtained elsewhere */
			var currentLeft = startLeft;
			for (var i = 0; i < measureWidths.length; i++) {
				var currentRight = currentLeft + measureWidths[i];
				/* console.log("left: " + currentLeft + " ; right: " + currentRight + " ; m: " + i); */
				if ((currentRight > maxSystemWidth) && (lastSystemBreak != i)) {
					systemBreakIndexes.push(i-1);
					systemCurrentWidths.push(currentLeft);
					//console.log('setting new width at ' + currentLeft);
					currentLeft = startLeft + measureWidths[i];
					lastSystemBreak = i;
				} else {
					currentLeft = currentRight;
				}
			}
			//console.log(systemCurrentWidths);
			//console.log(systemBreakIndexes);

			var currentSystemIndex = 0;
			var leftSubtract = 0;
			for (var i = 0; i < this.length; i++) {
				var m = this.get(i);
				if (i == 0) {
					m.renderOptions.startNewSystem = true;
				}
				var currentLeft = m.renderOptions.left;

				if ($.inArray(i - 1, systemBreakIndexes) != -1) {
					/* first measure of new System */
					leftSubtract = currentLeft - 20;
					m.renderOptions.displayClef = true;
					m.renderOptions.displayKeySignature = true;
					m.renderOptions.startNewSystem = true;
					currentSystemIndex++;
				} else if (i != 0) {
					m.renderOptions.startNewSystem = false;
					m.renderOptions.displayClef = false;
					m.renderOptions.displayKeySignature = false;
				}
				m.renderOptions.systemIndex = currentSystemIndex;
				var currentSystemMultiplier;
				if (currentSystemIndex >= systemCurrentWidths.length) {
					/* last system... non-justified */;
					currentSystemMultiplier = 1;
				} else {
					var currentSystemWidth = systemCurrentWidths[currentSystemIndex];
					currentSystemMultiplier = maxSystemWidth / currentSystemWidth;
					//console.log('systemMultiplier: ' + currentSystemMultiplier + ' max: ' + maxSystemWidth + ' current: ' + currentSystemWidth);
				}
				/* might make a small gap? fix? */
				var newLeft = currentLeft - leftSubtract;
				//console.log('M: ' + i + ' ; old left: ' + currentLeft + ' ; new Left: ' + newLeft);
				m.renderOptions.left = Math.floor(newLeft * currentSystemMultiplier);
				m.renderOptions.width = Math.floor(m.renderOptions.width * currentSystemMultiplier);
				var newTop = m.renderOptions.top + (currentSystemIndex * systemHeight);
				//console.log('M: ' + i + '; New top: ' + newTop + " ; old Top: " + m.renderOptions.top);
				m.renderOptions.top = newTop;
			}
			
			return systemCurrentWidths;
		};
		this.numSystems = function () {
			var numSystems = 0;
			for (var i = 0; i < this.length; i++) {
				if (this.get(i).renderOptions.startNewSystem) {
					numSystems++;
				}
			}
			if (numSystems == 0) {
				numSystems = 1;
			}
			return numSystems;
		};
	};

	stream.Part.prototype = new stream.Stream();
	stream.Part.prototype.constructor = stream.Part;

	stream.Score = function () {
		stream.Stream.call(this);
		this.classes.push('Score');
		this.measureWidths = [];
		this.partSpacing = 120;

	    this.playStream = function () {
	    	// play multiple parts in parallel...
	    	for (var i = 0; i < this.length; i++) {
	    		var el = this.get(i);
	    		if (el.isClassOrSubclass('Part')) {
	    			el.playStream();
	    		}
	    	}
	    };
	    this.stopStream = function () {
	    	for (var i = 0; i < this.length; i++) {
	    		var el = this.get(i);
	    		if (el.isClassOrSubclass('Part')) {
	    	    	el._stopPlaying = true;
	    		}
	    	}
	    };
		this.setSubstreamRenderOptions = function () {
			var currentPartNumber = 0;
			var currentPartTop = 0;
			var partSpacing = this.partSpacing;
			for (var i = 0; i < this.length; i++) {
				var el = this.get(i);
				
				if (el.isClassOrSubclass('Part')) {
					el.renderOptions.partIndex = currentPartNumber;
					el.renderOptions.top = currentPartTop;
					el.setSubstreamRenderOptions();
					currentPartTop += partSpacing;
					currentPartNumber++;
				}
			}
			this.evenPartMeasureSpacing();
			var ignoreNumSystems = true;
			var currentScoreHeight = this.estimateStreamHeight(ignoreNumSystems);
			for (var i = 0; i < this.length; i++) {
				var el = this.get(i);	
				if (el.isClassOrSubclass('Part')) {
					el.fixSystemInformation(currentScoreHeight);
				}
			}
			this.renderOptions.height =  this.estimateStreamHeight();
		};
		this.getMaxMeasureWidths = function () {
			/*  call after setSubstreamRenderOptions
			 *  gets the maximum measure width for each measure
			 *  by getting the maximum for each measure of
			 *  Part.getMeasureWidths();
			 */
			var maxMeasureWidths = [];
			var measureWidthsArrayOfArrays = [];
			for (var i = 0; i < this.length; i++) {
				var el = this.get(i);
				measureWidthsArrayOfArrays.push(el.getMeasureWidths());
			}
			for (var i = 0; i < measureWidthsArrayOfArrays[0].length; i++) {
				var maxFound = 0;
				for (var j = 0; j < this.length; j++) {
					if (measureWidthsArrayOfArrays[j][i] > maxFound) {
						maxFound = measureWidthsArrayOfArrays[j][i];
					}
				}
				maxMeasureWidths.append(maxFound);
			}
			//console.log(measureWidths);
			return maxMeasureWidths;
		};

		this.findPartForClick = function(canvas, e) {
			var _ = this.getUnscaledXYforCanvas(canvas, e);
			var y = _[0];
			var x = _[1];
			
			var scalingFunction = this.estimateStreamHeight()/$(canvas).height();
			var scaledY = y * scalingFunction;
			var partNum = Math.floor(scaledY / this.partSpacing);
			var scaledYinPart = scaledY - partNum * this.partSpacing;

			var systemIndex = undefined;
			if (partNum >= this.length) {
				systemIndex = Math.floor(partNum/this.length);
				partNum = partNum % this.length;
			}
			if (music21.debug) {
				console.log(y + " scaled = " + scaledY + " part Num: " + partNum + " scaledYinPart: " + scaledYinPart + " systemIndex: " + systemIndex);
			}
			var rightPart = this.get(partNum);
			var clickedDiatonicNoteNum = rightPart.diatonicNoteNumFromScaledY(scaledYinPart);
			
			var scaledX = x * scalingFunction;
			var foundNote = rightPart.noteElementFromScaledX(scaledX, undefined, scaledYinPart, systemIndex);
			return [clickedDiatonicNoteNum, foundNote];
		};
		
		this.canvasChangerFunction = function (e) {
			/* N.B. -- not to be called on a stream -- "this" refers to the CANVAS
			
				var can = s.appendNewCanvas();
				$(can).on('click', s.canvasChangerFunction);
			
			*/
			var ss = this.storedStream;
			var _ = ss.findPartForClick(this, e),
				 clickedDiatonicNoteNum = _[0],
				 foundNote = _[1];
			return ss.noteChanged(clickedDiatonicNoteNum, foundNote, this);
		};

		this.numSystems = function () {
			return this.get(0).numSystems();
		};

		
		this.evenPartMeasureSpacing = function () {
			var measureStacks = [];
			var currentPartNumber = 0;
			var maxMeasureWidth = [];

			for (var i = 0; i < this.length; i++) {
				var el = this.get(i);
				if (el.isClassOrSubclass('Part')) {
					var measureWidths = el.getMeasureWidths();
					for (var j = 0; j < measureWidths.length; j++) {
						thisMeasureWidth = measureWidths[j];
						if (measureStacks[j] == undefined) {
							measureStacks[j] = [];
							maxMeasureWidth[j] = thisMeasureWidth;
						} else {
							if (thisMeasureWidth > maxMeasureWidth[j]) {
								maxMeasureWidth[j] = thisMeasureWidth;
							}
						}
						measureStacks[j][currentPartNumber] = thisMeasureWidth;
					}
					currentPartNumber++;
				}
			}
			var currentLeft = 20;
			for (var i = 0; i < maxMeasureWidth.length; i++) {
				// TODO: do not assume, only elements in Score are Parts and in Parts are Measures...
				var measureNewWidth = maxMeasureWidth[i];
				for (var j = 0; j < this.length; j++) {
					var part = this.get(j);
					var measure = part.get(i);
					var rendOp = measure.renderOptions;
					rendOp.width = measureNewWidth;
					rendOp.left = currentLeft;
				}
				currentLeft += measureNewWidth;
			}
		};
		this.estimateStaffLength = function () {
		    // override
		    if (this.vexflowStaffWidth != undefined) {
                //console.log("Overridden staff width: " + this.vexflowStaffWidth);
                return this.vexflowStaffWidth;
            }
		    for (var i = 0; i < this.length; i++) {
		        var p = this.get(i);
		        if (p.isClassOrSubclass('Part')) {
		            return p.estimateStaffLength();
		        }
		    }
		    // no parts found in score... use part...
		    console.log('no parts found in score');
		    var tempPart = new music21.stream.Part();
		    tempPart.elements = this.elements;
		    return tempPart.estimateStaffLength();            
		};
		
	};

	stream.Score.prototype = new stream.Stream();
	stream.Score.prototype.constructor = stream.Score;

	/**
	 * Logic for copying events from one jQuery object to another.
	 *
	 * @private 
	 * @name music21.stream.jQueryEventCopy
	 * @param jQuery|String|DOM Element jQuery object to copy events from. Only uses the first matched element.
	 * @param jQuery|String|DOM Element jQuery object to copy events to. Copies to all matched elements.
	 * @type undefined
	 * @author Brandon Aaron (brandon.aaron@gmail.com || http://brandonaaron.net)
	 * @author Yannick Albert (mail@yckart.com || http://yckart.com)
	 */
	stream.jQueryEventCopy = function  (eventObj, from, to) {
        from = from.jquery ? from : jQuery(from);
        to = to.jquery ? to : jQuery(to);
    
        var events = from[0].events || jQuery.data(from[0], "events") || jQuery._data(from[0], "events");
        if (!from.length || !to.length || !events) return;
    
        return to.each(function () {
            for (var type in events)
                for (var handler in events[type])
                    jQuery.event.add(eventObj, type, events[type][handler], events[type][handler].data);
        });
    };
	
	
	stream.tests = function () {
	    test( "music21.stream.Stream", function() {
	        var s = new music21.stream.Stream();
	        s.append( new music21.note.Note("C#5"));
	        s.append( new music21.note.Note("D#5"));
	        var n =  new music21.note.Note("F5");
	        n.duration.type = 'half';
	        s.append(n);
	        equal (s.length, 3, "Simple stream length");
	    });

       test( "music21.stream.Stream.duration", function() {
            var s = new music21.stream.Stream();
            equal (s.duration.quarterLength, 0, "EmptyString QuarterLength");
            s.append( new music21.note.Note("C#5"));
            equal (s.duration.quarterLength, 1.0, "1 quarter QuarterLength");
            var n =  new music21.note.Note("F5");
            n.duration.type = 'half';
            s.append(n);
            equal (s.duration.quarterLength, 3.0, "3 quarter QuarterLength");
            s.duration = new music21.duration.Duration(3.0);
            s.append( new music21.note.Note("D#5"));
            equal (s.duration.quarterLength, 3.0, "overridden duration -- remains");
            
            var sc = new music21.stream.Score();
            var p1 = new music21.stream.Part();
            var p2 = new music21.stream.Part();
            var m1 = new music21.stream.Measure();
            var m2 = new music21.stream.Measure();
            var n11 = new music21.note.Note();
            var n12 = new music21.note.Note();
            n12.duration.type = 'half';
            var n13 = new music21.note.Note();
            n13.duration.type = 'eighth'; // incomplete measure
            m1.append(n11);
            m1.append(n12);
            m1.append(n13);
            var n21 = new music21.note.Note();
            n21.duration.type = 'whole';
            m2.append(n21);
            p1.append(m1);
            p2.append(m2);
            sc.insert(0, p1);
            sc.insert(0, p2);
            equal (sc.duration.quarterLength, 4.0, 'duration of streams with nested parts');
            equal (sc.flat.duration.quarterLength, 4.0, 'duration of flat stream with overlapping notes');
            n21.duration.type = 'half';
            equal (sc.duration.quarterLength, 3.5, 'new duration with nested parts');
            equal (sc.flat.duration.quarterLength, 3.5, 'new duration of flat stream');       
        });
       
       
        test( "music21.stream.Stream.insert and offsets", function () {
            var s = new music21.stream.Stream();
            s.append( new music21.note.Note("C#5"));
            var n3 = new music21.note.Note("E5");
            s.insert(2.0, n3);
            var n2 = new music21.note.Note("D#5");
            s.insert(1.0, n2);
            equal (s.get(0).name, 'C#');
            equal (s.get(1).name, 'D#');
            equal (s.get(2).name, 'E');
            equal (s.get(0).offset, 0.0);
            equal (s.get(1).offset, 1.0);
            equal (s.get(2).offset, 2.0);
            var p = new music21.stream.Part();
            var m1 = new music21.stream.Measure();
            var n1 = new music21.note.Note("C#");
            n1.duration.type = 'whole';
            m1.append(n1);
            var m2 = new music21.stream.Measure();
            var n2 = new music21.note.Note("D#");
            n2.duration.type = 'whole';
            m2.append(n2);
            p.append(m1);
            p.append(m2);
            equal (p.get(0).get(0).offset, 0.0);
            var pf = p.flat;
            equal (pf.get(1).offset, 4.0);
            var pf2 = p.flat; // repeated calls do not change
            equal (pf2.get(1).offset, 4.0, 'repeated calls do not change offset');
            var pf3 = pf2.flat;
            equal (pf3.get(1).offset, 4.0, '.flat.flat does not change offset');
            
        });
	    
	    test( "music21.stream.Stream.canvas", function() {
	        var s = new music21.stream.Stream();
	        s.append( new music21.note.Note("C#5"));
	        s.append( new music21.note.Note("D#5"));
	        var n =  new music21.note.Note("F5");
	        n.duration.type = 'half';
	        s.append(n);
	        var c = s.createNewCanvas({}, 100, 50);
	        equal (c.attr('width'), 100, 'stored width matches');
	        equal (c.attr('height'), 50, 'stored height matches');
	    });  

        test( "music21.stream.Stream.getElementsByClass", function() {
            var s = new music21.stream.Stream();
            var n1 = new music21.note.Note("C#5");
            var n2 = new music21.note.Note("D#5");
            var r = new music21.note.Rest();
            var tc = new music21.clef.TrebleClef();
            s.append( tc );
            s.append( n1 );
            s.append( r );
            s.append( n2 );
            var c = s.getElementsByClass('Note');
            equal (c.length, 2, 'got two notes');
            equal (c.get(0), n1, 'n1 first');
            equal (c.get(1), n2, 'n2 second');
            c = s.getElementsByClass('Clef');
            equal (c.length, 1, 'got clef from subclass');
            c = s.getElementsByClass(['Note', 'TrebleClef']);
            equal (c.length, 3, 'got multiple classes');
            c = s.getElementsByClass('GeneralNote');            
            equal (c.length, 3, 'got multiple subclasses');
        });  
	
	};
	
	// end of define
	if (typeof(music21) != "undefined") {
		music21.stream = stream;
	}		
	return stream;
});