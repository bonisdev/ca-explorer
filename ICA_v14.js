// Interactive Cellular Automata v14
// Attribute grid and now attribute grid
class ICA_v14 {

	constructor( grid_size, seed_params, p5CanvsIdToUse ) {

        // tweakGeneObject    -   can contain
        // ioGene: gene values 

		// ID tracker for generating neurons
		this.NEURON_ID_STAMP = -1;

		// Custom random
        this.seed = seed_params.alphaSeed;
        if(seed_params.customFullGene) {
            this.rand = new CustomRandom_sha( this.seed, 120, seed_params.customFullGene );
        }
        else {
            this.rand = new CustomRandom_sha( this.seed, 120, null );
        }
        
        // How many neighbours in square radius around cell to average juices
        this.sampleField = 1;// + Math.floor(this.rand.GET_GENE()*3);
        this.counter = 0;//BigInt(1);

        // ML part:
        this.grid_size = grid_size;

        // Inputs of the correct size
        this.totalInputs = 3;
        this.inputCoords = (new Array(this.totalInputs)).fill( null );
        
        // Outputs that do not overlap the inputs
        this.totalOutputs = 2;
        this.outputCoords = (new Array(this.totalOutputs)).fill( null );

        this.ioSeed = "ioSeed";// + Math.random();
        if(seed_params.ioSeed){
            this.ioSeed = ''+seed_params.ioSeed;
        }

        this.setNonOverlappingInputsOutputs(this.ioSeed);
        //this.physicsDistributorInputsOutputs(this.ioSeed);

        this.rewardJuiceModifier = 1;
        this.painJuiceModifier = 1;

        this.mostRecentInput = ( new Array( this.totalInputs ) ).fill( 0 );
        this.mostRecentOutput = ( new Array( this.totalOutputs ) ).fill( 0 );

        this.aveR = 0;
        this.aveG = 0;
        this.aveB = 0;

        // The locations relative to PU of where to gather the averages from
        this.sampleTemplates = [
            //whole 8 search vs 4 cardinal search
            [   [-1, -1], [0, -1],   [1, -1], 
                [-1, 0],              [1, 0],
                [-1, 1],  [0, 1],   [1, 1]],

            // Von neuman
            [ [0, -1], [0, 1], [1, 0], [-1, 0]]
        ];


        // List the juice counts
        this.amountOfAgentJuices = 2;
        this.aKeyDown = false;
        this.dKeyDown = false;

        this.amountOfStateJuices_PerPU = 5;
        this.amountOfActivationJuices_PerPU = 5;
        this.amountOfCrystalizedJuices_PerPU = 5;

        this.totalAmountOfJuices = 
            this.amountOfAgentJuices + 
            this.amountOfStateJuices_PerPU + 
            this.amountOfActivationJuices_PerPU +
            this.amountOfCrystalizedJuices_PerPU;

        // Create the juice templates
        this.agentJuices = [];
        for( let i = 0; i < this.amountOfAgentJuices; i++ ){
            this.agentJuices.push(
                new Atty(0)
            );
        }

        this.output_fire_threshold = this.rand.GET_GENE()*0.75 + 0.15;
        this.agentJuiceImportanceModifier = 6;//(this.rand.GET_GENE() * 3.5) + 1.2;

        this.total_num_of_pus = this.grid_size * this.grid_size;

        // Grid Size
        this.the_atty_grid = new Array( this.grid_size );
        for( let i = 0; i < this.the_atty_grid.length; i++ ){
            this.the_atty_grid[i] = new Array(this.grid_size);
            for( let j = 0; j < this.the_atty_grid[i].length; j++ ){
                this.the_atty_grid[i][j] = this.newEmptyAttyPU();
            }
        }

        this.generalUpdate = new StdNn(
            [
                (this.totalAmountOfJuices),// - this.amountOfAgentJuices),  // ave of state and activate neighbours, then current cells crystalized values
                //(this.totalAmountOfJuices),
                this.amountOfStateJuices_PerPU + 
                this.amountOfActivationJuices_PerPU + 
                this.amountOfCrystalizedJuices_PerPU
            ], 
            this.rand
        );
        // Contains the global meta info on the whole network
        this.oracle = {
			"timeindex": 0,		//increases one per time step (signals take one time step to leave cellA and be received by CellB)
			"nexts": []			//{"o": object pointer to where signal is going, "v": value of the signal}
		};


        // Save the gene made
        this.totalGene = this.rand.END_GENE();

        this.p5Ref = null;
        
        // Set up the visuals
        if( p5CanvsIdToUse !== null ){
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
                    if( BOY && BOY.the_atty_grid){
                        p.background( 20, 10, 10 );
                        
                        // Reset the average colour values
                        BOY.aveR = 0;
                        BOY.aveG = 0;
                        BOY.aveB = 0;

                        let readGrid = BOY.the_atty_grid;
                        
                        for (let i = 0; i < readGrid.length; i++) {
                            for (let j = 0; j < readGrid[i].length; j++) {
                                p.drawSingleGridUnit_attySquare(readGrid[i][j], i, j);
                            }
                        }

                        BOY.aveR /= (3*BOY.grid_size*BOY.grid_size);
                        BOY.aveG /= (3*BOY.grid_size*BOY.grid_size);
                        BOY.aveB /= (3*BOY.grid_size*BOY.grid_size);
                        

                        // Test out random NN distribution
                        let endY = p.PUSize * BOY.grid_size;
                        let endX = p.PUSize * BOY.grid_size;

                        ENV.drawXORPuzzle(100, endY + 100, p);
                        ENV.drawLessonScores(200, endY + 100, p);
                        p.drawPulseHistory(200, endY + 150);
                        p.drawAgentPhysiology(100, endY + 150);
                        //p.scatterShotRandomNN(100, endY + 150, BOY.generalUpdate);//BOY.testNN)


                        // Draw the one PU in detail
                        if(INVESTIGATIVE_PU ){

                            for(let bb = 0;bb < INVESTIGATIVE_PU.stateJuices.length;bb++){
                                let jhhh = INVESTIGATIVE_PU.stateJuices[bb];
                                p.drawSingleAttyObject(jhhh, endX + 30 + bb*23, 250);
                            }

                            for(let bb = 0;bb < INVESTIGATIVE_PU.activationJuices.length;bb++){
                                let jhhh = INVESTIGATIVE_PU.activationJuices[bb];
                                p.drawSingleAttyObject(jhhh, endX + 30 + bb*23, 250 + 23);
                            }

                            for(let bb = 0;bb < INVESTIGATIVE_PU.crystalizedJuices.length;bb++){
                                let jhhh = INVESTIGATIVE_PU.crystalizedJuices[bb];
                                p.drawSingleAttyObject(jhhh, endX + 30 + bb*23, 250 + 23 + 23);
                            }
                        }


                    }
                    else {
                        // console.log('errrr ---------------no boy!');
                    }
                };

                p.drawSingleAttyObject = function(atty, xx, yy){
                    p.push();
                        // Show base power (out of 255 white)
                        p.translate(xx , yy);
                        if(atty.val > 0.5){
                            p.fill(255);
                            p.noStroke();
                        }
                        else{
                            p.noFill();
                            p.stroke(255);
                        }
                        p.rect(0, 0, p.PUSize, p.PUSize);
                    p.pop();
                };

                p.drawSingleGridUnit_attySquare = function(gu, xx, yy) {
                    p.noStroke();

                    BOY.aveR = 0;
                    BOY.aveG = 0;
                    BOY.aveB = 0;

                    BOY.aveR += gu.stateJuices.reduce((accumulator, atty) => {
                        return accumulator + atty.val*Math.floor(255 / BOY.amountOfStateJuices_PerPU);
                    }, 0);
                    BOY.aveG += gu.activationJuices.reduce((accumulator, atty) => {
                        return accumulator + atty.val*Math.floor(255 / BOY.amountOfActivationJuices_PerPU);
                    }, 0);
                    BOY.aveB += gu.crystalizedJuices.reduce((accumulator, atty) => {
                        return accumulator + atty.val*Math.floor(255 / BOY.amountOfCrystalizedJuices_PerPU);
                    }, 0);

                    // Show the fire juice
                    p.push();
                        // Show base power (out of 255 white)
                        p.translate(
                            xx * p.PUSize + p.PUSize/2, 
                            yy * p.PUSize + p.PUSize/2
                        );
                        p.fill( BOY.aveR, BOY.aveG, BOY.aveB);
                        p.rect(0, 0, p.PUSize, p.PUSize);
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
                    

                    if( BOY && BOY.the_atty_grid){
                        let ii = Math.floor(p.mouseX / p.PUSize);
                        let jj = Math.floor(p.mouseY / p.PUSize);
                        if(BOY.the_atty_grid[ii]){
                            if(BOY.the_atty_grid[ii][jj]){
                                INVESTIGATIVE_PU = BOY.the_atty_grid[ii][jj];
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

                p.drawAgentPhysiology = function(xx, yy, nn){
                    p.push();
                        // Show base power (out of 255 white)
                        p.translate(xx , yy);
                        p.fill(0, Math.floor(BOY.rewardJuiceModifier*255), 0);
                        p.rect(0, 0, p.PUSize, p.PUSize);

                        p.fill(Math.floor(BOY.painJuiceModifier*255), 0, 0);
                        p.rect(p.PUSize + 2, 0, p.PUSize, p.PUSize);
                    
                    p.pop();
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
                x: this.grid_size / 2 + ioRand.random(),
                y: this.grid_size / 2 + ioRand.random(),
                vx: 0,
                vy: 0
            };
        }

        let wallBuffer = this.grid_size / 5
        let radiusBounce = this.grid_size/4

        for(let stepper = 0;stepper < 2;stepper++){
            for(let i = 0;i < ents.length;i++){
                

                for(let j = 0;j < ents.length;j++){
                    if(i !== j){
                        let dd = Math.hypot(ents[i].x-ents[j].x, ents[i].y-ents[j].y);
                        let ang = Math.atan2(ents[j].y - ents[i].y, ents[j].x - ents[i].x);
                        ents[i].vx += Math.cos(ang+Math.PI)*0.04 * (2/dd);
                        ents[i].vy += Math.sin(ang+Math.PI)*0.04 * (2/dd);
                    }
                }

                let dd = Math.hypot(ents[i].x-0, ents[i].y-0);
                let ang = Math.atan2(this.grid_size/2 - ents[i].y, this.grid_size/2 - ents[i].x);
                ents[i].vx += Math.cos(ang)*0.4 
                ents[i].vy += Math.sin(ang)*0.4

                ents[i].vx *= 0.96;
                ents[i].vy *= 0.96;

                ents[i].x += ents[i].vx;
                ents[i].y += ents[i].vy;

                if(ents[i].x >= this.grid_size) ents[i].x = this.grid_size-0.001;
                if(ents[i].y >= this.grid_size) ents[i].y = this.grid_size-0.001;
                if(ents[i].x < 0) ents[i].x = 0;
                if(ents[i].y < 0) ents[i].y = 0;
            }
        }

        for(let b = 0;b < this.inputCoords.length + this.outputCoords.length;b++){
            if(b < this.inputCoords.length){
                this.inputCoords[b] = {
                    x: Math.floor(ents[b].x),
                    y: Math.floor(ents[b].y)
                }
            } else{
                this.outputCoords[b-this.inputCoords.length] = {
                    x: Math.floor(ents[b].x),
                    y: Math.floor(ents[b].y)
                }
            }
            
        }

    }

    setNonOverlappingInputsOutputs(seeed){
        // Custom + repeataply random for other 
        let ioRand = new CustomRandom_sha(seeed);

        // Randomly place the input coords
        for(let jj = 0;jj < this.totalInputs;jj++){
            let potX = Math.floor(ioRand.random() * this.grid_size);
            let potY = Math.floor(ioRand.random() * this.grid_size);

            let conflicIndex = -1;
            for(let cc = 0;cc < this.inputCoords.length;cc++){
                if(this.inputCoords[cc] && this.inputCoords[cc].x === potX && this.inputCoords[cc].y === potY){
                    conflicIndex = cc;
                }
            }

            if(conflicIndex === -1){    // TODO : Potential ERROR here infintie loop
                this.inputCoords[jj] = {
                    x: potX,
                    y: potY
                };
            }
            else{
                jj -=1;
            }
        }

        // Randomly place the output coords
        for(let jj = 0;jj < this.totalOutputs;jj++){
            let potX = Math.floor(ioRand.random() * this.grid_size);
            let potY = Math.floor(ioRand.random() * this.grid_size);

            let amalgamatedCoords = this.inputCoords.concat( this.outputCoords );

            let conflicIndex = -1;
            for(let cc = 0;cc < amalgamatedCoords.length;cc++){
                if(amalgamatedCoords[cc] && amalgamatedCoords[cc].x === potX && amalgamatedCoords[cc].y === potY){
                    conflicIndex = cc;
                }
            }

            if(conflicIndex === -1){    // TODO : Potential ERROR here infintie loop
                this.outputCoords[jj] = {
                    x: potX,
                    y: potY
                };
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
    newEmptyAttyPU(){
        let newPU = {};

        newPU.stateJuices = new Array( this.amountOfStateJuices_PerPU );
        newPU.activationJuices = new Array( this.amountOfActivationJuices_PerPU );
        newPU.crystalizedJuices = new Array( this.amountOfCrystalizedJuices_PerPU );
        
        newPU.allJuices = [];

        for(let n = 0;n < newPU.stateJuices.length;n++){
            newPU.stateJuices[n] = new Atty(0);
            newPU.allJuices.push(newPU.stateJuices[n]);
        }

        for(let n = 0;n < newPU.activationJuices.length;n++){
            newPU.activationJuices[n] = new Atty(0);
            newPU.allJuices.push(newPU.activationJuices[n]);
        }

        for(let n = 0;n < newPU.crystalizedJuices.length;n++){
            newPU.crystalizedJuices[n] = new Atty(0);
            newPU.allJuices.push(newPU.crystalizedJuices[n]);
        }

        return newPU;
    }

    handlePhysiologicalSignal(decimalError){//only ever between 0 and 1
        let p = 1 - decimalError;
        this.rewardJuiceModifier = p;
        this.rewardJuiceStimulation(this.rewardJuiceModifier);
        
        p = decimalError;
        this.painJuiceModifier = p;
        this.painJuiceStimulation(this.painJuiceModifier);
        
        // this.flatline();
    }
    
    flatline(){
        this.painJuiceModifier = 0;
        this.rewardJuiceModifier = 0;
        for(let i = 0;i < this.agentJuices.length;i++){
            Atty.set_stim(this.agentJuices[i], 0);
        }
    }

    rewardJuiceStimulation(modifier){
        let rewardJooses = Math.floor(this.amountOfAgentJuices/2);
        for(let i = 0;i < rewardJooses;i++){
            Atty.set_stim(this.agentJuices[i], modifier);
        }
    }

    painJuiceStimulation(modifier){
        let rewardJooseLengthSTart = Math.floor(this.amountOfAgentJuices/2);
        for(let i = rewardJooseLengthSTart;i < this.agentJuices.length;i++){
            Atty.set_stim(this.agentJuices[i], modifier);
        }
    }

    mapInput_toCorrectPUs(observedInput){

        let grriidd = this.the_atty_grid;

        for(let v = 0;v < observedInput.length;v++){

            // If this is a good one
            if(observedInput[v] > 0.5){
                let puTpStim = grriidd[this.inputCoords[v].x][this.inputCoords[v].y];
                for(let k = 0;k < puTpStim.activationJuices.length;k++) {
                    Atty.input_stim(puTpStim.activationJuices[k]);
                }
            }

        }
        
    }

    stepOnePU(i, j, agentJuiceValues){

        let grid = this.the_atty_grid;
        let pu = grid[i][j];

        // Grab the neighbour average State and activation jcuies
        let attyNeighbourTotal_activation = ( new Array( this.amountOfActivationJuices_PerPU ) ).fill( 0 );
        let attyNeighbourTotal_state = ( new Array( this.amountOfStateJuices_PerPU ) ).fill( 0 );
        let connectionMask = this.sampleTemplates[1]; // Using all the locations here
        for( let iii = 0;iii < connectionMask.length; iii++ ){
            let x = (i + connectionMask[iii][0] + grid.length) % grid.length;
            let y = (j + connectionMask[iii][1] + grid[x].length) % grid[x].length;
            let cell2Aggregate = grid[x][y];
            for(let h = 0;h < cell2Aggregate.activationJuices.length;h++){
                attyNeighbourTotal_activation[h] += cell2Aggregate.activationJuices[h].val /(connectionMask.length);
            }
            for(let h = 0;h < cell2Aggregate.stateJuices.length;h++){
                attyNeighbourTotal_state[h] += cell2Aggregate.stateJuices[h].val /(connectionMask.length);
            }
            
        }

        // Grab the personal crystalized values of cell
        let attyPersonalCrystalized = ( new Array( this.amountOfCrystalizedJuices_PerPU ) ).fill( 0 );
        for(let h = 0;h < pu.crystalizedJuices.length;h++){
            attyPersonalCrystalized[h] = pu.crystalizedJuices[h].val;
        }

        

        // Activate base NN with these configurations
        let outputSquirts = this.generalUpdate.activate( 
            agentJuiceValues.concat( 
                attyNeighbourTotal_activation.concat ( attyNeighbourTotal_state.concat( attyPersonalCrystalized ) ) 
            )
        );

        
        if(i === 3 && j === 4){
            // console.log(outputSquirts)
            // console.log(juiceTotals)
            // console.log(juiceGhostDeltas)
        }


        let JuicesToWriteTo = pu.activationJuices.concat( pu.stateJuices.concat( pu.crystalizedJuices ) );

        if(JuicesToWriteTo.length !== outputSquirts.length){
            console.log("NOT CORRECTdsf")
            console.log(JuicesToWriteTo.length, outputSquirts.length);
            while(true){};
        }

        //'''''''';;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        // Output 
        for(let v = 0;v < outputSquirts.length;v++){
            if(outputSquirts[v] < 0.5){
                Atty.nudge(JuicesToWriteTo[v], 0);
            }
            else {
                Atty.nudge(JuicesToWriteTo[v], 1);
            }
        }

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

        // Extract the agent juices, and add the 'importance' modifier on these weights
        let agentVals = new Array(this.amountOfAgentJuices);
        for(let u = 0;u < agentVals.length;u++){
            agentVals[u] = this.agentJuiceImportanceModifier * this.agentJuices[u].val;
        }

        let grid = this.the_atty_grid;
        for(let i = 0;i < grid.length;i++){
            for(let j = 0;j < grid[i].length;j++){
                // Uses the generalUpdate NN to update the potential of the juices
                this.stepOnePU(i, j, agentVals);
            }
        }

        // (1) - Update the actual vals from the quantum vals (qval)s that were set before ^ (substitute read/write grids)
        for(let i = 0;i < grid.length;i++){
            for(let j = 0;j < grid[i].length;j++){
                let pu2Step = grid[i][j];
                for(let k = 0;k < pu2Step.allJuices.length;k++){
                    Atty.collapse(pu2Step.allJuices[k]);   // called after 'potential' attribute has been set by 'nudges'
                }
            }
        }

        // Fire if ave activation juice over 0.5
        let finalOuts = new Array(this.totalOutputs);
        for(let op = 0;op < this.outputCoords.length;op++){
            let agg = 0;
            let pu = grid[this.outputCoords[op].x][this.outputCoords[op].y];
            for(let h = 0;h < pu.stateJuices.length;h++){
                agg += pu.stateJuices[h].val;
            }
            agg /= pu.stateJuices.length;
            // If average of the firing juices over certain height, snagit, and suck down all the state juices
            if(agg > this.output_fire_threshold){
                finalOuts[op] = 1;
                for(let h = 0;h < pu.stateJuices.length;h++){
                    Atty.output_stim(pu.stateJuices[h]);
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
		let nuRand = new CustomRandom_sha( seeed, 1 );
        let nuGene = new Array(this.totalGene.length);
        for(let i = 0;i < nuGene.length;i++){
            let rv = nuRand.random();
            if(nuRand.random() > 0.5){
                nuGene[i] = this.totalGene[i] + ((1-this.totalGene[i]) * mutationValue * rv);
            }
            else{
                nuGene[i] = this.totalGene[i] - ((this.totalGene[i]) * mutationValue * rv);
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
