// Entity Markov Chain architecture 
class EMC_v1 {

	constructor( grid_size, seed_params, p5CanvsIdToUse ) {

        // tweakGeneObject    -   can contain
        // ioGene: gene values 

		// ID tracker for generating neurons
		this.NEURON_ID_STAMP = -1;

		// Custom random
        this.seed = seed_params.alphaSeed;
        this.rand = new CustomRandom_sha( this.seed, 120, null );
        
        // How many neighbours in square radius around cell to average juices
        this.sampleField = 1;// + Math.floor(this.rand.GET_GENE()*3);
        this.counter = 0;//BigInt(1);

        // ML part:
        this.grid_size = grid_size;

        // Inputs of the correct size
        this.totalInputs = 3;
        this.inputCoords = [];
        
        // Outputs that do not overlap the inputs
        this.totalOutputs = 2;
        this.outputCoords = [];

        this.ioSeed = "ioSeed";// + Math.random();
        if(seed_params.ioSeed){
            this.ioSeed = ''+seed_params.ioSeed;
        }

        this.setNonOverlappingInputsOutputs(this.ioSeed);

        this.mostRecentInput = ( new Array( this.totalInputs ) ).fill( 0 );
        this.mostRecentOutput = ( new Array( this.totalOutputs ) ).fill( 0 );

        this.aveR = 0;  // used for visual accumulation of colour and what's going on
        this.aveG = 0;
        this.aveB = 0;

        // The locations relative to PU of where to gather the averages from
        this.searchSpace = [
            //whole 8 search vs 4 cardinal search
            [-1, -1], [0, -1],   [1, -1], 
                [-1, 0],              [1, 0],
                [-1, 1],  [0, 1],   [1, 1]
        ];

        this.output_fire_threshold = this.rand.GET_GENE()*0.3 + 0.3

        this.total_num_of_pus = this.grid_size * this.grid_size;


        // Grid Size
        this.the_cell_grid = new Array( this.grid_size );
        for( let i = 0; i < this.the_cell_grid.length; i++ ){
            this.the_cell_grid[i] = new Array(this.grid_size);
            for( let j = 0; j < this.the_cell_grid[i].length; j++ ){
                this.the_cell_grid[i][j] = this.newEmptyJuiceCell();
            }
        }

////////// Update the thresholds based on # of connections
////////// 


        // Contains the global meta info on the whole network
        this.oracle = {
			"timeindex": 0,		//increases one per time step (signals take one time step to leave cellA and be received by CellB)
			"nexts": []			//{"o": object pointer to where signal is going, "v": value of the signal}
		};


        // Save the gene made
        this.totalGene = this.rand.END_GENE()
        //console.log('total gene for this boy:');
        //console.log(this.totalGene);

        // Create the threshold





        // P5JS canvas reference
        this.p5Ref = null;
        
        // Set up the visuals
        if( p5CanvsIdToUse !== null ){
            //this.initP5Logic();
            let sketch = function( p ) {

                p.setup = function() {
                    p.createCanvas( 640, 640 );
                    p.background( 20, 10, 10 );
                    p.rectMode( p.CENTER );
                    p.ellipseMode( p.CENTER );
                    p.frameRate( 26 );

                    // p.osc = new p5.TriOsc();
                    // p.osc.amp(0.5);

                    // p.fft = new p5.FFT();
                    // p.osc.start();

                    p.PUSize = 12;
                };

                p.draw = function() {
                    if( BOY && BOY.the_cell_grid){
                        p.background( 20, 10, 10 );
                        
                        // Reset the average colour values
                        BOY.aveR = 0;
                        BOY.aveG = 0;
                        BOY.aveB = 0;

                        let readGrid = BOY.the_cell_grid;
                        
                        for (let i = 0; i < readGrid.length; i++) {
                            for (let j = 0; j < readGrid[i].length; j++) {
                                p.drawCell(readGrid[i][j], i, j);
                            }
                        }





                    } else {
                        // console.log('errrr ---------------no boy!');
                    }
                };

                p.drawCell = function() {

                };


                p.keyPressed = function(){
                    // if( ! isNaN(p.key) ){
                    //     BOY.pulseStep(Number(p.key), [1, 1, 1, 1, 1] );
                    // }
                    if(ENV){
                        if(p.keyCode === 65) BOY.aKeyDown = true;
                        if(p.keyCode === 68) BOY.dKeyDown = true;
                    }

                    // if(ENV){
                    //     ENV.pulseCenterOfMass(p.keyCode)
                    // }
                };

                p.keyReleased = function(){
                    
                    if(p.keyCode === 65) BOY.aKeyDown = false;
                    if(p.keyCode === 68) BOY.dKeyDown = false;
                };

                p.mouseClicked = function(){
                    

                    if( BOY && BOY.the_cell_grid){
                        let ii = Math.floor(p.mouseX / p.PUSize);
                        let jj = Math.floor(p.mouseY / p.PUSize);
                        if(BOY.the_cell_grid[ii]){
                            if(BOY.the_cell_grid[ii][jj]){
                                INVESTIGATIVE_PU = BOY.the_cell_grid[ii][jj];
                            }
                        }
                    }
                };

            };

            this.p5Ref = new p5( sketch, p5CanvsIdToUse );
        }
	}

    physicsDistributorInputsOutputs(seeed){
        // Custom + repeataply random for other 
        let ioRand = new CustomRandom_sha(seeed);

        let ents = new Array(this.totalInputs + this.totalOutputs);
        for(let i = 0;i < ents.length;i++){
            ents[i] = {
                x: this.grid_size / 2,
                y: this.grid_size / 2
            };
        }

        for(let i = 0;i < ents.length;i++){
            if(ents[i].x > this.grid_size) ents[i].x = this.grid_size;
            if(ents[i].y > this.grid_size) ents[i].y = this.grid_size;
            if(ents[i].x < 0) ents[i].x = 0;
            if(ents[i].y < 0) ents[i].y = 0;

            for(let j = 0;j < ents.length;j++){
                if(i !== j){

                }
            }
        }

    }

    setNonOverlappingInputsOutputs(seeed){
        // Custom + repeataply random for other 
        let ioRand = new CustomRandom_sha(seeed);

        

        // Randomly place the input coords
        this.inputCoords = [];
        for(let jj = 0;jj < this.totalInputs;jj++){
            let potX = Math.floor(ioRand.random() * this.grid_size);
            let potY = Math.floor(ioRand.random() * this.grid_size);

            let conflicIndex = -1;
            for(let cc = 0;cc < this.inputCoords.length;cc++){
                if(this.inputCoords[cc].x === potX && this.inputCoords[cc].y === potY){
                    conflicIndex = cc;
                }
            }

            if(conflicIndex === -1){    // TODO : Potential ERROR here infintie loop
                this.inputCoords.push({
                    x: potX,
                    y: potY
                });
            }
            else{
                jj -=1;
            }
        }

        // Randomly place the output coords
        this.outputCoords = [];
        for(let jj = 0;jj < this.totalOutputs;jj++){
            let potX = Math.floor(ioRand.random() * this.grid_size);
            let potY = Math.floor(ioRand.random() * this.grid_size);

            let amalgamatedCoords = this.inputCoords.concat( this.outputCoords );

            let conflicIndex = -1;
            for(let cc = 0;cc < amalgamatedCoords.length;cc++){
                if(amalgamatedCoords[cc].x === potX && amalgamatedCoords[cc].y === potY){
                    conflicIndex = cc;
                }
            }

            if(conflicIndex === -1){    // TODO : Potential ERROR here infintie loop
                this.outputCoords.push({
                    x: potX,
                    y: potY
                });
            }
            else{
                jj -=1;
            }
            
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    // Get empty PU w the correct juice vals
    newEmptyJuiceCell(){
        let newPU = {};

        
        return newPU;
    }

    rewardJuiceStimulation(modifier){
    }

    painJuiceStimulation(modifier){
    }

    mapInput_toCorrectPUs(observedInput){

        let grriidd = this.the_cell_grid;

        for(let v = 0;v < observedInput.length;v++){

            // If this is a good one
            if(observedInput[v] > 0.5){
                let puTpStim = grriidd[this.inputCoords[v].x][this.inputCoords[v].y];
                for(let k = 0;k < puTpStim.activationJuices.length;k++) {
                    Juice.input_fire_mega_nudge(puTpStim.activationJuices[k], 1);
                    // Juice.input_fire_SET_CONCENTRATION(puTpStim.activationJuices[k], observedInput[v]);
                }
            }

        }
        
    }

    stepOneCell(i, j, atmosphericConditions){

        let grid = this.the_cell_grid;
        let cell = grid[i][j];

        // Based

    }

    // Pulse step, whole grid, switch to different
    stepWithInput(observedInput) {     

        // Determines which NN's to stimulate
        this.mapInput_toCorrectPUs(observedInput);

        
        // At this point, the inputs from this observation have effected the concentraions + ghost concentrations of the activation juices
        this.oracle.timeindex++;


        

        let grid = this.the_cell_grid;
        // Loop through the read grid 
        for(let i = 0;i < grid.length;i++){
            for(let j = 0;j < grid[i].length;j++){
                // Uses the generalUpdate NN to update the potential of the juices
                this.stepOneCell(i, j, []);
            }
        }
        // End of updaing grid loop



        return finalOuts;

    }

    // Step the normal connected way

	



















	// Literally shuffles an array
	static shuffler( array ) {
		let currentIndex = array.length,  randomIndex;

		// While there remain elements to shuffle...
		while (currentIndex != 0) {

			// Pick a remaining element...//boyy.rand.random_pre()
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
		}

		return array;
	}


	// Utility functions
	static new_clearOutGoingHiddenConnections( boyy ){
		for(let yy = 0; yy < 3;yy++){
			for(let i = 0;i < boyy.layers[yy].length;i++){
				boyy.layers[yy][i].outgoing = [];
				boyy.layers[yy][i].incoming = [];
			}
		}
	}

    // Recall weight arrows
	static new_recalWeightArrows( boyy ){
		for(let i = 0;i < boyy.all_neurons.length;i++){
			let n = boyy.all_neurons[i];
			for(let j = 0;j < n.incoming.length;j++){
				let angleRadians = Math.atan2(n.incoming[j].n.p5_y - n.p5_y, 
					n.incoming[j].n.p5_x - n.p5_x);
				n.incoming[j].p5_offsetx = Math.cos(angleRadians) * ((n.p5_diam/2)*1.2);
				n.incoming[j].p5_offsety = Math.sin(angleRadians) * ((n.p5_diam/2)*1.2);
			}
		}
	}

	
}
