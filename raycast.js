import {tiny} from './examples/common.js';
const {Vector3, Mat4} = tiny;

export function mouse_pick_orig(e,ctrl,pr_st) {
    //get mouse coordinates
    let rect = ctrl.getBoundingClientRect();
    //let ix = e.clientX - (rect.left + rect.right) / 2;
    //let iy = e.clientY - (rect.bottom + rect.top) / 2;
    let ix = e.clientX - rect.left;
    let iy = e.clientY- rect.top;
    var nx = ix / ctrl.width * 2 - 1;
    var ny = 1 - iy / ctrl.height * 2;

    //Clip Cords would be [nx,ny,-1,1];

    // inverseWorldMatrix = invert(ProjectionMatrix * ViewMatrix)

    var matWorld = Mat4.identity();
    matWorld = matWorld.times(pr_st.projection_transform).times(pr_st.camera_inverse);
    matWorld = Mat4.inverse(matWorld);

    //https://stackoverflow.com/questions/20140711/picking-in-3d-with-ray-tracing-using-ninevehgl-or-opengl-i-phone/20143963#20143963
    var vec4Near	= [0,0,0,0],
        vec4Far		= [0,0,0,0];
    Mat4.transformVec4(vec4Near, [nx,ny,-1.0,1.0], matWorld); //using  4d Homogeneous Clip Coordinates
    Mat4.transformVec4(vec4Far, [nx,ny,1.0,1.0], matWorld);

    for(let i=0; i < 3; i++){
        vec4Near[i] /= vec4Near[3];
        vec4Far[i] /= vec4Far[3];
    }

    var rayNear	= Vector3.create(vec4Near[0],vec4Near[1],vec4Near[2]);
    var rayFar	= Vector3.create(vec4Far[0],vec4Far[1],vec4Far[2]);

    return {start:rayNear, end:rayFar}

    //this.debugLines		= Fungi.Debug.Lines.getRenderable().update();
    //this.debugLines.addVector(rayNear,rayFar,"000000").update();
    //return rayNear;
}

export function intersect_ray_box(box, ray_orig)
{
    //let ray_dir = [0,0,0];
    //ray_dir[0] = ray_orig.end[0]-ray_orig.start[0];
    //ray_dir[1] = ray_orig.end[1]-ray_orig.start[1];
    //ray_dir[2] = ray_orig.end[2]-ray_orig.start[2];

    let ray_dir = ray_orig.end.minus(ray_orig.start);

    const axscale = box[0][0];
    const ayscale = box[1][1];
    const azscale = box[2][2];
    const axtrans = box[0][3]/axscale;
    const aytrans = box[1][3]/ayscale;
    const aztrans = box[2][3]/azscale;

    const minax = (-1 + axtrans) * axscale;
    const minay = (-1 + aytrans) * ayscale;
    const minaz = (-1 + aztrans) * azscale;
    const maxax = (1 + axtrans) * axscale;
    const maxay = (1 + aytrans) * ayscale;
    const maxaz = (1 + aztrans) * azscale;

    let tmin = (minax - ray_orig.start[0]) / ray_dir[0];
    let tmax = (maxax - ray_orig.start[0]) / ray_dir[0];
    if (tmin > tmax) {
        let temp = tmin;
        tmin = tmax;
        tmax = temp;
    }

    let tymin = (minay - ray_orig.start[1]) / ray_dir[1];
    let tymax = (maxay - ray_orig.start[1]) / ray_dir[1];
    if (tymin > tymax) {
        let temp = tymin;
        tymin = tymax;
        tymax = temp;
    }

    if ((tmin > tymax) || (tymin > tmax))
        return false;
    if (tymin > tmin)
    tmin = tymin;
    if (tymax < tmax)
    tmax = tymax;

    let tzmin = (minaz - ray_orig.start[2]) / ray_dir[2];
    let tzmax = (maxaz - ray_orig.start[2]) / ray_dir[2];
    if (tzmin > tzmax) {
        let temp = tzmin;
        tzmin = tzmax;
        tzmax = temp;
    }

    if ((tmin > tzmax) || (tzmin > tmax))
        return false;
    if (tzmin > tmin)
        tmin = tzmin;
    if (tzmax < tmax)
        tmax = tzmax;

    var ipos = ray_dir.copy().times(tmin).plus(ray_orig.start);
    //console.log(ipos);
    return ipos;
    //return true;
}

export function intersect_ray_plane(ray,planeNorm,planePos){
    //var rayEnd = vec3.create(ray.end[0], ray.end[1], ray.end[2]);
    //var rayStart = vec3.create(ray.start[0], ray.start[1], ray.start[3]);
    var rayLen	= ray.end.minus(ray.start),	//Ray Length
        denom	= rayLen.dot(planeNorm);	//Dot product of rayPlen Length and plane normal

    if(denom <= 0.000001 && denom >= -0.000001)
        return null;			//abs(denom) < epsilon, using && instead to not perform absolute.

    var ray2PlaneLen	= planePos.minus(ray.start),	//Distance between start of ray and plane position.
        t 				= ray2PlaneLen.dot(planeNorm) / denom;

    if(t >= 0)
    {
        var intersection = rayLen.copy().times(t).plus(ray.start);
        return intersection;
         //include && t <= 1 to limit to range of ray, else its infinite in fwd dir.
    }
    return null;
}