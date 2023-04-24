class PseudRand{
    constructor(seed){
        this.seed = seed
        this.modulus = 2 ** 32
        this.a = 1664525
        this.c = 1013904223
        this.totalVals = []
    }

    GET_GENE(){
        let kk = this.random();
        this.totalVals.push(kk);
        return kk;
    }

    END_GENE(){
        return this.totalVals;
    }

    random(){
        let returnVal = this.seed / this.modulus
        this.seed = (this.a * this.seed + this.c) % this.modulus
        return returnVal
    }
}

//Helper functions
function toHexString(byteArray) {
	return Array.prototype.map.call(byteArray, function(byte) {
		return ('0' + (byte & 0xFF).toString(16)).slice(-2);
	}).join('');
}
function toByteArray(hexString) {
	var result = [];
	while (hexString.length >= 2) {
		result.push(parseInt(hexString.substring(0, 2), 16));
		hexString = hexString.substring(2, hexString.length);
	}
	return result;
}

var HASHER = CHelper__B.hasher_256;

function CustomRandom_sha(newHash, preduns, forcedGene){
	this.hash = "@legatuscoin"+newHash;
	this.runs = 0;
	this.preRun = isNaN(preduns)?1:preduns;
	this.precalced = [];
	this.precalcedCounter = -1;

	this.fgMode = forcedGene && forcedGene.length > 0;
	this.fgGene = forcedGene;
	this.fgInd = -1;

	this.totalVals = [];

	this.nextHash = function(){
		HASHER.reset();
		this.hash = toHexString(
			HASHER.update(this.hash).digest()
		);
		return this.hash;
	};
	
	this.numFromHash = function(seed){
		const nBits = 52;
		seed = seed.slice(0, nBits / 4);
		const r = parseInt(seed, 16);
		let X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)
		return X;
	};

	this.random = function(){
		this.runs++;
		return this.numFromHash(this.nextHash());
	};

	this.random_pre = function(){
		this.precalcedCounter = 
			(this.precalcedCounter + 1) % 
			this.precalced.length;
		return this.precalced[this.precalcedCounter];
	};

	this.GET_GENE = function(){
		if(this.fgMode){
			this.fgInd = (this.fgInd+1) % this.fgGene.length;
			return this.fgGene[ this.fgInd ];
		}
        let kk = this.random();
        this.totalVals.push(kk);
        return kk;
    };

    this.END_GENE = function(){
		
		if(this.fgMode){
			if(this.fgInd !== this.fgGene.length-1){
				console.log('ERROR gene only got to', this.fgInd, 'shouldve been', this.fgGene.length, "- 1");
				while(true){}
			}
			return this.fgGene;
		}
        return this.totalVals;
    };

	for(let p = 0;p < this.preRun;p++){
		this.precalced.push(this.random());
	}
}