class VFX{
    constructor(){
        this.state="idle";
        this.direction=0;
        this.frame=0;
    }
    draw(ctx,centerPoint,size){
        if (this.state=="ball") {
            this.drawGlowingBall(ctx, centerPoint, size);
            this.drawRays(ctx, centerPoint, size);
            this.drawElectricity(ctx, centerPoint, size);
        } else if (this.state=="wave") {
            this.drawWavePath(ctx, centerPoint, size, this.direction);
            this.drawWaveSource(ctx, centerPoint, size, this.direction);
            this.drawMaskingRectangle(ctx, centerPoint, size, this.direction);
        }
        this.frame++;
    }

    drawWavePath(ctx, location, size, direction) {
        const destination = [
            location[0] + Math.cos(direction) * Math.max(ctx.canvas.width,ctx.canvas.height) * 2,
            location[1] + Math.sin(direction) * Math.max(ctx.canvas.width,ctx.canvas.height) * 2
        ]
        
        const A = [
            location[0] + Math.cos(direction + Math.PI/2) * size,
            location[1] + Math.sin(direction + Math.PI/2) * size
        ]
        const B = [
            destination[0] + Math.cos(direction + Math.PI/2) * size,
            destination[1] + Math.sin(direction + Math.PI/2) * size
        ]
        const C = [
            destination[0] + Math.cos(direction-Math.PI/2) * size,
            destination[1] + Math.sin(direction-Math.PI/2) * size
        ]
        const D = [
            location[0] + Math.cos(direction - Math.PI/2) * size,
            location[1] + Math.sin(direction - Math.PI/2) * size
        ]
        
        let polygon     = [A, B, C, D];
        let strokeWidth = size / 4;
        this.drawGlowingPolygon(ctx, polygon, strokeWidth);
    }
    
    drawMaskingRectangle(context, location, size, direction) {
        for(let i=0;i<2;i++){
            context.beginPath();
            const destination = [
                location[0] + Math.cos(direction) * Math.max(context.canvas.width,context.canvas.height) * 2,
                location[1] + Math.sin(direction) * Math.max(context.canvas.width,context.canvas.height) * 2
            ]
            const A = [
                location[0] + Math.cos(direction + Math.PI/2) * size,
                location[1] + Math.sin(direction + Math.PI/2) * size
            ]
            const B = [
                destination[0] + Math.cos(direction + Math.PI/2) * size,
                destination[1] + Math.sin(direction + Math.PI/2) * size
            ]
            const C = [
                destination[0] + Math.cos(direction-Math.PI/2) * size,
                destination[1] + Math.sin(direction-Math.PI/2) * size
            ]
            const D = [
                location[0] + Math.cos(direction - Math.PI/2) * size,
                location[1] + Math.sin(direction - Math.PI/2) * size
            ]
            const transparent = 'rgba(255,255,255,0)';
            const white       = 'rgba(255,255,255,1)';
            const gradient    = context.createLinearGradient(...A, ...D);
            gradient.addColorStop(0, transparent);
            gradient.addColorStop(0.1, white);
            gradient.addColorStop(0.9, white);
            gradient.addColorStop(1, transparent);
            context.beginPath();
            context.fillStyle = gradient;
            context.moveTo(...A); context.lineTo(...B);
            context.lineTo(...C); context.lineTo(...D);
            context.fill();
        }
    }	
    
    drawWaveSource(context, location, radius, direction) {
        context.beginPath();
        
        let polygon=[];
        let pointIndex=0;
        const step=Math.PI/25;
        for(let i=0; i <= Math.PI*2; i += step) {
            let newRadius = radius;
            
            let rand = Math.random() * radius / 7;
            
            let xOffset = Math.cos(direction) * radius;
            let yOffset = Math.sin(direction) * radius;
            
            if(pointIndex%2==0){
                newRadius *= 1 + Math.pow(Math.cos(i + Math.PI) + 1, 2) / 4;
            }else{
                newRadius *= 1 + Math.pow(Math.cos(i + Math.PI) + 1, 2) / 3;
            
                xOffset += Math.cos(direction) * radius / 3;
                yOffset += Math.sin(direction) * radius / 3;
    
            }
            polygon.push([
                location[0]+xOffset+Math.cos(i+direction)*(newRadius + rand),
                location[1]+yOffset+Math.sin(i+direction)*(newRadius + rand)
            ]);
            pointIndex++;
        }
        
        let strokeWidth=radius/4;
        this.drawGlowingPolygon(context, polygon, strokeWidth)
    }
    
    drawElectricity(context, location, size){
        let nodes = [];
        while(nodes.length < 100) {
            const angle  = Math.random() * Math.PI * 2;
            const radius = size + (Math.random() * size / 4);
            let node = [
                location[0] + Math.cos(angle) * radius,
                location[1] + Math.sin(angle) * radius
            ]
            nodes.push(node);
        }
        let links  = this.getKNearestNeighborsLinks(nodes, 2);
        for(let i=0; i<links.length; i++) {
            context.beginPath();
            context.moveTo(...links[i][0]);
            context.lineTo(...links[i][1]);
            context.lineWidth   = 1;		
            context.strokeStyle = "white";	
            context.stroke();
        }
    }
    
    getKNearestNeighborsLinks(nodes, k){
        let links=[];
        for(let i=0;i<nodes.length;i++){
            let neighbors = this.getKNearestNeighbors(i, nodes, k);
            for(let j = 0; j < neighbors.length; j++) {
                let seg = [nodes[i], neighbors[j]];
                links.push(seg);
            }
        }
        return links;
    }
    
    getKNearestNeighbors(index, nodes, k){
        for(let i = 0; i < nodes.length; i++){
            if(i == index){
                nodes[i].dist = Infinity;
            }else{	
                nodes[i].dist = distance(nodes[index], nodes[i]);
            }
        }
        let neighbors=[];
        for(let i=0;i<k;i++){
            for(let j=i+1;j<nodes.length;j++){
                if(nodes[i].dist>nodes[j].dist){
                    const aux=nodes[i];
                    nodes[i]=nodes[j];
                    nodes[j]=aux;
                }
            }
            neighbors.push(nodes[i]);
        }
        
        return neighbors;
    }
    
    drawRays(context, location, size) {
        context.beginPath();
        
        // 25 controls the rotation speed
        const angleOffset = this.frame / 25;
        
        const step = Math.PI / 24;
        let pointIndex = 0;
        for(let i = 0; i <= Math.PI * 2; i += step) {
            let radius = 0;
            // 8 controls the number of rays
            if(pointIndex % 8 == 0 || pointIndex % 8 == 1){
                radius = Math.max(context.canvas.width,context.canvas.height) * 2;
            }
            if (i == 0) {
                context.moveTo(
                    location[0] + Math.cos(i + angleOffset) * radius,
                    location[1] + Math.sin(i + angleOffset) * radius
                );
            } else {
                context.lineTo(
                    location[0] + Math.cos(i + angleOffset) * radius,
                    location[1] + Math.sin(i + angleOffset) * radius
                );
            }
            pointIndex++;
        }
        
        let gradient = context.createRadialGradient(...location, size, ...location, Math.max(ctx.canvas.width,ctx.canvas.height));
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fill();
    }
    
    drawGlowingBall(context, location, size) {
        let polygon   = [];
        let step      = Math.PI / 24;
        for (let i = 0; i <= Math.PI * 2; i += step) {
            polygon.push([
                location[0]+Math.cos(i)*(size),//*(1+(Math.random()-0.5)/10),
                location[1]+Math.sin(i)*(size)//*(1+(Math.random()-0.5)/10)
            ]);
        }
        
        let strokeWidth = size / 4;
        this.drawGlowingPolygon(context, polygon, strokeWidth)
    }
    
    drawGlowingPolygon(context, points, glowWidth) {
        const white        = [255, 255, 255, 1];
        const blue         = [93 , 173, 226, 1];
        const transparent  = [255, 255, 255, 0];
        context.beginPath();
        context.moveTo(...points[0]);
        for (let i = 1; i < points.length; i++) {
            context.lineTo(...points[i]);
        }
        context.closePath();
        context.fillStyle = "rgba("+white[0]+","+white[1]+","+white[2]+","+white[3]+")";
        
        for (let i = glowWidth * 2; i > 0; i--) {
            context.lineWidth = i;
            let col = interpolateColor(transparent, blue, 1 - i / (glowWidth * 2))
            context.strokeStyle = "rgba(" +
                                    Math.floor(col[0]) + "," +
                                    Math.floor(col[1]) + "," +
                                    Math.floor(col[2]) + "," +
                                    col[3] + ")";
            context.stroke();
            context.fill();
            i -= 1;
        }
    }
}
			
			


