class KameHameHa{
    constructor(canvas,video,audio){
        this.canvas=canvas;
        this.video=video;  
        this.ctx=canvas.getContext("2d");

        this.analyser = audio.createAnalyser();
        this.analyser.fftSize = 512;
        audio.microphone.connect(this.analyser);
        this.dataArray= new Uint8Array(this.analyser.frequencyBinCount);

        //last
        this.vfxCanvas=document.createElement("canvas");
        this.vfxCanvas.width=this.canvas.width;
        this.vfxCanvas.height=this.canvas.height;
        this.vfxCtx=this.vfxCanvas.getContext("2d");

        this.lastC=null;
        this.direction=0;
        this.vfx=new VFX();
        this.vfxOpacity=0;
        this.audioEffect=new AudioEffect();
        this.animate();
    }

    animate(){
        this.ctx.drawImage(this.video,0,0,
            this.canvas.width,this.canvas.height);
    
        const locs=getMarkedLocations(this.ctx);
        
        if(locs.length>1){
            const C=average(locs);

            let A=getFarthestFrom(locs,C);
            let B=getFarthestFrom(locs,A);

            // this.updateFX(this.getVolume(),A,B,C,this.lastC)
            // On shunte le son au départ
            this.updateFX(0.4,A,B,C,this.lastC)
            this.lastC=C;
        }
    
        requestAnimationFrame(this.animate.bind(this));
    }
    
    updateFX(volume,A,B,C,lastC){
        let rad=distance(A,B)*0.3;
        switch(this.vfx.state){
            case "idle": 
                if(volume>0.3){
                    this.vfxOpacity=0;
                    this.vfx.state="ball";
                    // this.audioEffect.wobbleUpNoise();
                }
                break;
            case "ball":  
                this.vfxOpacity+=0.1;
                const magnitude=distance(lastC,C)/Math.hypot(this.canvas.width,this.canvas.height);
                if(magnitude>0.1){
                    // this.audioEffect.blastNoise();
                    // this.vfx.state="wave";
                    this.vfx.state="idle";
                    this.vfxOpacity=13;
                    if(lastC[0]<C[0]){
                        this.vfx.direction=0;
                    }else{
                        this.vfx.direction=Math.PI;
                    }
                }
                break;
            case "wave":
                this.vfxOpacity-=0.1;
                if(this.vfxOpacity<=0){
                    this.vfx.state="idle";
                }
        }
        console.log(this.vfxOpacity);

        if(this.vfx.state=="wave"){
            if(this.vfx.direction==0){
                C[0]+=rad*3;
            }else{
                C[0]-=rad*3;
            }
            C[1]-=rad*0.5;
        }  
        if(this.vfx.state=="ball"){
            rad*=Math.min(1,this.vfxOpacity);
            C[0]-=rad*0.3;
            C[1]+=rad*0.3;
        }  

        this.vfxCtx.clearRect(0,0,this.vfxCanvas.width,this.vfxCanvas.height);
        this.vfx.draw(this.vfxCtx,C,rad);
        this.ctx.globalAlpha=this.vfxOpacity;
        this.ctx.drawImage(this.vfxCanvas,0,0);
        this.ctx.globalAlpha=1;
    }

    getVolume(){
        this.analyser.getByteTimeDomainData(this.dataArray);
        const normSamples=[...this.dataArray].map(e=>e/128-1); // making the values between -1 and 1
        let sum=0;
        for(let i=0;i<normSamples.length;i++){
            sum+=normSamples[i]*normSamples[i];
        }
        
        const volume=Math.sqrt(sum/normSamples.length); 
        return volume;
    }
}

class AudioEffect{
    constructor(){
        this.audioContext = new (window.webkitAudioContext || window.AudioContext)();
    }

    blastNoise(){
        var t0=0;
        this.blast(t0 + 0); 
        this.blast(t0 + 0.15); 
        this.slowWobbleDownNoise(t0 + 0);
        this.niooon(t0 + 1);
    }
    
    blast(offset=0){
        var t0 = this.audioContext.currentTime+offset;
        
        var masterGain = this.audioContext.createGain();
        masterGain.gain.value=2;
        var adsr = this.audioContext.createGain();
        var adsrProp={at:0.01, al:1, dt:0.2, st:0, sl:0.3, rt:5};
        this.doAdsr(t0, adsr, adsrProp);
    
        var lastOut = 0.0;
        var node = this.audioContext.createBufferSource(),
            buffer = this.audioContext.createBuffer(1, 4096, this.audioContext.sampleRate),
            data = buffer.getChannelData(0);

        for (var i = 0; i < 4096; i++) {
            var white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; // (roughly) compensate for gain
        }
        
        node.buffer = buffer;
        node.loop = true;
        node.start(t0);
        
        node.connect(adsr);
        
        var filter = this.audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 8000;
        
        filter.frequency.linearRampToValueAtTime(8000, t0 + 0.3);
        filter.frequency.linearRampToValueAtTime(1200, t0 + 0.6);	
        masterGain.gain.linearRampToValueAtTime(1, t0 + 2);	
        
        adsr.connect(masterGain);
        masterGain.connect(filter);
        filter.connect(this.audioContext.destination)
    }
    
    slowWobbleDownNoise(offset=0){
        var t0 = this.audioContext.currentTime+offset;
        
        var masterGain = this.audioContext.createGain();

        var adsr = this.audioContext.createGain();
        var adsrProp={at:0.1, al:0.8, dt:0.3, st:2, sl:0.6, rt:3};
        this.doAdsr(t0, adsr, adsrProp);
        
        
        var lastOut = 0.0;
        var node = this.audioContext.createBufferSource(),
            buffer = this.audioContext.createBuffer(1, 4096, this.audioContext.sampleRate),
            data = buffer.getChannelData(0);

        for (var i = 0; i < 4096; i++) {
            var white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; 
        }

        node.buffer = buffer;
        node.loop = true;
        node.start(t0);
        
        node.connect(adsr);
        
        adsr.connect(masterGain);
        var filter = this.audioContext.createBiquadFilter();
        masterGain.connect(filter);
    
        filter.type = "bandpass";
        filter.frequency.value = 800;
        filter.Q.value=1;
        filter.frequency.linearRampToValueAtTime(500, t0 + 5);	
        
        var tremelo = this.audioContext.createOscillator(); 
        tremelo.frequency.value = 0.7
        tremelo.type = 'sine';
        tremelo.connect(masterGain.gain);
        tremelo.start(t0);
        tremelo.frequency.linearRampToValueAtTime(0.3, t0 + 5);	
        
        filter.connect(this.audioContext.destination)
    }
    
    niooon(offset=0){
        var t0 = this.audioContext.currentTime+offset;
        
        var masterGain = this.audioContext.createGain();
        masterGain.gain.value=0.4;
        var adsr = this.audioContext.createGain();
        var adsrProp={at:1, al:0.6, dt:0, st:2, sl:0.4, rt:2};
        this.doAdsr(t0, adsr, adsrProp);
        
        var osc = this.audioContext.createOscillator();
        osc.start(t0);
        osc.type = 'sawtooth';
        osc.frequency.value = 1300;
        osc.connect(adsr)
        
        adsr.connect(masterGain);
        var filter = this.audioContext.createBiquadFilter();
        masterGain.connect(filter);
    
        filter.type = "lowpass";
        filter.frequency.value = 100;
        filter.detune.value = 0;
        filter.gain.value = 0;
        filter.frequency.linearRampToValueAtTime(1000, t0 + 0.2);	
        filter.frequency.linearRampToValueAtTime(600, t0 + 1);	
            
        osc.frequency.linearRampToValueAtTime(300, t0 + 3);			
    
        filter.connect(this.audioContext.destination)
    }
		
    wobbleUpNoise(offset=0){
        var t0 = this.audioContext.currentTime+offset;
        
        var masterGain = this.audioContext.createGain();
        masterGain.gain.value=0.8;
        var adsr = this.audioContext.createGain();
        var adsrProp={at:1, al:0.25, dt:0.3, st:5, sl:0.25, rt:2};
        this.doAdsr(t0, adsr, adsrProp);
        
        var node = this.audioContext.createBufferSource(),
            buffer = this.audioContext.createBuffer(1, 4096, this.audioContext.sampleRate),
            data = buffer.getChannelData(0);

        for (var i = 0; i < 4096; i++) {

            data[i] = Math.random();
        }

        node.buffer = buffer;
        node.loop = true;
        node.start(t0);
        
        node.connect(adsr);
        
        adsr.connect(masterGain);
        var filter = this.audioContext.createBiquadFilter();
        masterGain.connect(filter);
    
        filter.type = "lowpass";
        filter.frequency.value = 1000;
        filter.Q.value=20;
        filter.frequency.linearRampToValueAtTime(5000, t0 + 4);	
        
        var tremelo = this.audioContext.createOscillator(); 
        tremelo.frequency.value = 10
        tremelo.type = 'sawtooth';
        tremelo.connect(masterGain.gain);
        tremelo.start(t0);
        
        filter.connect(this.audioContext.destination)
    }
    
    doAdsr(t0, adsr, prop){
        adsr.gain.setValueAtTime(0, t0);
        adsr.gain.linearRampToValueAtTime(prop.al, t0 + prop.at);
        adsr.gain.linearRampToValueAtTime(prop.sl, t0 + prop.at + prop.dt);
        adsr.gain.linearRampToValueAtTime(prop.sl, t0 + prop.at + prop.dt + prop.st);
        adsr.gain.linearRampToValueAtTime(0.0, t0 + prop.at + prop.dt + prop.st + prop.rt);
    }
		
}

