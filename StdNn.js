// Just a standard, fully connected, feed-forward neural network
function StdNn(puzzle, theRand){
	//Custom random
	this.cr = theRand;//new CustomRandom_sha(custom_seed)
	this.tv_1 = 0;//custom variables for statistical analysis
	this.tv_2 = 0;

	let st = "";
	for(let g = 0;g < 10;g++){
		st += "," + this.cr.random();
	}

	//Needed?
	//this.input_bias = new Array(puzzle.neural_structure[0]);
	//for(let ff = 0;ff < this.input_bias.length;ff++) this.input_bias[ff] = 0.1 + 0.9*this.cr.random_pre();
	this.sig = function(x){
		return (1 / (1 + Math.exp(-x)));
	};
	this.std_signal_boost = 2;
	this.sig_d = function(x){let v = this.sig(x); return v*(1-v);}
	this.rel = function(x){if(x < 0) return 0; return x;};
	this.lr = 0.247173;
	this.lr_amp =  0.09;
	this.lr_base = 0.2;
	this.lr_slowener = 0.0001;
	this.iter = 0;
	
	//Perceptron scaffolding
	this.layers = new Array(puzzle.length-1);	//all the weights
	this.layers_c = new Array(puzzle.length-1);	//all the weights - delta
	this.bias = new Array(puzzle.length-1);		//just the one bias per neuron
	this.bias_c = new Array(puzzle.length-1);	//just the one bias per neuron - delta
	this.outs = new Array(puzzle.length-1);		//just the one output per neuron
	this.errs = new Array(puzzle.length-1);		//just the one error per neuron
	this.nets = new Array(puzzle.length-1);		//just the one net intake per neuron
	this.param_count = 0;
	this.lastInput = [];

	this.desiredInputSize = puzzle[ 0 ];
	this.desiredOutputSize = puzzle[puzzle.length - 1];
	
	let bb = 0;
	for(let i = puzzle.length-1;i > 0;i--){
		//Neurons in the layer
		let neuronss = new Array(puzzle[i]);
		let neuronss_c = new Array(puzzle[i]);
		let biass = new Array(puzzle[i]);
		let biass_c = new Array(puzzle[i]);
		let outss = new Array(puzzle[i]);
		let errss = new Array(puzzle[i]);
		let netss = new Array(puzzle[i]);
		
		//Make weights of size of previous layer
		for(let j = 0;j < neuronss.length;j++){

			let wts = new Array(puzzle[i-1]);
			let wts_c = new Array(puzzle[i-1]);

			for(let k = 0;k < wts.length;k++){
				wts[k] = (this.cr.GET_GENE()*2-1) * this.std_signal_boost;
				wts_c[k] = 0.0;
				bb++;
			}
			//console.log("wts", JSON.stringify(wts))
			neuronss[j] = wts;
			neuronss_c[j] = wts_c;
			
			biass[j] = 0;//this.cr.random_pre();//(this.cr.random_pre()*2-1) * this.std_signal_boost;
			bb++;
			biass_c[j] = 0;
			outss[j] = 0;
			errss[j] = 0;
			netss[j] = 0;
		}

		this.layers[i-1] = neuronss;
		this.layers_c[i-1] = neuronss_c;
		this.bias[i-1] = biass;
		this.bias_c[i-1] = biass_c;
		this.outs[i-1] = outss;
		this.errs[i-1] = errss;
		this.nets[i-1] = netss;
	}

	this.scl1 = -1;
	this.scl2 = 2;
	
	this.param_count = bb;

	this.scaleInput = (inn) => {
		return this.scl1 + inn*this.scl2
	};

	this.activate = (ins) => {
		// console.log("=======")
		// console.log(ins)
		if(ins.length !== this.desiredInputSize) return;

        // Map the 0-1 to -1 to 1
        //for(let b = 0;b < ins.length;b++) ins[b] = this.scaleInput(ins[b]);

		//Record most recent input
		let newActivation = new Array(ins.length);
		for(let hh = 0;hh < newActivation.length;hh++) 
			newActivation[hh] = ins[hh];//(ins[hh] * (this.std_signal_boost * 2)) - this.std_signal_boost;
		this.lastInput = newActivation;
		//console.log("this.lastInput", JSON.stringify(this.lastInput))

		//Get to work on computing
		let vals = ins;
		for(let i = 0;i < this.layers.length;i++){
			let outs = new Array(this.layers[i].length);
			let nets = new Array(this.layers[i].length);
			//let outt = '';
			for(let j = 0;j < outs.length;j++){
				let sum = 0;// + i===0 ? this.input_bias[j] : 0;
				for(let k = 0;k < this.layers[i][j].length;k++){
					sum += this.layers[i][j][k] * vals[k];
				}
				let totalPotential = sum + this.bias[i][j];
				RUNNING_TOTAL = totalPotential
				//console.log("totalpotentials:", totalPotential)
				//outs[j] = this.rel(totalPotential);
				////if((i%2)===0)
				//if(this.layers.length-1===i) outs[j] = this.sig(totalPotential);//*this.std_signal_boost*2 - this.std_signal_boost;

				outs[j] = this.sig(totalPotential) //-1 + 2*this.sig(totalPotential)
				//console.log("total ptentials", i, j, "=", totalPotential, outs[j]);
				// outt += totalPotential + ', '

				nets[j] = sum;
				this.outs[i][j] = outs[j];
				this.nets[i][j] = nets[j];
			}
			// console.log("\touts for layer", i, ":----")
			// console.log("\t", JSON.stringify(outs))
			vals = outs;
			//console.log('vals' + vals)
		}
		//vals.map(x => (x + 0.5))
		return vals;
	};

	this.limitPushToOne = (nudgeForce) =>{//push weights out to the limit
		
		for(let i = 0;i < this.layers.length;i++){
			for(let j = 0;j < this.layers[i].length;j++){

				for(let k = 0;k < this.layers[i][j].length;k++){
					let W = this.layers[i][j][k];
					if(W > 0){
						this.layers[i][j][k] += 0.1 * (1 - this.layers[i][j][k])
					}
					else{
						this.layers[i][j][k] -= 0.1 * (-1 - this.layers[i][j][k])
					}
				}

			}
		}
	};

	this.justPrintAllWeights = () => {
		for(let i = 0;i < this.layers.length;i++){
			for(let j = 0;j < this.layers[i].length;j++){

				for(let k = 0;k < this.layers[i][j].length;k++){
					let W = this.layers[i][j][k];
					console.log(i,j,k, "\t", W)
				}

			}
		}
	};

	this.bakp = (target) => {

		this.lr = 0.13;//this.lr_base + this.lr_amp*Math.sin(this.lr_slowener*this.iter);
		this.iter++;

		let E_TOTAL = 0;
		let lastLayer = this.layers.length-1;
		if(target.length !== this.outs[lastLayer].length){console.log("ERRR, wrong target size");return;}
		
		//TOTAL ERROR
		for(let i = 0;i < this.outs[lastLayer].length;i++){
			E_TOTAL += 0.5*Math.pow(target[i] - this.outs[lastLayer][i], 2);
		}

		//OUTPUT LAYER - Error for the first set of weights (the last weights in the network)
		//Each Neuron
		for(let i = 0;i < this.layers[lastLayer].length;i++){
			//Each Weight 
			for(let j = 0;j < this.layers[lastLayer][i].length;j++){
				let deltaRuleForThisWeight = 
					-(target[i] - this.outs[lastLayer][i]) *
					(this.outs[lastLayer][i] * (1 - this.outs[lastLayer][i])) *
					(this.outs[lastLayer-1][j])//eWRTout * outWRTnet * netWRTw;

				this.layers_c[lastLayer][i][j] = deltaRuleForThisWeight
			}
			//Save dE/dW
			this.errs[lastLayer][i] = (this.outs[lastLayer][i] - target[i]);

			//Error recording for the bias
			//let biasDelta = 0.0;
			for(let j = 0;j < this.bias[lastLayer].length;j++){
				this.bias_c[lastLayer][j] = 
					-(target[i] - this.outs[lastLayer][i]) *
					(this.outs[lastLayer][i] * (1 - this.outs[lastLayer][i])) * (1);
			}
		}

		//Each layer before output
		for(let i = this.layers.length-2;i > -1;i--){
			//Each Neuron
			for(let j = 0;j < this.layers[i].length;j++){

				//Add up error from layer infront
				let dEdH = 0.0;
				//Each Neuron (in next layer forwward)
				for(let g = 0;g < this.layers[i+1].length;g++){
					dEdH +=	this.errs[i+1][g] * 
							(this.outs[i+1][g] * (1.0 - this.outs[i+1][g])) *
							this.layers[i+1][g][j];//(%%TRICKY_PART%%)
							//get weight of incoming signal of neuron in the 'j' loop
				}

				//Set the error for this neuron for the next pass
				this.errs[i][j] = dEdH;

				//If first layer
				if(i === 0){
					//Each weight on Neuron
					for(let k = 0;k < this.layers[0][j].length;k++){
						//Full error adjustment for this one
						this.layers_c[0][j][k] = dEdH *
							(this.outs[0][j] * (1 - this.outs[0][j])) *
							(this.lastInput[k]);
					}
				}
				//Each weight on Neuron
				else{
					for(let k = 0;k < this.layers[i][j].length;k++){
						//Full error adjustment for this one
						this.layers_c[i][j][k] = dEdH *
							(this.outs[i][j] * (1 - this.outs[i][j])) *
							(this.outs[i-1][k]);
					}
				}

				//Update the biases
				this.bias_c[i][j] = this.errs[i][j] * this.bias[i][j];
			}
		}

		//Finally update all the weights
		for(let i = 0;i < this.layers.length;i++){
			for(let j = 0;j < this.layers[i].length;j++){
				for(let k = 0;k < this.layers[i][j].length;k++){
					this.layers[i][j][k] -= this.lr * this.layers_c[i][j][k];
				}
				this.bias[i][j] -= this.lr * this.bias_c[i][j];
			}
		}

		return E_TOTAL;
	};

	this.getSolnString = function(){
		let comp = "";
		for(let i = 0;i < this.layers.length;i++){
			for(let j = 0;j < this.layers[i].length;j++){
				comp += ":" + this.layers[i][j] + "|" + this.bias[i][j];
			}
		}
		return comp;
	};

	this.print = () => {
		console.log("======", this.layers.length)
		for(let i = 0;i < this.layers.length;i++){
			console.log("layer', ", i);
			for(let j = 0;j < this.layers[i].length;j++){
				console.log(j, " -length", this.layers[i][j].length, " ::: " , JSON.stringify(this.layers[i][j]));
			}
		}
	};
}