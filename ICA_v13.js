// Interactive Cellular Automata v13
class ICA_v13 {

	constructor( grid_size, seed, p5CanvsIdToUse ) {

		// ID tracker for generating neurons
		this.NEURON_ID_STAMP = -1;

		// Custom random
        this.seed = seed;
		this.rand = new CustomRandom_sha( seed, 120 );
        
        // How many neighbours in square radius around cell to average juices
        this.sampleField = 1;// + Math.floor(this.rand.GET_GENE()*3);
        this.counter = 0;//BigInt(1);

        // ML part:
        this.grid_size = grid_size;

        // Inputs of the correct size
        this.totalInputs = 3;
        this.inputCoords = [];
        let inputSegmentLength =  Math.floor( this.grid_size / (this.totalInputs+1) );
        for(let jj = 0;jj < this.totalInputs;jj++){
            let diag = (jj+1) * inputSegmentLength;
            let randOffsetX = Math.floor(-2 + this.rand.random_pre() * 5);
            let randOffsetY = Math.floor(-2 + this.rand.random_pre() * 5);
            this.inputCoords.push({
                x: (diag + randOffsetX) % this.grid_size,
                y: (diag + randOffsetY) % this.grid_size
            });
        }
        

        // Outputs that do not overlap the inputs
        this.totalOutputs = 2;
        this.outputCoords = [];
        let outputSegmentLength =  Math.floor( this.grid_size / (this.totalOutputs+1) );
        for(let jj = 0;jj < this.totalOutputs;jj++){
            let diag = (jj+1) * outputSegmentLength;
            this.outputCoords.push({
                x: diag,
                y: this.grid_size-1 - diag
            });
        }

        this.setNonOverlappingInputsOutputs("in0utSeed" + this.seed);

        this.mostRecentInput = ( new Array( this.totalInputs ) ).fill( 0 );
        this.mostRecentOutput = ( new Array( this.totalOutputs ) ).fill( 0 );

        this.aveR = 0;  // used for visual accumulation of colour and what's going on
        this.aveG = 0;
        this.aveB = 0;

        // The locations relative to PU of where to gather the averages from
        this.sampleTemplates = [
            [   [-1, -1], [0, -1],   [1, -1], 
                [-1, 0],  [0, 0],   [1, 0],
                [-1, 1],  [0, 1],   [1, 1]],

            [[0, 0],   [-1, -1], [0, -1], [1, -1]],

            [[0, 0],   [-1, 1], [0, 1], [1, 1]],


            //4 sides
            [[0, 0], [-1, -1], [0, -1], [1, -1]],
            [[0, 0], [1, -1], [1, 0], [1, 1]],
            [[0, 0], [1, 1], [0, 1], [-1, 1]],
            [[0, 0], [-1, 1], [-1, 0], [-1, -1]],

            //4 corners
            [[0, 0], [0, -1], [1, -1], [1, 0]],
            [[0, 0], [1, 0], [1, 1], [0, 1]],
            [[0, 0], [0, 1], [-1, 1], [-1, 0]],
            [[0, 0], [-1, 0], [-1, -1], [0, -1]],

            //4 nibbles
            [[0, 0], [0, -1]],
            [[0, 0], [1, 0]],
            [[0, 0], [0, 1]],
            [[0, 0], [-1, 0] ],

            //whole 8 search vs 4 cardinal search
            [   [-1, -1], [0, -1],   [1, -1], 
                [-1, 0],              [1, 0],
                [-1, 1],  [0, 1],   [1, 1]],

            [ [0,0], [0, -1], [0, 1], [1, 0], [-1, 0]],


            [[0, 0], [-1, 0], [-2, 0], [0, -1], [0, -2]],
            [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]],

            [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
            [[0, 0], [0, -1], [0, -2], [0, -3], [0, -4], [0, -5]]
        ];

        this.vonNeumanTemplate = [
            [             [0, -1],
                [-1, 0],           [1, 0],
                          [0, 1],         ]
        ];


        // List the juice counts
        this.amountOfAgentJuices = 5;// <- defines the language for defining agent reward function
        this.aKeyDown = false;
        this.dKeyDown = false;

        this.amountOfStateJuices_PerPU = 3;// <- defines the // <- defines the state that can only be changed during rest // + Math.floor(this.rand.GET_GENE() * 2);
        this.amountOfActivationJuices_PerPU = 3;// <- hen activating an input these are all nudge_mega()
        this.amountOfCrystalizedJuices_PerPU = 4;// <- juices w no decay
        // ^1| 

        this.totalAmountOfJuices = 
            this.amountOfAgentJuices + 
            this.amountOfStateJuices_PerPU + 
            this.amountOfActivationJuices_PerPU +
            this.amountOfCrystalizedJuices_PerPU;

        // Create the juice templates
        this.agentJuices = new Array(this.amountOfAgentJuices);
        // ^^^   Reward,    Pain,    Sleep
        this.stateJuice_Templates = new Array(this.amountOfStateJuices_PerPU);
        this.activationJuice_Templates = new Array(this.amountOfActivationJuices_PerPU);
        this.crystalizedJuice_Templates = new Array(this.amountOfCrystalizedJuices_PerPU);


        // Instantiate how the juices are supposed to start off
        for(let i = 0;i < this.agentJuices.length;i++){
            this.agentJuices[i] = new Juice(
                0.2 + 0.8 * this.rand.GET_GENE(),                // squirt
                0.8 + 0.2 * this.rand.GET_GENE(),               // decay
                0,//this.rand.GET_GENE()*10.5,              // stretch
                0.1 * this.rand.GET_GENE()            // ghost chase (distance to close)  
            );
            this.agentJuices[i].potential = 0.5;//0.52 - (this.rand.random_pre()*0.04);
        }

        // //   // //   // //   // //   // //   // //   // //   // //   // //   // //   // //   // //   // //   // //   // //   

        for(let i = 0;i < this.stateJuice_Templates.length;i++){
            this.stateJuice_Templates[i] = new Juice(
                0.5 + 0.5*this.rand.GET_GENE(),                // squirt
                0.9 + 0.1*this.rand.GET_GENE(),               // decay
                0,//this.rand.GET_GENE()*10.5,              // stretch
                0.1*this.rand.GET_GENE()            // ghost chase (distance to close)
            );
            this.stateJuice_Templates[i].potential = 0.5;
        }
        for(let i = 0;i < this.activationJuice_Templates.length;i++){
            this.activationJuice_Templates[i] = new Juice(
                0.5 + 0.5*this.rand.GET_GENE(),               // squirt
                0.9 + 0.1*this.rand.GET_GENE(),                   // decay
                0,//this.rand.GET_GENE()*10.5,              // stretch
                0.1*this.rand.GET_GENE()            // ghost chase (distance to close)
            );
            this.activationJuice_Templates[i].potential = 0.5;
        }


        for(let i = 0;i < this.crystalizedJuice_Templates.length;i++){
            this.crystalizedJuice_Templates[i] = new Juice(
                this.rand.GET_GENE()*0.05,                 // squirt
                1,//0.8 + 0.2*this.rand.GET_GENE(),    // decay
                0,//this.rand.GET_GENE()*10.5,              // stretch
                0//0.45*this.rand.GET_GENE()              // ghost chase (distance to close)
            );
            this.crystalizedJuice_Templates[i].potential = 0.5;
        }

        this.output_fire_threshold = this.rand.GET_GENE()*0.3 + 0.3

        this.total_num_of_pus = this.grid_size * this.grid_size;


        // Grid Size
        this.the_juice_grid = new Array( this.grid_size );
        for( let i = 0; i < this.the_juice_grid.length; i++ ){
            this.the_juice_grid[i] = new Array(this.grid_size);
            for( let j = 0; j < this.the_juice_grid[i].length; j++ ){
                this.the_juice_grid[i][j] = this.newEmptyJuicePU();
            }
        }

////////// Create the NN's
////////// 
        // this.generalUpdate = new StdNn(
        //     [
        //         this.amountOfStateJuices_PerPU + this.amountOfActivationJuices_PerPU + this.amountOfCrystalizedJuices_PerPU,  //<- soon to be:  "this.totalAmountOfJuices-1"// current concentration + deltatime
        //         this.amountOfStateJuices_PerPU + 
        //         this.amountOfActivationJuices_PerPU + 
        //         this.amountOfCrystalizedJuices_PerPU
        //     ], 
        //     this.rand
        // );

        // The general update function intakes:
        //      
        this.generalUpdate = new StdNn(
            [
                (this.totalAmountOfJuices - this.amountOfCrystalizedJuices_PerPU) * 2,
                this.amountOfStateJuices_PerPU + 
                // this.amountOfActivationJuices_PerPU + 
                this.amountOfCrystalizedJuices_PerPU
            ], 
            this.rand
        );

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
                    if( BOY && BOY.the_juice_grid){
                        p.background( 20, 10, 10 );
                        
                        // Reset the average colour values
                        BOY.aveR = 0;
                        BOY.aveG = 0;
                        BOY.aveB = 0;

                        let readGrid = BOY.the_juice_grid;
                        
                        for (let i = 0; i < readGrid.length; i++) {
                            for (let j = 0; j < readGrid[i].length; j++) {
                                //p.drawSingleGridUnit_wholeThing(readGrid[i][j], i, j);
                                p.drawSingleGridUnit_multiSquare(readGrid[i][j], i, j);
                                //p.drawSingleGridUnit_elaborateSquare(readGrid[i][j], i, j);
                            }
                        }

                        BOY.aveR /= (3*BOY.grid_size*BOY.grid_size);
                        BOY.aveG /= (3*BOY.grid_size*BOY.grid_size);
                        BOY.aveB /= (3*BOY.grid_size*BOY.grid_size);

                        
                        // Draw the environment (pendulum) to solve
                        // DONT NEED **** THISSS ONE **** ANYMORE
                        // ENV.drawPendulumPuzzle(450, 150, p);

                        

                        // Test out random NN distribution
                        //p.scatterShotRandomNN(470, 344, BOY.generalUpdate);//BOY.testNN)
                        let endY = p.PUSize * BOY.grid_size;
                        ENV.drawXORPuzzle(100, endY + 100, p);
                        ENV.drawLessonScores(200, endY + 100, p);
                        p.drawPulseHistory(200, endY + 200);




                        // for(let i = 0;i < BOY.agentJuices.length;i++){
                        //     let joos = BOY.agentJuices[i];
                        //     p.drawSingleJoosObject(joos, (i) * 14 + 390, 344);
                        // }


                        // Draw the one PU in detail
                        if(INVESTIGATIVE_PU && false){

                            let totalDrawn = 0;
                            for(let bb = 0;bb < INVESTIGATIVE_PU.stateJuices.length;bb++){
                                let jhhh = INVESTIGATIVE_PU.stateJuices[bb];
                                p.drawSingleJoosObject(jhhh, (bb+totalDrawn) * 9 + 390, 250);
                                totalDrawn++;
                            }
                            totalDrawn+=2;
                            for(let bb = 0;bb < INVESTIGATIVE_PU.activationJuices.length;bb++){
                                let jhhh = INVESTIGATIVE_PU.activationJuices[bb];
                                p.drawSingleJoosObject(jhhh, (bb+totalDrawn+2) * 9 + 390, 250);
                                totalDrawn++;
                            }
                            totalDrawn+=2;
                            for(let bb = 0;bb < INVESTIGATIVE_PU.crystalizedJuices.length;bb++){
                                let jhhh = INVESTIGATIVE_PU.crystalizedJuices[bb];
                                p.drawSingleJoosObject(jhhh, (bb+totalDrawn+4) * 9 + 390, 250);
                                totalDrawn++;
                            }


                            // Drw all the input, metas
                            for(let bb = 0;bb < INVESTIGATIVE_PU.allJuices.length;bb++){

                                
                            }
                        }


                    } else {
                        // console.log('errrr ---------------no boy!');
                    }
                };

                p.drawSingleGridUnit_wholeThing = function(gu, xx, yy) {
                    p.noStroke();


                    // Show the fire juice
                    p.push();
                        // Show base power (out of 255 white)
                        p.translate(xx * p.PUSize + p.PUSize/2, yy * p.PUSize + p.PUSize/2);

                        let rr = 0;
                        let totalRs = 0;
                        let gg = 0;
                        let totalGs= 0;
                        let bb = 0;
                        let totalBs = 0;
                        for(let z = 0;z < gu.allJuices.length;z++){

                            if(z%3===0){
                                rr+=Math.floor(gu.allJuices[z].juice_concentration*255)
                                totalRs+=1
                            }
                            if(z%3===1){
                                gg+=Math.floor(gu.allJuices[z].juice_concentration*255)
                                totalGs+=1
                            }
                            if(z%3===2){
                                bb+=Math.floor(gu.allJuices[z].juice_concentration*255)
                                totalBs+=1
                            }
                        }


                        p.fill( 
                            Math.floor(rr/totalRs),
                            Math.floor(gg/totalGs),
                            Math.floor(bb/totalBs) 
                        );
                        // p.fill(
                        //     Math.floor(gu.stateJuices[0].juice_concentration*255), 
                        //     Math.floor(gu.activationJuices[0].juice_concentration*255), 
                        //     Math.floor(gu.crystalizedJuices[0].juice_concentration*255)
                        // );
                        p.rect(0, 0, p.PUSize, p.PUSize);


                    p.pop();
                };

                p.drawSingleGridUnit_justStates = function(gu, xx, yy) {
                    p.noStroke();


                    // Show the fire juice
                    p.push();
                        // Show base power (out of 255 white)
                        p.translate(xx * p.PUSize + p.PUSize/2, yy * p.PUSize + p.PUSize/2);

                        p.fill( (gu.stateJuices[0].juice_concentration)*255,
                            (gu.stateJuices[1].juice_concentration)*255,
                            (gu.stateJuices[2].juice_concentration)*255 );
                        p.rect(0, 0, p.PUSize, p.PUSize);


                    p.pop();
                };

                p.drawSingleGridUnit_multiSquare = function(gu, xx, yy) {
                    p.noStroke();


                    BOY.aveR += gu.stateJuices[0].juice_concentration + 
                        gu.activationJuices[0].juice_concentration + 
                        gu.crystalizedJuices[0].juice_concentration;
                    BOY.aveG += gu.stateJuices[1].juice_concentration + 
                        gu.activationJuices[1].juice_concentration + 
                        gu.crystalizedJuices[1].juice_concentration;
                    BOY.aveB += gu.stateJuices[2].juice_concentration + 
                        gu.activationJuices[2].juice_concentration + 
                        gu.crystalizedJuices[2].juice_concentration;

                    // Show the fire juice
                    p.push();
                        // Show base power (out of 255 white)
                        p.translate(xx * p.PUSize + p.PUSize/2, yy * p.PUSize + p.PUSize/2);

                        p.fill( (gu.crystalizedJuices[0].juice_concentration)*255,
                            (gu.crystalizedJuices[1].juice_concentration)*255,
                            (gu.crystalizedJuices[2].juice_concentration)*255 );
                        p.rect(0, 0, p.PUSize, p.PUSize);

                        p.fill( (gu.stateJuices[0].juice_concentration)*255,
                            (gu.stateJuices[1].juice_concentration)*255,
                            (gu.stateJuices[2].juice_concentration)*255 );
                            p.rect(0, 0, p.PUSize*0.7, p.PUSize*0.7);

                        p.fill( (gu.activationJuices[0].juice_concentration)*255,
                            (gu.activationJuices[1].juice_concentration)*255,
                            (gu.activationJuices[2].juice_concentration)*255 );
                        p.rect(0, 0, p.PUSize*0.4, p.PUSize*0.4);
                        
                        

                    p.pop();
                };

                p.drawSingleGridUnit_elaborateSquare = function(gu, xx, yy) {
                    p.noStroke();


                    // Show the fire juice
                    p.push();
                        // Show base power (out of 255 white)
                        p.translate(
                            xx * p.PUSize + p.PUSize/2, 
                            yy * p.PUSize + p.PUSize/2
                        );

                        p.fill( (gu.activationJuices[0].juice_concentration)*255,
                            (gu.activationJuices[1].juice_concentration)*255,
                            (gu.activationJuices[2].juice_concentration)*255 );
                        p.rect(0, 0, p.PUSize, p.PUSize);

                        p.fill( (gu.stateJuices[0].juice_concentration)*255,
                            (gu.stateJuices[1].juice_concentration)*255,
                            (gu.stateJuices[2].juice_concentration)*255 );
                        p.rect(0, 0, p.PUSize*0.8, p.PUSize*0.8);
                        
                        p.fill( (gu.crystalizedJuices[0].juice_concentration)*255,
                            (gu.crystalizedJuices[1].juice_concentration)*255,
                            (gu.crystalizedJuices[2].juice_concentration)*255 );
                        p.rect(0, 0, p.PUSize*0.6, p.PUSize*0.6);



                        p.fill( (gu.stateJuices[3].juice_concentration)*255,
                            (gu.stateJuices[4].juice_concentration)*255,
                            (gu.stateJuices[5].juice_concentration)*255 );
                            p.rect(0, 0, p.PUSize*0.4, p.PUSize*0.4);

                        p.fill( (gu.stateJuices[6].juice_concentration)*255,
                            (gu.stateJuices[7].juice_concentration)*255,
                            (gu.stateJuices[8].juice_concentration)*255 );
                            p.rect(0, 0, p.PUSize*0.2, p.PUSize*0.2);

                    p.pop();
                };


                p.drawSingleJoosObject = function(joos, xx, yy) {
                    p.noStroke();
                    let maxHeight = 59;
                    let widttth = 10;

                    // if(!isNaN(overrideVal))console.log(overrideVal)

                    let barHeight = joos.juice_concentration*maxHeight;
                    let ghostHeight =  joos.ghost_concentration*maxHeight;


                    // Show the fire juice
                    p.push();
                        p.translate(xx, yy);
                        // Show the background
                        p.fill( 255 );
                        p.rect(0, 0, widttth, maxHeight);


                        // Show the CONCENTRATION
                        p.fill( 255-joos.r, 255-joos.g, 255-joos.b );
                        p.rect(0, maxHeight/2 -barHeight/2, widttth/2, barHeight);

                        // show ghost
                        p.fill(220, 210, 210);
                        p.ellipse(0, maxHeight/2 - ghostHeight, widttth/2, 5);

                    p.pop();
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
                    

                    if( BOY && BOY.the_juice_grid){
                        let ii = Math.floor(p.mouseX / p.PUSize);
                        let jj = Math.floor(p.mouseY / p.PUSize);
                        if(BOY.the_juice_grid[ii]){
                            if(BOY.the_juice_grid[ii][jj]){
                                INVESTIGATIVE_PU = BOY.the_juice_grid[ii][jj];
                            }
                        }
                    }
                };

                p.drawPulseHistory = function(xx, yy){
                    if(BOY && BOY.mostRecentInput && BOY.mostRecentOutput){
                        p.push();
                            p.translate(xx, yy);
                            p.noStroke();
                            for(let z = 0;z < BOY.mostRecentInput.length;z++){
                                p.fill( BOY.mostRecentInput[z] * 23,  BOY.mostRecentInput[z] * 223, BOY.mostRecentInput[z] * 14);
                                p.ellipse(z*30, 0, 15, 15);
                            }
                            for(let z = 0;z < BOY.mostRecentOutput.length;z++){
                                p.fill( BOY.mostRecentOutput[z] * 223,  BOY.mostRecentOutput[z] * 21, BOY.mostRecentOutput[z] * 14);
                                p.ellipse(z*30, 15, 15, 15);
                            }
                            
                        p.pop();
                    }
                };

                p.scatterShotRandomNN = function(xx, yy, nn){

                    let ww = 150;
                    p.push();
                        p.translate(xx, yy);
                        // Show the background
                        p.fill( 127 );
                        p.rect(0, 0, ww, 4);

                        let manafacturedInput = []
                        for(let bbb = 0;bbb < nn.desiredInputSize;bbb++){
                            manafacturedInput.push(Math.random()<0.5?1:0);
                        }
                        let out = nn.activate(manafacturedInput);

                        // Show the output
                        p.fill( 255, 3, 3 );
                        p.ellipse(-ww/2 + out[0]*ww, 0, 9, 9);


                    p.pop();

                };
            };

            this.p5Ref = new p5( sketch, p5CanvsIdToUse );
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
    newEmptyJuicePU(){
        let newPU = {};

        newPU.stateJuices = new Array( this.amountOfStateJuices_PerPU );
        newPU.activationJuices = new Array( this.amountOfActivationJuices_PerPU );
        newPU.crystalizedJuices = new Array( this.amountOfCrystalizedJuices_PerPU );
        
        newPU.allJuices = [];

        for(let n = 0;n < newPU.stateJuices.length;n++){
            newPU.stateJuices[n] = Juice.copyJoos(this.stateJuice_Templates[n]);
            newPU.stateJuices[n].potential = 0;//0.52 - (this.rand.random_pre()*0.04);
            newPU.allJuices.push(newPU.stateJuices[n]);
        }

        for(let n = 0;n < newPU.activationJuices.length;n++){
            newPU.activationJuices[n] = Juice.copyJoos(this.activationJuice_Templates[n]);
            newPU.activationJuices[n].potential = 0;//0.52 - (this.rand.random_pre()*0.04);
            newPU.allJuices.push(newPU.activationJuices[n]);
        }

        for(let n = 0;n < newPU.crystalizedJuices.length;n++){
            newPU.crystalizedJuices[n] = Juice.copyJoos(this.crystalizedJuice_Templates[n]);
            newPU.crystalizedJuices[n].potential = 0;//0.52 - (this.rand.random_pre()*0.04);
            newPU.allJuices.push(newPU.crystalizedJuices[n]);
        }
        // this.health = Juice.copyJoos(this.pu_bp.healthj);
        // this.health.label = "hlth_id:" + this.id;
        // this.health.r = 212
        // this.health.g = 42
        // this.health.b = 12

        // this.reputation = Juice.copyJoos(this.pu_bp.reputationj);
        // this.reputation.label = "rep_id:" + this.id;
        // this.reputation.r = 132
        // this.reputation.g = 123
        // this.reputation.b = 32

        // this.potential = Juice.copyJoos(this.pu_bp.potentialj);
        // this.potential.label = "pot_id:" + this.id;
        // this.potential.r = 232
        // this.potential.g = 103
        // this.potential.b = 52

        // this.postfire = Juice.copyJoos(this.pu_bp.postfirej);
        // this.postfire.label = "pfj_id:" + this.id;
        // this.postfire.r = 34
        // this.postfire.g = 39
        // this.postfire.b = 156
        return newPU;
    }

    rewardJuiceStimulation(modifier){
        let rewardJooses = Math.floor(this.amountOfAgentJuices/2);
        for(let i = 0;i < rewardJooses;i++){
            //Juice.nudge(this.agentJuices[i], modifier);
            Juice.input_fire_mega_nudge(this.agentJuices[i], modifier);
        }
    }

    painJuiceStimulation(modifier){
        let rewardJooseLengthSTart = Math.floor(this.amountOfAgentJuices/2);
        for(let i = rewardJooseLengthSTart;i < this.agentJuices.length;i++){
            //Juice.nudge(this.agentJuices[i], modifier);
            Juice.input_fire_mega_nudge(this.agentJuices[i], modifier);
        }
    }

    mapInput_toCorrectPUs(observedInput){

        let grriidd = this.the_juice_grid;

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

    stepOnePU(i, j, agentJuiceValues){

        let grid = this.the_juice_grid;
        let pu = grid[i][j];

                
        //=======================================================================================================
        //THIS IS THE CHUNK OF CODE FOR DETERMINING HOW TO DETERMINE NEIGHBOURS
        let juicePreference = pu.crystalizedJuices[3].juice_concentration > 0.5;
        let neighbourConfig = -1;
        if((pu.crystalizedJuices[0].juice_concentration > pu.crystalizedJuices[1].juice_concentration &&
            pu.crystalizedJuices[0].juice_concentration > pu.crystalizedJuices[2].juice_concentration)){
            neighbourConfig = 1;
        }
        else if((pu.crystalizedJuices[1].juice_concentration > pu.crystalizedJuices[0].juice_concentration &&
            pu.crystalizedJuices[1].juice_concentration > pu.crystalizedJuices[2].juice_concentration)){
            neighbourConfig = 2;
        }
        else if(pu.crystalizedJuices[2].juice_concentration > pu.crystalizedJuices[0].juice_concentration &&
            pu.crystalizedJuices[2].juice_concentration > pu.crystalizedJuices[1].juice_concentration){
            neighbourConfig = 3;
        }

        // Unlikely situation where dead
        else{
            // Initial start up of   
            neighbourConfig = 0;                 
        }


        

        // CRYSTALIZED JUCIES
        // Go through, grab the min, max, ave concentrations
        let juiceTotals = ( new Array( pu.allJuices.length - this.amountOfCrystalizedJuices_PerPU ) ).fill( 0 );
        let juiceGhostDeltas = ( new Array( pu.allJuices.length - this.amountOfCrystalizedJuices_PerPU) ).fill( 0 );

        // Default, take the averate of the 8 neuighbours
        if(neighbourConfig === 0 || neighbourConfig === 1){
            let connectionMask = this.sampleTemplates[15]; // Using all the locations here
            // Get the ave
            for( let iii = 0;iii < connectionMask.length; iii++ ){

                let x = (i + connectionMask[iii][0] + grid.length) % grid.length;
                let y = (j + connectionMask[iii][1] + grid[x].length) % grid[x].length;

                let cell2Aggregate = grid[x][y];
                // for(let h = 0;h < cell2Aggregate.allJuices.length;h++){
                //     //if(h < inputVals.length) inputVals[h] += cell2Aggregate.allJuices[h].juice_concentration / (connectionMask.length);
                //     juiceTotals[h] += cell2Aggregate.allJuices[h].juice_concentration /(connectionMask.length);
                //     juiceGhostDeltas[h] += Juice.getGhostDelta(cell2Aggregate.allJuices[h]) / (connectionMask.length);
                // }
                for(let h = 0;h < cell2Aggregate.activationJuices.length;h++){
                    juiceTotals[h] += cell2Aggregate.activationJuices[h].juice_concentration /(connectionMask.length);
                    juiceGhostDeltas[h] += Juice.getGhostDelta(cell2Aggregate.activationJuices[h]) / (connectionMask.length);
                }
                for(let h = cell2Aggregate.activationJuices.length;h < cell2Aggregate.activationJuices.length + cell2Aggregate.stateJuices.length;h++){
                    
                    //console.log('h', cell2Aggregate.activationJuices.length, cell2Aggregate.activationJuices.length)
                    juiceTotals[h] += cell2Aggregate.stateJuices[h-cell2Aggregate.activationJuices.length].juice_concentration /(connectionMask.length);
                    juiceGhostDeltas[h] += Juice.getGhostDelta(cell2Aggregate.stateJuices[h-cell2Aggregate.activationJuices.length]) / (connectionMask.length);
                }
                
            }
        }

        // Get PU with the min or max activationJuices concentration
        // MAX in the 8 neighbours arouynd
        else if(neighbourConfig === 2){
            
            
            let catchGridSize = 3;//7//9
            //let totalNetSize = (catchGridSize * catchGridSize)// - 1
            let sx = i - Math.floor(catchGridSize/2);
            let sy = j - Math.floor(catchGridSize/2);

            // Get the val w highest state concentration
            let offsetInd = Math.floor(catchGridSize * this.rand.random_pre());
            let offsetIndY = Math.floor(catchGridSize * this.rand.random_pre());
            let minFJ = -10;
            let minInd = offsetInd;
            let minIndY = offsetIndY;

            let juiceName = juicePreference ? "stateJuices" : "activationJuices";

            for( let iiii = 0;iiii < catchGridSize; iiii++ ){
                for( let jjjj = 0;jjjj < catchGridSize; jjjj++ ){
                    let iii = (offsetInd + iiii) % catchGridSize;
                    let jjj = (offsetInd + jjjj) % catchGridSize;

                    let x = (iii + sx + grid.length) % grid.length;
                    let y = (jjj + sy + grid[x].length) % grid[x].length;


                    if(!(x === i && y === j)){

                        let cell2Aggregate = grid[x][y];
                        let juiceCategory = cell2Aggregate[juiceName]
                        let curr_state_total = 0;
                        for(let tot = 0;tot < juiceCategory.length;tot++){
                            curr_state_total += juiceCategory[tot].juice_concentration
                        }

                        if(curr_state_total > minFJ){
                            minInd = x;
                            minIndY = y;
                            minFJ = curr_state_total;
                        }
                    }
                }

            }


            let puuToUse = grid[minInd][minIndY];

            //let activation = puuToUse.activationJuices.map(JjJ => JjJ.juice_concentration);
            // for(let h = 0;h < puuToUse.allJuices.length;h++){
            //     juiceTotals[h] = puuToUse.allJuices[h].juice_concentration;
            //     juiceGhostDeltas[h] = Juice.getGhostDelta(puuToUse.allJuices[h]);
            // }
            for(let h = 0;h < puuToUse.activationJuices.length;h++){
                juiceTotals[h] += puuToUse.activationJuices[h].juice_concentration /(1);
                juiceGhostDeltas[h] += Juice.getGhostDelta(puuToUse.activationJuices[h]) / (1);
            }
            for(let h = puuToUse.activationJuices.length;h < puuToUse.activationJuices.length + puuToUse.stateJuices.length;h++){
                juiceTotals[h] += puuToUse.stateJuices[h-puuToUse.activationJuices.length].juice_concentration /(1);
                juiceGhostDeltas[h] += Juice.getGhostDelta(puuToUse.stateJuices[h-puuToUse.activationJuices.length]) / (1);
            }
        }

        // MIN total activationJuices in the 8 neighbours arouynd
        else if(neighbourConfig === 3){
           
            
            let catchGridSize = 3;//7//9
            //let totalNetSize = (catchGridSize * catchGridSize)// - 1
            let sx = i - Math.floor(catchGridSize/2);
            let sy = j - Math.floor(catchGridSize/2);

            // Get the val w highest state concentration
            let offsetInd = Math.floor(catchGridSize * this.rand.random_pre());
            let offsetIndY = Math.floor(catchGridSize * this.rand.random_pre());
            let minFJ = 100;
            let minInd = offsetInd;
            let minIndY = offsetIndY;
            
            let juiceName = juicePreference ? "stateJuices" : "activationJuices";
            // if(i === 3 && j === 4){
            //     console.log("offsetInd", offsetInd, offsetIndY)
            // }

            for( let iiii = 0;iiii < catchGridSize; iiii++ ){
                for( let jjjj = 0;jjjj < catchGridSize; jjjj++ ){
                    let iii = (offsetInd + iiii) % catchGridSize;
                    let jjj = (offsetInd + jjjj) % catchGridSize;

                    let x = (iii + sx + grid.length) % grid.length;
                    let y = (jjj + sy + grid[x].length) % grid[x].length;

                    if(!(x === i && y === j)){
                        let cell2Aggregate = grid[x][y];
                        let juiceCategory = cell2Aggregate[juiceName]
                        let curr_state_total = 0;
                        for(let tot = 0;tot < juiceCategory.length;tot++){
                            curr_state_total += juiceCategory[tot].juice_concentration
                        }

                        if(curr_state_total < minFJ){
                            minInd = x;
                            minIndY = y;
                            minFJ = curr_state_total;
                        }
                    }

                }

            }


            let puuToUse = grid[minInd][minIndY];

            //let activation = puuToUse.activationJuices.map(JjJ => JjJ.juice_concentration);
            // for(let h = 0;h < puuToUse.allJuices.length;h++){
            //     juiceTotals[h] = puuToUse.allJuices[h].juice_concentration;
            //     juiceGhostDeltas[h] = Juice.getGhostDelta(puuToUse.allJuices[h]);
            // }
            for(let h = 0;h < puuToUse.activationJuices.length;h++){
                juiceTotals[h] += puuToUse.activationJuices[h].juice_concentration /(1);
                juiceGhostDeltas[h] += Juice.getGhostDelta(puuToUse.activationJuices[h]) / (1);
            }
            for(let h = puuToUse.activationJuices.length;h < puuToUse.activationJuices.length + puuToUse.stateJuices.length;h++){
                juiceTotals[h] += puuToUse.stateJuices[h-puuToUse.activationJuices.length].juice_concentration /(1);
                juiceGhostDeltas[h] += Juice.getGhostDelta(puuToUse.stateJuices[h-puuToUse.activationJuices.length]) / (1);
            }

        }



        let sleepLevel = this.agentJuices[2].juice_concentration;

        // let sleepModifier_Crystalized = Math.pow(sleepLevel, 4);


        // let agentWideJuices = this.agentJuices.map(x => x.juice_concentration);
        // let agentWideJuiceDeltas = this.agentJuices.map(x => Juice.getGhostDelta(x));



        // Activate base NN with these configurations
        let outputSquirts = this.generalUpdate.activate( 
            agentJuiceValues.concat ( juiceTotals.concat( juiceGhostDeltas ) )
        );

        
        if(i === 3 && j === 4){
            // console.log(outputSquirts)
            // console.log(juiceTotals)
            // console.log(juiceGhostDeltas)
        }

        // ONLY write to the STATE and CEMENT juices
        let JuicesToWriteTo = pu.stateJuices.concat( pu.crystalizedJuices );

        if(JuicesToWriteTo.length !== outputSquirts.length){
            console.log("NOT CORRECTdsf")
            console.log(JuicesToWriteTo.length, outputSquirts.length);
            while(true){};
        }

        //'''''''';;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        // Output 
        for(let v = 0;v < outputSquirts.length;v++){

            

            // NEW CONDITIONAL that hard sets the cement outputvalues
            // if(v < outputSquirts.length - pu.crystalizedJuices.length){
            //     Juice.input_fire_SET_CONCENTRATION(JuicesToWriteTo[v], outputSquirts[v])
            // }
            // else {



            //Juice.nudge(JuicesToWriteTo[v], outputSquirts[v]);//Juice.nudge(pu.allJuices[v], 1);

            // //
            // NOTE**** THESE THRESHOLDS ONLY MAKES SENSE IF NN PRODUCES RESULTS UNIFORMLY FROM 0 TO 1
            // NOTE**** Nudging by 1 past a reasonable threshold seems to be the only way to get results
            if(outputSquirts[v] > 0.66){
                Juice.nudge(JuicesToWriteTo[v], 1);//Math.abs(0.66-outputSquirts[v]));//outputSquirts[v]);
            }
            // else if(outputSquirts[v] >= 0.34 && outputSquirts[v] <= 0.66)    // CHILL STABILITY ZONE
            else if(outputSquirts[v] < 0.34){
                Juice.nudge_down(JuicesToWriteTo[v], 1);//Math.abs(0.34-outputSquirts[v]));//outputSquirts[v]);
            }



            // }
            
        }

        // Reset  (noy nrecaerst)
        // juiceTotals.map(x => 0);
        // juiceGhostDeltas.map(x => 0);
    }

    // Pulse step, whole grid, switch to different
    stepWithInput(observedInput) {     //[0, 1, 1, 0]  (example<-)

        if(observedInput.length !== this.inputCoords.length){
            console.log("ERRRRORRR wreong size input");
            while(true){}
        }
        // Determines which NN's to stimulate
        this.mapInput_toCorrectPUs(observedInput);

        // For drawing input firing values
        for(let z = 0;z < this.mostRecentInput.length;z++){
            this.mostRecentInput[z] *= 0.94;
            if(observedInput[z] > 0.5){
                this.mostRecentInput[z] = 1;
            }
            
        }
        
        // At this point, the inputs from this observation have effected the concentraions + ghost concentrations of the activation juices
        this.oracle.timeindex++;

        // First time running, time index is '1'
        // let readGrid = this.oracle.timeindex % 2 === 0 ? this.the_grid_COPY : this.the_grid;
        // let writeGrid = this.oracle.timeindex % 2 === 1 ? this.the_grid_COPY : this.the_grid;
        // *** Only updating the potential replaces need for read and write grid

        // Agent juiceConcentrations and ghostConcentrations array
        
        let agentJuices = ( new Array( this.amountOfAgentJuices ) ).fill( 0 );
        let agentJuiceDeltas = ( new Array( this.amountOfAgentJuices) ).fill( 0 );
        for(let h = 0;h < this.agentJuices.length;h++){
            agentJuices[h] += this.agentJuices[h].juice_concentration;
            agentJuiceDeltas[h] += Juice.getGhostDelta(this.agentJuices[h]);
        }
        let agentJuiceTotals = agentJuices.concat( agentJuiceDeltas );

        let grid = this.the_juice_grid;
        // Loop through the read grid 
        for(let i = 0;i < grid.length;i++){
            for(let j = 0;j < grid[i].length;j++){
                // Uses the generalUpdate NN to update the potential of the juices
                this.stepOnePU(i, j, agentJuiceTotals);
            }
        }
        // End of updaing grid loop


        // All the potentials have been updated at this point,
        // now:
        // (1) - First the agent juices
        for(let i = 0;i < this.agentJuices.length;i++){
            Juice.update_nudge(this.agentJuices[i]); 
        }
        // (2) - Update the juice concentrations and ghost concentrations
        for(let i = 0;i < grid.length;i++){
            for(let j = 0;j < grid[i].length;j++){
                let pu2Step = grid[i][j];
                for(let k = 0;k < pu2Step.allJuices.length;k++){
                    Juice.update_nudge(pu2Step.allJuices[k]);   // called after 'potential' attribute has been set by 'nudges'
                }
            }
        }

        // Fire if ave activation juice over 0.5
        let finalOuts = new Array(this.totalOutputs);
        for(let op = 0;op < this.outputCoords.length;op++){
            // Aggregate Firing juice?!
            let agg = 0;
            let pu = grid[this.outputCoords[op].x][this.outputCoords[op].y];
            for(let h = 0;h < pu.stateJuices.length;h++){
                agg += pu.stateJuices[h].juice_concentration;
            }
            agg /= pu.stateJuices.length;
            // If average of the firing juices over certain height, snagit, and SUCK DOWN activation jucies
            if(agg > this.output_fire_threshold){
                finalOuts[op] = 1;
                for(let h = 0;h < pu.stateJuices.length;h++){
                    Juice.output_SAP_mega_nudge(pu.stateJuices[h], 1);
                }
            }
            else{
                finalOuts[op] = 0;
            }
        }

        // For drawing output firing values
        for(let z = 0;z < this.mostRecentOutput.length;z++){
            this.mostRecentOutput[z] *= 0.94;
            if(finalOuts[z] > 0){
                this.mostRecentOutput[z] = 1;
            }
        }


        return finalOuts;

    }

    getTweakedGene(mutationValue, seeed){
		let nuRand = new CustomRandom_sha( seeed, 5 );
        let nuGene = new Array(this.totalGene.length);
        for(let i = 0;i < nuGene.length;i++){
            let rv = nuRand.random();
            if(rv > 0.5){
                nuGene[i] = this.totalGene[i] + ((1-this.totalGene[i]) * mutationValue * ((rv-0.5)*2));
            }
            else{
                nuGene[i] = this.totalGene[i] - ((this.totalGene[i]) * mutationValue * ((0.5-rv)*2));
            }
        }
        return nuGene;
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
