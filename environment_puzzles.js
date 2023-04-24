class Environment_Puzzle{

    
    // Called ~60 times per second
    static stepAgentAwareness(boy, env){

        // Get what the agent is supposed to see based on on the environment
        let agentView = env.getAgentSensorReadings()
        // Propogate the agent view + existing signals 
        let boysOutput = boy.stepWithInput(agentView);


        // Consciousness first
        for(let i = 0;i < env.fpd;i++) env.step(boysOutput);

        return env.FINAL_SCORE;
    }

    valToPulse(into){
        into = into > 0.999 ? 0.999 : into;
        into = into < 0.001 ? 0 : into;
        return into;
        into = Math.floor(   Math.max( 1,  60 - (58*into) )   );
        return this.timeIndex % into === 0 ? 1 : 0;
        return Math.floor(  Math.max( 1,  30*(1-(into*into)) )  );
    }

    getAgentSensorReadings(){

        // THIS IS FOR PENDULUM
        // let valToSend = [
        //     // Get pressure from the sides
        //     this.valToPulse( (-this.posX) / this.maxRange ),
        //     this.valToPulse( (this.posX) / this.maxRange ),

        //     // Get the distances of pendulum from COM
        //     this.valToPulse( ((this.posX) - (this.massPos.x)) / this.massRestRange*0.8 ),//divided by spring length
        //     this.valToPulse( ((-this.posX) - (this.massPos.x)) / this.massRestRange*0.8),//divided by spring length

        //     // Get the height (worst pain at end)
        //     this.valToPulse( ( ((this.massPos.y + this.massRestRange)  ) / this.massRestRange*2.0 ) )
        // ]; 

        // Lesson updates every 300 time steps
        let updatedLessonIndex = 
            Math.floor( ( (0)+this.timeIndex ) / this.timePerLesson ) 
                % this.lessonPlans.length;
            
        // If lesson will change?!
        if(updatedLessonIndex !== this.currentLessonPlanIndex){
            
            // Add the previous score in (currentLessonPlanIndex is not yet updated to newest updatedLessonIndex)
            this.allLessonScores.push({
                s: this.lessonPlans[ this.currentLessonPlanIndex ][ 2 ],
                lc: this.learningCycle
            });

            this.lessonPlans[ updatedLessonIndex ][ 2 ] = 0;

            // At the end of the lesson plan?
            if(this.currentLessonPlanIndex === this.lessonPlans.length-1){
                this.learningCycle++;
            }

            // ENDING CONDITION?!
            // This makes it such that there are 3 complete learnign cycles before final scores are tallied up
            if(this.learningCycle === this.learningCycles_PerNatureConfig + 1){

                // Roll over bio configuration
                this.computeFinalScore();
            }
        }
        this.currentLessonPlanIndex = updatedLessonIndex;

        let lesson = this.lessonPlans[ this.currentLessonPlanIndex ];

        let sensorReadings = new Array(this.lessonPlans[0][0].length);//new Array(2);
        for(let i = 0;i < sensorReadings.length;i++){
            sensorReadings[i] = (1 - lesson[0][i])*8 + 2;
            sensorReadings[i] = this.timeIndex % sensorReadings[i] === 0 ? 1 : 0;
        }
        return sensorReadings;



        // THIS IS FOR XOR PROBLEM
        if(this.sunHeight > 0.5){
            return valToSend;

        }
        else{
            return [
                0, 
                0, 
                0, 
                0,
                0
            ];
        }
        
        
    }


    constructor(seed){

        this.seed = seed
        this.rand = new CustomRandom_sha(this.seed); // new PseudRand( this.seed);

        this.timeIndex = 0

        // Env frames between agent
        this.fpd = 1



        this.sunHeight = 0;
        this.sunAngle = 0
        this.day = 0;

        // XOR
        // this.lessonPlans = [
        //     //input, desired output of 1d spring mass, current error
        //     [
        //         [0, 1], [1], 0],
        //     [
        //         [1, 0], [1], 0],
        //     [
        //         [1, 1], [0], 0],
        //     [
        //         [0, 0], [0], 0]
        // ];
        this.lessonPlans = [
            //input, desired output of 1d spring mass, current error
            [
                [0, 0, 0], [1], 0],
            [
                [0, 0, 1], [1], 0],
            [
                [0, 1, 0], [1], 0],
            [
                [0, 1, 1], [1], 0]
            // [
            //     [1, 0, 0], [1], 0],
            // [
            //     [1, 0, 1], [1], 0],
            // [
            //     [1, 1, 0], [1], 0],
            // [
            //     [1, 1, 1], [1], 0]
        ];
        this.developLessonPlan3XOR(this.seed+"xor");
        this.timePerLesson = 100;
        this.currentLessonPlanIndex = 0;//index
        this.learningCycle = 1;
        this.learningCycles_PerNatureConfig  = 3;   // 3 times
        this.allLessonScores = [];//{s: 0.0212123, lc: 1}// VERY GOOOD SCORE, FIRST time through a lesson

        this.FINAL_SCORE = null;

        // Pendulum
        this.maxRange = 75;
        this.posX = this.rand.random()*this.maxRange - this.maxRange/2;// center of mass
        this.velX = 0;

        this.massRestRange = 50;

        this.massPos = {x : this.posX +  this.rand.random()*this.maxRange/2 - this.maxRange/4 , y: this.rand.random() * this.massRestRange - this.massRestRange/2}
        this.massVel = {vx : 0, vy: 0}
    }

    developLessonPlan3XOR(seeed){
        let sid = new CustomRandom_sha(seeed);
        for(let i = 0;i < this.lessonPlans.length;i++){
            this.lessonPlans[i][1] = sid.random() < 0.5 ? [1] : [0];
            this.lessonPlans[i][2] = 0;
        }
    }

    drawPendulumPuzzle(ddx, ddy, p){
        p.push();

            p.translate(ddx, ddy);
            // Draw the max bar
            p.stroke(255);
            p.strokeWeight(1);
            p.line(-this.maxRange, 0, this.maxRange, 0);

            p.fill(0);
            p.rect(this.posX, 0, 20, 20);

            p.ellipse(this.massPos.x, this.massPos.y, 12, 12);

        p.pop();
    }

    stepPendulumLogic(agentsOutput){

        let inputImpulses = [];

        // Pull towards middle
        let distFromRest = -this.posX;
        let velChange = distFromRest * 0.003
        this.velX += velChange;
        this.posX += this.velX;

        //   * CAN ONLY BE   0 or 1   ANYWAY
        if(agentsOutput[0] > 0.5){
            this.velX-=0.8;
        }
        if(agentsOutput[1] > 0.5){
            this.velX+=0.8;
        }


        if(BOY.aKeyDown){
            this.velX-=0.8;
        }
        if(BOY.dKeyDown){
            this.velX+=0.8;
        }

        if(this.posX > this.maxRange){
            this.posX = this.maxRange;
            this.velX = 0;
        }
        if(this.posX < -this.maxRange){
            this.posX = -this.maxRange;
            this.velX = 0;
        }

        // Attract mass
        let dist = Math.hypot(this.posX - this.massPos.x, 0 - this.massPos.y);
        let ang = Math.atan2(0 - this.massPos.y, this.posX - this.massPos.x)

        dist = dist - 50

        this.massVel.vx += Math.cos(ang) * dist * 0.090
        this.massVel.vy += Math.sin(ang) * dist * 0.09
        this.massVel.vy += 0.2;

        this.massPos.x +=this.massVel.vx
        this.massPos.y +=this.massVel.vy

        this.massVel.vx *= 0.93
        this.massVel.vy *= 0.93

        this.velX *= 0.97;

    }

    drawXORPuzzle(ddx, ddy, p){
        let lson = ENV.lessonPlans[ ENV.currentLessonPlanIndex ];
        p.push();

            p.translate(ddx, ddy);
            p.fill(255);
            p.text(""+lson[0] + "  i|o->  " + lson[1], 0, -23);
            // Draw the max bar
            p.stroke(255);
            p.strokeWeight(1);
            p.line(-this.maxRange, 0, this.maxRange, 0);

            p.fill(0);
            p.rect(this.posX, 0, 20, 20);

        p.pop();
    }

    drawLessonScores(ddx, ddy, p){
        let scoreHeight = 25;
        let scoreWidth = 10;
        p.push();

            p.translate(ddx, ddy);
            // Draw the max bar
            // p.stroke(255);
            // p.strokeWeight(1);
            p.noStroke();
            for(let i = 0;i < this.lessonPlans.length;i++){
                let totalScore = this.lessonPlans[i][2];
                
                let xx = i * (scoreWidth+4);

                p.fill(240);
                p.rect(xx, 0, scoreWidth, scoreHeight);

                if(totalScore < 0.15){
                    p.fill(0, 200, 0);
                }
                else if(totalScore < 0.45){
                    p.fill(210, 200, 0);
                }
                else if(totalScore < 0.65){
                    p.fill(210, 100, 0);
                }
                else {
                    p.fill(220, 10, 0);
                }

                p.rect(xx, 0, scoreWidth, scoreHeight * (1-totalScore));
            }

        p.pop();
    }

    stepXORLogic(agentsOutput){

        // Pull towards middle
        let distFromRest = -this.posX;
        let velChange = distFromRest * 0.003
        this.velX += velChange;
        this.posX += this.velX;

        //   * CAN ONLY BE   0 or 1   ANYWAY
        if(agentsOutput[0] > 0.5){
            this.velX-=0.8;
        }
        if(agentsOutput[1] > 0.5){
            this.velX+=0.8;
        }

        if(BOY.aKeyDown){
            this.velX-=0.8;
        }
        if(BOY.dKeyDown){
            this.velX+=0.8;
        }

        if(this.posX > this.maxRange){
            this.posX = this.maxRange;
            this.velX = 0;
        }
        if(this.posX < -this.maxRange){
            this.posX = -this.maxRange;
            this.velX = 0;
        }

        this.velX *= 0.97;

        // Calculate lesson error and consequently...
        let lesson = this.lessonPlans[this.currentLessonPlanIndex];
        let scr = ( this.posX + this.maxRange ) / ( 2 * this.maxRange );
        let decimalError = Math.abs(scr - lesson[1][0]);
        //if(this.timeIndex%50===0) console.log("decimalError", decimalError)
        //Calculate agent juice respond
        if(decimalError < 0.5) BOY.rewardJuiceStimulation(1);//Math.abs(decimalError-0.5));
        else if(decimalError > 0.5) BOY.painJuiceStimulation(1);//(Math.abs(decimalError-0.6));
        // Add score into the lesson
        lesson[2] += decimalError / this.timePerLesson;
    }

    refreshSunHeight(){
        this.sunAngle = this.timeIndex / 230; // 1400;
        this.day = Math.floor( this.sunAngle / ( 2 * Math.PI ) );
        this.sunHeight = 0.5 * Math.sin( this.sunAngle ) + 0.5;
        
    }

    step(agentsOutput){
        
        this.timeIndex++;

        this.refreshSunHeight(); // can't effect the sun with the 'agentsOutput' just like real life

        //this.stepPendulumLogic(agentsOutput);
        this.stepXORLogic(agentsOutput);
    }

    computeFinalScore(){
        let totalLCWeight = 0;
        let totalScore = 0;
        for(let i = 0;i < this.allLessonScores.length;i++){
            totalLCWeight += this.allLessonScores[i].lc;
            totalScore += this.allLessonScores[i].s * this.allLessonScores[i].lc;
        }
        this.FINAL_SCORE = totalScore / totalLCWeight;
        return this.FINAL_SCORE;
    }

}