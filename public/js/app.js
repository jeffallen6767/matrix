// basic application
var
  Application = (function() {
    var 
      CHAR_SPACE = 160,//32
      inst = {
        "state": {
          dom: {},
          app: {}
        },
        "configure": {
          "dom": function(obj) {
            var dom = inst.state.dom;
            Object.keys(obj).forEach(function(key){
              dom[key] = $(obj[key]);
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
          inst.setup();
          inst.state.dom.root.show();
          inst.createDom();
          inst.runApp();
        },
        "setup": function() {
          var 
            app = inst.state.app,
            types = [];
          app.chars.forEach(function(charSet) {
            var
              idx = charSet[0],
              max = charSet[1];
            while (idx <= max) {
              types.push(idx++);
            }
          });
          app.charTypes = types;
          app.charCount = types.length;
          app.animationState = {
            "lines": []
          };
        },
        "getRandomCharCode": function() {
          return inst.state.app.charTypes[
            Math.floor(Math.random() * inst.state.app.charCount)
          ];
        },
        "createDom": function() {
          var
            content = [],
            app = inst.state.app,
            cols = app.cols,
            rows = app.rows,
            charVal,
            character,
            cx,
            w,x,y,z;
          for (x=0; x<cols; x++) {
            cx = [{
              "vis": 0
            }];
            z = $('<div class="column"></div>');
            w = [];
            for (y=0; y<rows; y++) {
              charVal = app.start ? inst.getRandomCharCode() : CHAR_SPACE;
              cell = $('<div id="cell_' + x + '_' + y + '" class="cell">' + String.fromCharCode(charVal) + '</div>');
              w.push(cell);
              cx.push([false,cell]);
            }
            app.animationState.lines.push(cx);
            content.push(
              z.append(w)
            );
          }
          inst.state.dom.content.empty().append(content);
        },
        "runApp": function() {
          var 
            dom = inst.state.dom,
            animation = inst.state.app.animation;
          console.log("Application");
          console.log(inst);
          dom.loading.hide();
          dom.content.show();
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
              maxFrame = inst.state.app.animation.stopFrame || 0,
              state = inst.state.app.animationState,
              fpsInterval = state.fpsInterval;
            
            if (maxFrame && state.frameCount > maxFrame) {
              console.log("debug and stop > " + maxFrame, state.frameCount);
            } else {
              // request another frame
              state.requestID = requestAnimationFrame(inst.animate);
            }

            // calc elapsed time since last loop
            var elapsed = now - state.lastDrawTime;

            // if enough time has elapsed, draw the next frame
            if (elapsed > fpsInterval) {
              // Get ready for next frame by setting lastDrawTime=now, but...
              // Also, adjust for fpsInterval not being multiple of 16.67
              state.lastDrawTime = now - (elapsed % fpsInterval);

              // draw
              inst.drawNextFrame(now);

              state.frameCount++;
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
              Math.random() * len + min
            );
          console.log("randomFromRange", min, max, result);
          return result;
        },
        "randomChoice": function(set) {
          var num = set.length;
          return set[
            inst.randomFromRange(0, num)
          ];
        },
        "drawNextFrame": function(now) {
          
          var 
            app = inst.state.app,
            rows = app.rows,
            animation = app.animation,
            minLine = animation.minLineLength,
            lines = app.animationState.lines,
            max = lines.length,
            line, lineState,
            r,s,t,
            u,v,w,
            x,y,z;
          for (x=0; x<max; x++) {
            if (x==0) {
              console.log("drawNextFrame", now);
            }
            line = lines[x];
            lineState = line[0];
            switch (lineState.vis) {
              case 0:
                // should create new line?
                if (Math.random() <= animation.fillRate) {
                  lineState.last = now;
                  lineState.speed = inst.randomChoice(animation.lineSpeeds);
                  lineState.rate = (1000 * lineState.speed / rows);
                  lineState.next = now + lineState.rate;
                  lineState.length = inst.randomFromRange(minLine, rows);
                  lineState.head = 0;
                  lineState.headMove = true;
                  lineState.lastHead = 0;
                  lineState.tail = lineState.head - lineState.length;
                  lineState.lastTail = lineState.tail;
                  lineState.vis = 1;
                  
                }
                break;
            }
            if (lineState.vis) {
              if (x==0) {
                console.log(x, lineState);
              }
              u = lineState.tail - 1;
              v = lineState.head;
              for (y=v; y>u; y--) {
                if (y < 0) {
                  break;
                }
                r = y + 1;
                if (y == v) {
                  // head
                  if (lineState.headMove || (Math.random() <= animation.headChange)) {
                    w = inst.getRandomCharCode();
                    s = line[r];
                    s[0] = w;
                    t = s[1];
                    t.empty().text(
                      String.fromCharCode(w)
                    );
                    if (lineState.headMove) {
                      t.addClass('blue');
                      lineState.headMove = false;
                    }
                    if (lineState.head > lineState.lastHead) {
                      s = line[y];
                      t = s[1];
                      t.removeClass('blue');
                      lineState.lastHead = lineState.head;
                    }
                  }
                }
              }
              if (now >= lineState.next) {
                lineState.head++;
                lineState.tail++;
                lineState.last = lineState.next;
                lineState.next += lineState.rate;
                lineState.headMove = true;
              }
            }
          }
        }
      };
    return inst;
  })();
