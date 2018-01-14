// basic application
var
  Application = (function() {
    var 
      CHAR_CODE_SPACE = 160,
      CHAR_SPACE = String.fromCharCode(CHAR_CODE_SPACE),
      inst = {
        "state": {
          dom: {},
          app: {}
        },
        "configure": {
          "dom": function(obj) {
            var 
              dom = inst.state.dom;
            Object.keys(obj).forEach(function(key) {
              dom[key] = document.getElementById(
                obj[key].replace('#', '')
              );
            });
          },
          "app": function(obj) {
            inst.state.app = obj;
          }
        },
        "init": function(conf) {
          if (typeof conf === "object") {
            Object.keys(conf).forEach(function(key) {
              inst.configure[key](conf[key]);
            });
          }
          //console.log("Application", Application);
          inst.state.dom.root.classList.remove("hidden");
          inst.setup();
          inst.runApp();
        },
        "setup": function() {
          var 
            app = inst.state.app,
            cols = app.cols,
            rows = app.rows,
            types = [CHAR_SPACE],
            lines = [],
            v,w,x,y,z;
          app.chars.forEach(function(charSet) {
            var
              idx = charSet[0],
              max = charSet[1];
            while (idx <= max) {
              types.push(
                String.fromCharCode(idx++)
              );
            }
          });
          app.charTypes = types;
          app.charCount = types.length;
          // lines
          for (x=0; x<cols; x++) {
            w = [];
            v = [];
            z = {
              "vis": 0,
              "data": w,
              "extra": v
            };
            for (y=0; y<rows; y++) {
              w.push(
                app.start ? inst.getRandomChar() : CHAR_SPACE
              );
              v.push(0);
            }
            lines.push(z);
          }
          app.animationState = {
            "lines": lines
          };
        },
        "runApp": function() {
          var 
            dom = inst.state.dom,
            animation = inst.state.app.animation;
          //console.log("Application");
          //console.log(inst);
          dom.loading.classList.add("hidden");
          dom.content.classList.remove("hidden");
          inst.startAnimating(animation.fps, animation.sample);
        },
        "startAnimating": function(fps, sampleFreq) {
          var 
            state = inst.state.app.animationState;
          
          state.fpsInterval = 1000 / fps;
          state.lastDrawTime = performance.now();
          state.lastSampleTime = state.lastDrawTime;
          state.frameCount = 0;

          inst.animate(state.lastDrawTime);

          //state.intervalID = setInterval(sampleFps, sampleFreq);
        },
        "animate": function(now) {
          try {
            var 
              app = inst.state.app,
              maxFrame = app.animation.stopFrame || 0,
              state = app.animationState,
              fpsInterval = state.fpsInterval,
              // calc elapsed time since last loop
              elapsed = now - state.lastDrawTime;
            
            // are we requested to stop after N frames? ( debugging )
            if (state.stop || (maxFrame && (state.frameCount > maxFrame))) {
              console.log("animate stop @ " + state.frameCount + ", msg: " + state.stop);
            } else {
              // request another frame
              state.requestID = requestAnimationFrame(inst.animate);
              // if enough time has elapsed, draw the next frame
              if (elapsed > fpsInterval) {
                // Get ready for next frame by setting lastDrawTime=now, but...
                // Also, adjust for fpsInterval not being multiple of 16.67
                state.lastDrawTime = now;// - (elapsed % fpsInterval);
                // draw
                inst.drawNextFrame(now);
                // inc frame counter
                state.frameCount++;
              }
            }
          } catch (e) {
            if (state.requestID) {
              cancelAnimationFrame(state.requestID);
              state.requestID = false;
            }
            console.error(e);
          }
        },
        "randomFromRange": function(min, max) {
          var 
            len = max - min,
            result = Math.floor(
              (Math.random() * len) + min
            );
          return result;
        },
        "randomChoice": function(set) {
          return set[
            inst.randomFromRange(0, set.length)
          ];
        },
        "getRandomChar": function() {
          return inst.randomChoice(inst.state.app.charTypes);
        },
        "drawNextFrame": function(now) {
          inst.nextState(now);
          inst.showState(now);
        },
        "changeColor": function(line, index) {
          var 
            idx = typeof index === "number" ? index : line.head;
          line.extra[idx] = inst.randomFromRange(0, 15);
        },
        "changeLine": function(line, index) {
          var 
            idx = typeof index === "number" ? index : line.head;
          line.data[idx] = inst.getRandomChar();
          line.extra[idx] = inst.randomFromRange(0, 15);
        },
        "nextState": function(now) {
          var 
            app = inst.state.app,
            rows = app.rows,
            animation = app.animation,
            state = app.animationState,
            lines = state.lines,
            max = lines.length,
            line,
            x,y,z;
          for (x=0; x<max; x++) {
            line = lines[x];
            if (line.vis === 0) {
              // line not visible...
              // should create new line?
              if (Math.random() <= animation.fillRate) {
                line.vis = 1;
                line.start = now;
                line.rate = (1000 * inst.randomChoice(animation.lineSpeeds) / rows);
                line.next = now + line.rate;
                line.length = inst.randomFromRange(animation.minLineLength, animation.maxLineLength);
                line.head = 0;
                line.tail = line.head - line.length;
                inst.changeLine(line);
              }
            } else {
              // visible
              if (now < line.next) {
                // not moving yet...do something
                if (Math.random() < animation.headChange) {
                  // change the head:
                  inst.changeLine(line);
                } else {
                  // choose random spot in visible line
                  y = inst.randomFromRange(
                    Math.max(0, line.tail), Math.min(line.head, rows)
                  );
                  if (Math.random() < animation.colorChange) {
                    // just change the color:
                    inst.changeColor(line, y);
                  } else {
                    // do something random to this spot:
                    inst.changeLine(line, y);
                  }
                }
              } else {
                // moving...
                while (line.vis && (now >= line.next)) {
                  line.head++;
                  if (line.head < rows) {
                    inst.changeLine(line);
                  }
                  line.tail++;
                  //console.log("++line.head", line.head, "++line.tail", line.tail);
                  if (line.tail > -1) {
                    if (line.tail <= rows) {
                      line.data[line.tail] = CHAR_SPACE;
                    } else {
                      // line finished...
                      line.vis = 0;
                      //state.stop = "line finished: " + JSON.stringify(line);
                    }
                  }
                  line.next += line.rate;
                }
              }
            }
          }
        },
        "showState": function(now) {
          var
            content = [],
            app = inst.state.app,
            cols = app.cols,
            rows = app.rows,
            state = app.animationState,
            lines = state.lines,
            line,
            css,
            x,y;
          for (x=0; x<cols; x++) {
            line = lines[x];
            content.push('<div class="column">');
            for (y=0; y<rows; y++) {
              css = ['cell'];
              if (y === line.head) {
                css.push('blue');
              } else if (y > line.tail && y < line.head) {
                css.push('green_' + line.extra[y]);
              }
              content.push(
                '<div class="', css.join(' '), '">', line.data[y], '</div>'
              );
            }
            content.push('</div>');
          }
          inst.state.dom.content.innerHTML = content.join('');
        },
      };
    return inst;
  })();
