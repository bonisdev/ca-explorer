// var path1 = require('path');
// const fs1 = require('fs');
// var {SHA3} = require('sha3');

// const {GPU} = require('gpu.js');

// A juice instance contains key attributes responsible for producing 
// and decaying a juice value + keeping its ghost potentials
class Juice {
    static squirt(joos, multer){
        joos.potential += joos.squirt * isNaN(multer)?1:multer;
    }

    
    static nudge(joos, multer){
        joos.potential = joos.juice_concentration + (1-joos.juice_concentration) * joos.squirt * multer
    }
    static nudge_down(joos, multer){
        joos.potential = joos.juice_concentration - (joos.juice_concentration) * joos.squirt * multer
    }


    /////////////////===================================---------------------------------------------------------------
    // (Just the update_nudge except w out the decay)
    static input_fire_mega_nudge(joos, multer){
        joos.potential = joos.juice_concentration + (1-joos.juice_concentration) * joos.squirt * multer

        joos.juice_concentration = joos.potential

        //Get the ghost concentration to chase the actual joos concentration
        joos.ghost_concentration += 
            (joos.juice_concentration - joos.ghost_concentration) * joos.ghost_chase;
    }
    static input_fire_SET_CONCENTRATION(joos, desiredConcentration){
        joos.potential = desiredConcentration;

        joos.juice_concentration = joos.potential

        //Get the ghost concentration to chase the actual joos concentration
        joos.ghost_concentration += 
            (joos.juice_concentration - joos.ghost_concentration) * joos.ghost_chase;
    }
    static output_SAP_mega_nudge(joos, multer){
        joos.potential = joos.juice_concentration + (-joos.juice_concentration) * 0.9 * multer

        joos.juice_concentration = joos.potential

        //Get the ghost concentration to chase the actual joos concentration
        joos.ghost_concentration += 
            (joos.juice_concentration - joos.ghost_concentration) * joos.ghost_chase;
    }
    /////////////////===================================---------------------------------------------------------------


    static update_nudge(joos){        
        joos.potential *= joos.decay
        joos.juice_concentration = joos.potential;

        //Get the ghost concentration to chase the actual joos concentration
        joos.ghost_concentration += 
            (joos.juice_concentration - joos.ghost_concentration) * joos.ghost_chase;
    }
    // Returns a number between 0 and 1 in the shape of the right half of SIGMOID CURVE (approaches)
    static juiceFuncX(xVal, stretchFactor){// will only be larger than 'x'
        return 2 * (1 / (1 + Math.exp(-(xVal*stretchFactor)))) - 1;
    }
    // Between 0 and 1, 
    static getGhostDelta(joos){
        let diff = joos.juice_concentration - joos.ghost_concentration;
        // ^ between -1 and +1
        diff = (diff+1) / 2;
        // ^ between 0 and 1
        //  ^ ^ no delta at 0.5
        return diff;
    }

    // Between 0 and 1,
    // 
    static getGhostChange(joos){
        return Math.abs(joos.juice_concentration - joos.ghost_concentration);
        // ^ between -1 and +1
        diff = (diff+1) / 2;
        return diff;
    }

    static copyJoos(joosToCopy){
        let nuJoos = new Juice(0, 0, 0, 0);
        nuJoos.label = "" + joosToCopy.label + " Copy";
        nuJoos.r = joosToCopy.r;
        nuJoos.g = joosToCopy.g;
        nuJoos.b = joosToCopy.b;

        nuJoos.potential = joosToCopy.potential;
        nuJoos.juice_concentration = joosToCopy.juice_concentration;
        nuJoos.ghost_concentration = joosToCopy.ghost_concentration;

        nuJoos.squirt = joosToCopy.squirt;
        nuJoos.decay = joosToCopy.decay;
        nuJoos.stretch = joosToCopy.stretch;
        nuJoos.ghost_chase = joosToCopy.ghost_chase;

        return nuJoos;
    }

    constructor(squirt, decay, stretch, ghost_chase){
        this.label="default_label";
        this.r = 255;
        this.g = 255;
        this.b = 255;

        this.potential = 0;
        this.juice_concentration = 0;//f(x)
        this.ghost_concentration = 0;

        this.squirt = squirt;
        this.decay = decay;
        this.stretch = stretch;
        this.ghost_chase = ghost_chase;

    }
}



