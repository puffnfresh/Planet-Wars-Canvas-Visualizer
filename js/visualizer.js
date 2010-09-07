var Visualizer = {
    canvas: null,
    ctx: null,
    frame: 0,
    interval: null,
    background: new Image(),
    planets: [],
    moves: [],
    config : {
      planet_font: 'bold 15px Arial,Helvetica',
      fleet_font: '12px Arial,Helvetica',
      planet_pixels: [10,13,18,21,23,29],
      display_size: 640,
      display_margin: 50,
      framerate: 5,
      teamColor: ['rgb(72,84,84)','rgb(192,0,0)','rgb(120,168,192)']
    },
    
    setup: function() {
        // Setup Context
        this.canvas = document.getElementById('display');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.textAlign = 'center'
        
        // Load background
        this.background.src = 'bg.jpg';

        // Calcucated configs
        this.config.unit_to_pixel = (this.config.display_size - this.config.display_margin * 2) / 24;
    },
    
    unitToPixel: function(unit) {
        return this.config.unit_to_pixel * unit;
    },
    
    drawFrame: function(frameNumber) { 
        var disp_x = 0, disp_y = 0;
        var ctx = this.ctx;
        
        var planetStats = this.moves[frameNumber].planets;
        var fleets = this.moves[frameNumber].moving;
        
        // Game finished
        if(frameNumber + 1 == this.moves.length) {
            this.stop();
            // TODO: show winner
            return;
        }
    
        // Draw background image
        ctx.drawImage(this.background, 0, 0);
        
        for(var i = 0; i < this.planets.length; i++) {
            var planet = this.planets[i];
            planet.owner = planetStats[i].owner;
            planet.numShips = planetStats[i].numShips;

            disp_x = this.unitToPixel(planet.x) + this.config.display_margin;
            disp_y = this.unitToPixel(planet.y) + this.config.display_margin;

            // Add shadow
            ctx.beginPath();
            ctx.arc(disp_x + 0.5, this.canvas.height - disp_y + 0.5, this.config.planet_pixels[planet.growthRate] + 1, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.fillStyle = "#000";
            ctx.fill();

            // Draw circle
            ctx.beginPath();
            ctx.arc(disp_x, this.canvas.height - disp_y, this.config.planet_pixels[planet.growthRate], 0, Math.PI*2, true);
            ctx.closePath();
            ctx.fillStyle = this.config.teamColor[planet.owner];
            ctx.fill();

            // Set text
            ctx.font = this.config.planet_font;
            ctx.fillStyle = "#fff";
            ctx.fillText(planet.numShips, disp_x, this.canvas.height - disp_y + 5);
        }
        
        
        for(var i = 0; i < fleets.length; i++) {
          var fleet = fleets[i];
          
          var x = fleet.source.x + (fleet.destination.x - fleet.source.x) * fleet.progress;
          var y = fleet.source.y + (fleet.destination.y - fleet.source.y) * fleet.progress;
          disp_x = this.unitToPixel(x) + this.config.display_margin;
          disp_y = this.unitToPixel(y) + this.config.display_margin;
          
          ctx.font = this.config.fleet_font;
          ctx.fillText(fleet.numShips, disp_x + 5, this.canvas.height - disp_y + 22);
          
          ctx.beginPath();
          ctx.save();
          
          ctx.translate(disp_x, this.canvas.height - disp_y);
          ctx.scale(0.15, 0.15);
          ctx.rotate(-Math.PI/2);
          
          ctx.moveTo(0, -10);
          ctx.lineTo(40,-30);
          ctx.lineTo(0, 100);
          ctx.lineTo(-40, -30);
          ctx.closePath();
          
          // Draw arrow
          ctx.fillStyle = this.config.teamColor[fleet.owner];
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 5;
          ctx.fill();
          ctx.stroke();
          
          ctx.restore();
        }
    },
    
    start: function() {
        this.interval = setInterval(function() { Visualizer.run.apply(Visualizer); }, 1000);
    },
    
    stop: function() {
        clearInterval(this.interval);
    },
    
    run: function() {
        this.drawFrame(this.frame);
        this.frame++;
    },
    
    parseData: function(data) {
        data = data.split('|');
        
        // planets: [(x,y,owner,numShips,growthRate)]
        this.planets = data[0].split(':').map(ParserUtils.parsePlanet);
        
        // insert planets as first move
        this.moves.push({
           'planets': this.planets.map(function(a) { return {
                owner: parseInt(a.owner),
                numShips: parseInt(a.numShips)
            }; }),
           'moving': []
        });

        // turns: [(owner,numShips)] 
        // ++ [(owner,numShips,sourcePlanet,destinationPlanet,totalTripLength,turnsRemaining)]
        var turns = data[1].split(':');
        for(var i = 0; i < turns.length; i++) {
            var turn = turns[i].split(',');
            
            this.moves.push({
               'planets': turn.slice(0, this.planets.length).map(ParserUtils.parsePlanetState),
               'moving': turn.slice(this.planets.length).map(ParserUtils.parseFleet)
            });
        }
    },
    
    _eof: true
};

var ParserUtils = {    
    parseFleet: function(data) {
        data = data.split('.');
        // (owner,numShips,sourcePlanet,destinationPlanet,totalTripLength,turnsRemaining)
        return {
            owner: parseInt(data[0]),
            numShips: parseInt(data[1]),
            source: Visualizer.planets[data[2]],
            destination: Visualizer.planets[data[3]],
            progress: (data[4] - data[5]) / data[4]
        };
    },
    
    parsePlanet: function(data) {
        data = data.split(',');
        // (x,y,owner,numShips,growthRate)
        return {
            x: parseFloat(data[0]),
            y: parseFloat(data[1]),
            owner: parseInt(data[2]),
            numShips: parseInt(data[3]),
            growthRate: parseInt(data[4])
        };
    },
    
    parsePlanetState: function(data) {
        data = data.split('.');
        // (owner,numShips)
        return {
            owner: parseInt(data[0]),
            numShips: parseInt(data[1])
        };
    },
    
    _eof: true
};

(function($) {
    Visualizer.setup();
    Visualizer.parseData(data);
    Visualizer.frame = 0;
    Visualizer.start();
})(window.jQuery);