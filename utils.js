
// function getMarkedLocations(ctx,color=[0,50,190],threshold=70){
//function getMarkedLocations(ctx,color=[230,20,30],threshold=80){
function getMarkedLocations(ctx,color=[0,50,190],threshold=80){
    const locs=[];
    const {data}=ctx.getImageData(0,0,
        ctx.canvas.width,ctx.canvas.height);
    for(let i=0;i<data.length;i+=40){
        const r=data[i];
        const g=data[i+1];
        const b=data[i+2];
        if(colorMatch([r,g,b],color,threshold)){
            const pIndex=i/4;
            const y = Math.floor(pIndex / ctx.canvas.width);
            const x = pIndex % ctx.canvas.width;
            locs.push([x,y]);
        }
    }
    return locs;
}

function colorMatch(c1,c2,threshold){
    return distance(c1,c2)<threshold;
}

function distance(v1,v2){
    let dist=0;
    for(let i=0;i<v1.length;i++){
        dist+=(v1[i]-v2[i])*(v1[i]-v2[i]);
    }
    return Math.sqrt(dist);
}

function average(locs){
    const C=[0,0];
    for(let i=0;i<locs.length;i++){
        C[0]+=locs[i][0];
        C[1]+=locs[i][1];
    }
    C[0]/=locs.length;
    C[1]/=locs.length;
    return C;
}

function getFarthestFrom(locs,point){
    let maxDist=distance(point,locs[0]);
    let furthest=locs[0];
    for(let i=1;i<locs.length;i++){
        let d=distance(locs[i],point);
        if(d>maxDist){
            maxDist=d;
            furthest=locs[i];
        }
    }
    return furthest;
}

function interpolateColor(from, to, amount){
    return [
        (to[0]-from[0]) * amount + from[0],
        (to[1]-from[1]) * amount + from[1],
        (to[2]-from[2]) * amount + from[2],
        (to[3]-from[3]) * amount + from[3]
    ];
}