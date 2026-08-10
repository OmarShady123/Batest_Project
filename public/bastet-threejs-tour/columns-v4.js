import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const COLUMN_TEMPLATE_CACHE = new Map();

export const COLUMN_METADATA = {
  palmiform_ea1065: {
    id: 'palmiform_ea1065', title: 'عمود نخلي من الجرانيت الأحمر — EA1065', type: 'Palmiform monolithic column',
    date: 'حوالي 1250 ق.م؛ أعيد نحت أجزاء في الأسرة 22', rulers: 'رمسيس الثاني؛ إعادة نحت جزئية لأوسركون الثاني',
    material: 'جرانيت أحمر', dimensions: 'الارتفاع الأقصى المنشور: 6.32 م',
    confidence: 'مرتفع في النوع والخامة والارتفاع؛ متوسط في تفاصيل استكمال القاعدة والتاج',
    source: 'British Museum EA1065؛ معبد باستت في تل بسطة',
    note: 'هيئة أوراق النخيل والنسب الداخلية أُعيدت بناؤها بصورة محافظة؛ لا تُعرض الكتابات كنسخ هيروغليفي حرفي.', evidence: 'attested'
  },
  papyrus_bundle: {
    id: 'papyrus_bundle', title: 'عمود حزمة بردي', type: 'Papyrus bundle column',
    date: 'الأسرة 22 في القسم الغربي من المعبد', rulers: 'يرتبط بتوسعات أوسركون الثاني وفق وصف الموقع',
    material: 'حجر أو جرانيت بحسب القاعة؛ الخامة الحالية إعادة بناء تفسيرية', dimensions: 'الارتفاع والقطر الكاملان تقديريان داخل النموذج',
    confidence: 'مرتفع في وجود النوع؛ متوسط إلى منخفض في النسب الدقيقة وشكل التاج لكل موضع',
    source: 'وزارة السياحة والآثار المصرية؛ مخطط ونشر Naville',
    note: 'التاج المغلق حل محافظ عندما لا تسمح الأدلة بتحديد هيئة كل تاج على حدة.', evidence: 'contextual'
  },
  hathor_ea1107: {
    id: 'hathor_ea1107', title: 'عمود حتحوري بحزمة بردي — مستند إلى EA1107', type: 'Papyrus-bundle shaft with bifacial Hathor capital',
    date: 'الأسرة 22', rulers: 'صنع في عهد أوسركون الأول على الأرجح، وأقيم أو اغتُصب في عهد أوسركون الثاني',
    material: 'جرانيت أحمر', dimensions: 'الجزء المحفوظ من التاج: 1.95 م ارتفاعًا × 0.80 م عرضًا × 0.84 م عمقًا؛ ارتفاع العمود الكامل تقديري',
    confidence: 'مرتفع في أبعاد الجزء المحفوظ والوجهين الرئيسيين؛ متوسط في العمود الكامل والأجزاء العليا المفقودة',
    source: 'British Museum EA1107؛ تل بسطة',
    note: 'التاج ثنائي الوجه على السطحين الرئيسيين، وليس أربعة وجوه. رموز الشمال تُعرض فقط في النسخة الموثقة من الجانب الشمالي للقاعة.', evidence: 'attested-partial'
  }
};

function shadow(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }
function metadata(group, info, variant='') { group.userData.columnInfo={...info,variant}; group.traverse(o=>{if(o.isMesh){o.userData.columnInfo=group.userData.columnInfo;o.castShadow=true;o.receiveShadow=true;}}); return group; }

function compactColumnGroup(source) {
  source.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(source.matrixWorld).invert();
  const buckets = new Map();
  source.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    let geometry = child.geometry.clone();
    if (geometry.index) geometry = geometry.toNonIndexed();
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    if (!geometry.attributes.uv) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
    for (const name of Object.keys(geometry.attributes)) if (!['position','normal','uv'].includes(name)) geometry.deleteAttribute(name);
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, child.matrixWorld));
    const key=child.material.uuid;
    if(!buckets.has(key)) buckets.set(key,{material:child.material,geometries:[]});
    buckets.get(key).geometries.push(geometry);
  });
  const compact=new THREE.Group(); compact.name=source.name; let index=0;
  for(const bucket of buckets.values()){
    const merged=mergeGeometries(bucket.geometries,false); if(!merged) continue;
    merged.computeVertexNormals(); merged.computeBoundingBox(); merged.computeBoundingSphere();
    const mesh=shadow(new THREE.Mesh(merged,bucket.material)); mesh.name=`${source.name}_Merged_${String(++index).padStart(2,'0')}`; compact.add(mesh);
    bucket.geometries.forEach(g=>g.dispose());
  }
  return compact;
}

function latheGeometry(profile,segments=128){const pts=profile.map(([r,y])=>new THREE.Vector2(r,y));const g=new THREE.LatheGeometry(pts,segments);g.computeVertexNormals();return g;}

function profiledBundleGeometry({height,radiusBase,radiusTop,lobes=12,radialSegments=144,heightSegments=42,lobeAmplitude=.08,grooveSharpness=1.55}){
  const vertices=[],uvs=[],indices=[];
  for(let j=0;j<=heightSegments;j++){const t=j/heightSegments,y=t*height,baseR=THREE.MathUtils.lerp(radiusBase,radiusTop,t),entasis=1+.022*Math.sin(Math.PI*t);
    for(let i=0;i<=radialSegments;i++){const u=i/radialSegments,a=u*Math.PI*2,wave=Math.cos(lobes*a),lobe=Math.sign(wave)*Math.pow(Math.abs(wave),grooveSharpness),r=baseR*entasis*(1+lobeAmplitude*lobe);vertices.push(Math.cos(a)*r,y,Math.sin(a)*r);uvs.push(u,t);}}
  const row=radialSegments+1; for(let j=0;j<heightSegments;j++)for(let i=0;i<radialSegments;i++){const a=j*row+i,b=a+row;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

function modulatedCapitalGeometry({height,baseRadius,maxRadius,topRadius,lobes=12,radialSegments=144,heightSegments=36,open=false}){
  const vertices=[],uvs=[],indices=[];
  for(let j=0;j<=heightSegments;j++){const t=j/heightSegments,y=t*height,smooth=t*t*(3-2*t),bulge=Math.sin(Math.PI*Math.min(1,t*1.08));let baseR;
    if(open)baseR=THREE.MathUtils.lerp(baseRadius,maxRadius,smooth)*(.96+.04*bulge);else{const rise=THREE.MathUtils.lerp(baseRadius,maxRadius,Math.min(1,smooth*1.35)),fade=Math.max(0,(t-.62)/.38),taper=THREE.MathUtils.lerp(maxRadius,topRadius,fade);baseR=t<.62?rise:taper;}
    for(let i=0;i<=radialSegments;i++){const u=i/radialSegments,a=u*Math.PI*2,r=baseR*(1+(.025+.06*t)*Math.cos(lobes*a));vertices.push(Math.cos(a)*r,y,Math.sin(a)*r);uvs.push(u,t);}}
  const row=radialSegments+1;for(let j=0;j<heightSegments;j++)for(let i=0;i<radialSegments;i++){const a=j*row+i,b=a+row;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

function palmLeafGeometry({length=1.72,width=.34,thickness=.055,segments=34,widthSegments=8}){
  const vertices=[],uvs=[],indices=[];
  for(let side=0;side<2;side++){const zSign=side===0?1:-1;for(let i=0;i<=segments;i++){const t=i/segments,x=length*(.1*t+.9*Math.sin(t*Math.PI/2)),y=length*(.76*t-.20*t*t+.055*Math.sin(Math.PI*t)),w=width*Math.sin(Math.PI*Math.min(1,t*1.08))*(1-.56*t);for(let j=0;j<=widthSegments;j++){const v=j/widthSegments,zz=(v-.5)*2*w,camber=.10*w*Math.cos((v-.5)*Math.PI*2)*Math.sin(Math.PI*t);vertices.push(x,y+camber,zz+zSign*thickness/2);uvs.push(t,v);}}}
  const row=widthSegments+1,sheet=(segments+1)*row;for(let side=0;side<2;side++){const off=side*sheet;for(let i=0;i<segments;i++)for(let j=0;j<widthSegments;j++){const a=off+i*row+j,b=a+row;if(side===0)indices.push(a,b,a+1,b,b+1,a+1);else indices.push(a,a+1,b,b,a+1,b+1);}}
  for(let i=0;i<segments;i++)for(const j of [0,widthSegments]){const a=i*row+j,b=(i+1)*row+j,c=sheet+a,d=sheet+b;if(j===0)indices.push(a,c,b,b,c,d);else indices.push(a,b,c,b,d,c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

function createTube(points,radius,material,tubularSegments=40,radialSegments=12,name=''){const mesh=shadow(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),tubularSegments,radius,radialSegments,false),material));mesh.name=name;return mesh;}
function createCowEarGeometry(width=.28,height=.18,depth=.075){const s=new THREE.Shape();s.moveTo(-width*.48,0);s.bezierCurveTo(-width*.30,height*.66,width*.24,height*.68,width*.50,height*.05);s.bezierCurveTo(width*.24,-height*.22,-width*.22,-height*.20,-width*.48,0);const g=new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSegments:4,bevelSize:.018,bevelThickness:.018});g.center();g.computeVertexNormals();return g;}
function createAlmondGeometry(width=.18,height=.045,depth=.025){const s=new THREE.Shape();s.moveTo(-width/2,0);s.quadraticCurveTo(0,height,width/2,0);s.quadraticCurveTo(0,-height,-width/2,0);const g=new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.006,bevelThickness:.006});g.center();g.computeVertexNormals();return g;}

function createHathorMaskGeometry(detail='hero'){
  const g=new THREE.SphereGeometry(.5,detail==='hero'?64:44,detail==='hero'?48:32),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),yn=y/.5;
    const jawTaper=yn<-.02?THREE.MathUtils.lerp(1,.73,Math.min(1,(-yn-.02)/.98)):1;
    const templeTaper=yn>.60?THREE.MathUtils.lerp(1,.88,(yn-.60)/.40):1;
    const cheekPlane=.82+.18*Math.max(0,1-Math.abs(x/.5));
    p.setXYZ(i,x*.62*jawTaper*templeTaper,y*.84,z*.115*cheekPlane);
  }
  p.needsUpdate=true;g.computeVertexNormals();return g;
}

function createHathorNoseGeometry(){
  const wt=.052,wb=.068,hh=.175,fd=.056,bd=-.050;
  const vertices=[-wt,hh,fd,wt,hh,fd,-wb,-hh,fd,wb,-hh,fd,-wt,hh,bd,wt,hh,bd,-wb,-hh,bd,wb,-hh,bd];
  const indices=[0,2,1,1,2,3,4,5,6,5,7,6,0,1,4,1,5,4,2,6,3,3,6,7,0,4,2,2,4,6,1,3,5,3,7,5];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function addBraidedWig(holder,{x,capitalY,faceDirection,material,detail='hero'}){
  const rotationY=faceDirection<0?Math.PI:0;
  const backing=shadow(new THREE.Mesh(new RoundedBoxGeometry(.215,.79,.12,5,.035),material));
  backing.position.set(x,capitalY+.69,faceDirection*.475);backing.rotation.y=rotationY;backing.name='Hathor_Plaited_Wig_Backing';holder.add(backing);
  const beadGeometry=new THREE.SphereGeometry(.095,detail==='hero'?16:12,detail==='hero'?10:8);
  for(let k=0;k<7;k++){
    const bead=shadow(new THREE.Mesh(beadGeometry.clone(),material));
    bead.scale.set(.92,.40,.70);bead.position.set(x+(k%2?-.009:.009),capitalY+.42+k*.102,faceDirection*.552);bead.name=`Hathor_Plaited_Wig_Lock_${k+1}`;holder.add(bead);
  }
  const curl=shadow(new THREE.Mesh(new THREE.TorusGeometry(.082,.018,8,28,Math.PI*1.55),material));
  curl.position.set(x,capitalY+.35,faceDirection*.548);curl.rotation.set(faceDirection>0?Math.PI/2:-Math.PI/2,0,x>0?.15:Math.PI+.15);curl.name='Hathor_Wig_Terminal_Curl';holder.add(curl);
}

function addBaseRings(group,radius,material,y=0,heightScale=1){const specs=[[radius*1.48,radius*1.34,.20*heightScale],[radius*1.34,radius*1.20,.18*heightScale],[radius*1.20,radius*1.07,.17*heightScale]];let yy=y;specs.forEach(([rb,rt,h],i)=>{const mesh=shadow(new THREE.Mesh(latheGeometry([[rb,yy],[rb,yy+h*.16],[rt,yy+h*.84],[rt,yy+h]],128),material));mesh.name=`Column_Base_Ring_${i+1}`;group.add(mesh);yy+=h;});return yy;}
function addStoneTieBands(group,radius,levels,material){levels.forEach((y,i)=>{const mesh=shadow(new THREE.Mesh(latheGeometry([[radius*.98,y-.055],[radius*1.06,y-.02],[radius*1.07,y+.02],[radius*.98,y+.055]],112),material));mesh.name=`Carved_Tie_Band_${i+1}`;group.add(mesh);});}
function addIncisedVerticalPanel(group,y0,y1,radius,material,angle=0){const panel=shadow(new THREE.Mesh(new RoundedBoxGeometry(.17,y1-y0,.025,3,.015),material));panel.position.set(Math.cos(angle)*(radius+.017),(y0+y1)/2,Math.sin(angle)*(radius+.017));panel.rotation.y=-angle;panel.name='Incised_Royal_Text_Panel_Approximation';group.add(panel);for(let i=0;i<6;i++){const y=THREE.MathUtils.lerp(y0+.2,y1-.2,i/5),glyph=shadow(new THREE.Mesh(new THREE.TorusGeometry(.032+(i%2)*.01,.006,6,18),material));glyph.position.set(Math.cos(angle)*(radius+.038),y,Math.sin(angle)*(radius+.038));glyph.rotation.x=Math.PI/2;glyph.rotation.z=angle;glyph.name='Abstract_Incised_Glyph_Not_Transcription';group.add(glyph);}}

export function createPalmiformColumn({materials,totalHeight=6.32,radius=.50,detail='hero',position=new THREE.Vector3(),variant='EA1065'}={}){
  const referenceHeight=6.32,referenceRadius=.50,heightScale=totalHeight/referenceHeight,radiusScale=radius/referenceRadius;
  const cacheKey=`palm-v4|${totalHeight.toFixed(3)}|${radius.toFixed(3)}|${detail}|${materials.granite.uuid}`;if(COLUMN_TEMPLATE_CACHE.has(cacheKey)){const clone=COLUMN_TEMPLATE_CACHE.get(cacheKey).clone(true);clone.name=`Palmiform_EA1065_${variant}`;clone.position.copy(position);return metadata(clone,COLUMN_METADATA.palmiform_ea1065,variant);}
  const g=new THREE.Group();g.name=`Palmiform_EA1065_${variant}`;const baseY=addBaseRings(g,radius,materials.granite,0,heightScale),capitalH=1.46*heightScale,abacusH=.22*heightScale,shaftH=totalHeight-baseY-capitalH-abacusH,shaftProfile=[],steps=detail==='hero'?48:30;
  for(let i=0;i<=steps;i++){const t=i/steps,r=THREE.MathUtils.lerp(radius*1.01,radius*.81,t)*(1+.018*Math.sin(Math.PI*t));shaftProfile.push([r,baseY+shaftH*t]);}
  const shaft=shadow(new THREE.Mesh(latheGeometry(shaftProfile,detail==='hero'?160:112),materials.granite));shaft.name='EA1065_Monolithic_Shaft';g.add(shaft);const panelInset=.35*heightScale;addIncisedVerticalPanel(g,baseY+panelInset,baseY+shaftH-panelInset,radius*.92,materials.granite,0);addIncisedVerticalPanel(g,baseY+panelInset,baseY+shaftH-panelInset,radius*.92,materials.granite,Math.PI);
  const neckY=baseY+shaftH,neck=shadow(new THREE.Mesh(latheGeometry([[radius*.81,neckY],[radius*.88,neckY+.12*heightScale],[radius,neckY+.30*heightScale],[radius*1.04,neckY+.38*heightScale]],144),materials.granite));neck.name='Palmiform_Neck';g.add(neck);
  const leaf=palmLeafGeometry({length:1.30*heightScale,width:.24*radiusScale,thickness:.052*radiusScale,segments:detail==='hero'?38:28,widthSegments:detail==='hero'?8:6});for(let i=0;i<9;i++){const a=i*Math.PI*2/9,mesh=shadow(new THREE.Mesh(leaf.clone(),materials.granite));mesh.rotation.y=-a;mesh.position.set(Math.cos(a)*radius*.64,neckY+.26*heightScale,Math.sin(a)*radius*.64);mesh.name=`Carved_Palm_Frond_${String(i+1).padStart(2,'0')}`;g.add(mesh);const rib=createTube([new THREE.Vector3(radius*.62,0,0),new THREE.Vector3(radius*.80,.42*heightScale,0),new THREE.Vector3(radius*.92,.84*heightScale,0),new THREE.Vector3(radius*.86,1.20*heightScale,0)],.017*radiusScale,materials.granite,34,10,`Palm_Frond_Rib_${i+1}`);rib.rotation.y=-a;rib.position.y=neckY+.26*heightScale;g.add(rib);}
  const collar=shadow(new THREE.Mesh(latheGeometry([[radius,totalHeight-.38*heightScale],[radius*1.32,totalHeight-.30*heightScale],[radius*1.40,totalHeight-.24*heightScale]],128),materials.granite));g.add(collar);const abacus=shadow(new THREE.Mesh(new RoundedBoxGeometry(radius*2.72,abacusH,radius*2.72,5,.045*radiusScale),materials.granite));abacus.position.y=totalHeight-abacusH/2;g.add(abacus);
  const compact=compactColumnGroup(g);compact.userData.requestedTotalHeight=totalHeight;compact.userData.requestedRadius=radius;COLUMN_TEMPLATE_CACHE.set(cacheKey,compact.clone(true));compact.position.copy(position);return metadata(compact,COLUMN_METADATA.palmiform_ea1065,variant);
}

export function createPapyrusBundleColumn({materials,totalHeight=8.7,radius=.63,position=new THREE.Vector3(),detail='standard',variant='closed-bud-conservative',material=null}={}){
  const mat=material||materials.limestone,cacheKey=`papyrus-v4|${totalHeight.toFixed(3)}|${radius.toFixed(3)}|${detail}|${mat.uuid}`;if(COLUMN_TEMPLATE_CACHE.has(cacheKey)){const clone=COLUMN_TEMPLATE_CACHE.get(cacheKey).clone(true);clone.name=`Papyrus_Bundle_Column_${variant}`;clone.position.copy(position);return metadata(clone,COLUMN_METADATA.papyrus_bundle,variant);}
  const g=new THREE.Group();g.name=`Papyrus_Bundle_Column_${variant}`;const baseY=addBaseRings(g,radius,mat),capitalH=Math.max(1.55,radius*2.45),abacusH=.24,shaftH=Math.max(3.2,totalHeight-baseY-capitalH-abacusH);
  const shaft=shadow(new THREE.Mesh(profiledBundleGeometry({height:shaftH,radiusBase:radius,radiusTop:radius*.80,lobes:12,radialSegments:detail==='hero'?160:detail==='standard'?112:72,heightSegments:detail==='hero'?48:32,lobeAmplitude:detail==='hero'?.092:.082,grooveSharpness:1.7}),mat));shaft.position.y=baseY;shaft.name='Papyrus_Bundle_Shaft_12_Stems';g.add(shaft);addStoneTieBands(g,radius*.84,[baseY+shaftH*.24,baseY+shaftH*.52,baseY+shaftH*.78],mat);
  const capY=baseY+shaftH,capital=shadow(new THREE.Mesh(modulatedCapitalGeometry({height:capitalH,baseRadius:radius*.78,maxRadius:radius*1.34,topRadius:radius*1.02,lobes:12,radialSegments:detail==='hero'?160:112,heightSegments:detail==='hero'?44:30,open:false}),mat));capital.position.y=capY;capital.name='Papyrus_Closed_Bud_Capital_Conservative';g.add(capital);
  for(let i=0;i<12;i++){const a=i*Math.PI*2/12,rib=createTube([new THREE.Vector3(Math.cos(a)*radius*.80,0,Math.sin(a)*radius*.80),new THREE.Vector3(Math.cos(a)*radius*1.02,capitalH*.42,Math.sin(a)*radius*1.02),new THREE.Vector3(Math.cos(a)*radius*1.19,capitalH*.72,Math.sin(a)*radius*1.19),new THREE.Vector3(Math.cos(a)*radius*1.02,capitalH*.98,Math.sin(a)*radius*1.02)],.018,mat,28,8,`Papyrus_Petal_Rib_${i+1}`);rib.position.y=capY;g.add(rib);}
  const abacus=shadow(new THREE.Mesh(new RoundedBoxGeometry(radius*2.72,abacusH,radius*2.72,5,.04),mat));abacus.position.y=totalHeight-abacusH/2;g.add(abacus);const compact=compactColumnGroup(g);COLUMN_TEMPLATE_CACHE.set(cacheKey,compact.clone(true));compact.position.copy(position);return metadata(compact,COLUMN_METADATA.papyrus_bundle,variant);
}

function addHathorMask(holder,{materials,faceDirection=1,capitalY,documentedNorth=false,detail='hero'}){
  const granite=materials.granite,incised=granite,red=materials.paintedRed||granite,gold=materials.pigmentGold||granite,frontZ=faceDirection*.455,rotationY=faceDirection<0?Math.PI:0;
  const mask=shadow(new THREE.Mesh(createHathorMaskGeometry(detail),granite));mask.position.set(0,capitalY+.88,frontZ);mask.rotation.y=rotationY;mask.name=faceDirection>0?'Hathor_Face_Main_A_Flat_Mask':'Hathor_Face_Main_B_Flat_Mask';holder.add(mask);
  const nose=shadow(new THREE.Mesh(createHathorNoseGeometry(),granite));nose.position.set(0,capitalY+.92,faceDirection*.555);nose.rotation.y=rotationY;nose.name='Hathor_Broad_Plane_Nose';holder.add(nose);for(const sx of[-1,1])holder.add(createTube([new THREE.Vector3(sx*.052,capitalY+1.09,faceDirection*.615),new THREE.Vector3(sx*.058,capitalY+.92,faceDirection*.625),new THREE.Vector3(sx*.066,capitalY+.76,faceDirection*.64)],.0065,granite,18,6,'Hathor_Broad_Nose_Edge'));const noseTip=shadow(new THREE.Mesh(new THREE.SphereGeometry(.075,20,12),granite));noseTip.scale.set(.88,.48,.82);noseTip.position.set(0,capitalY+.755,faceDirection*.625);noseTip.name='Hathor_Nose_Tip';holder.add(noseTip);
  const eyeGeo=createAlmondGeometry(.185,.047,.018);for(const sx of [-1,1]){const eye=shadow(new THREE.Mesh(eyeGeo.clone(),incised));eye.position.set(sx*.18,capitalY+1.025,faceDirection*.522);eye.rotation.y=rotationY;eye.name='Hathor_Incised_Almond_Eye';holder.add(eye);const brow=createTube([new THREE.Vector3(sx*.275,capitalY+1.135,faceDirection*.525),new THREE.Vector3(sx*.18,capitalY+1.17,faceDirection*.535),new THREE.Vector3(sx*.075,capitalY+1.13,faceDirection*.525)],.013,incised,24,8,'Hathor_Incised_Brow');holder.add(brow);}
  const upperLip=createTube([new THREE.Vector3(-.12,capitalY+.735,faceDirection*.526),new THREE.Vector3(0,capitalY+.765,faceDirection*.538),new THREE.Vector3(.12,capitalY+.735,faceDirection*.526)],.014,incised,22,8,'Hathor_Upper_Lip'),lowerLip=createTube([new THREE.Vector3(-.10,capitalY+.705,faceDirection*.524),new THREE.Vector3(0,capitalY+.68,faceDirection*.532),new THREE.Vector3(.10,capitalY+.705,faceDirection*.524)],.012,incised,22,8,'Hathor_Lower_Lip');holder.add(upperLip,lowerLip);
  const earGeo=createCowEarGeometry(.40,.23,.065),innerEarGeo=createCowEarGeometry(.235,.105,.018);for(const sx of [-1,1]){const ear=shadow(new THREE.Mesh(earGeo.clone(),granite));ear.position.set(sx*.405,capitalY+1.015,faceDirection*.455);ear.rotation.set(0,rotationY,sx*.12);ear.name='Hathor_Stylized_Cow_Ear';holder.add(ear);const innerEar=shadow(new THREE.Mesh(innerEarGeo.clone(),incised));innerEar.position.set(sx*.415,capitalY+1.015,faceDirection*.507);innerEar.rotation.set(0,rotationY,sx*.12);innerEar.name='Hathor_Incised_Inner_Ear';holder.add(innerEar);addBraidedWig(holder,{x:sx*.31,capitalY,faceDirection,material:granite,detail});}
  const naos=shadow(new THREE.Mesh(new RoundedBoxGeometry(.80,.40,.34,6,.035),granite));naos.position.set(0,capitalY+1.55,faceDirection*.25);naos.name='Hathor_Naos_Sistrum_Reconstructed';holder.add(naos);const cornice=shadow(new THREE.Mesh(new RoundedBoxGeometry(.90,.13,.40,5,.03),granite));cornice.position.set(0,capitalY+1.80,faceDirection*.25);cornice.name='Hathor_Naos_Cornice_Reconstructed';holder.add(cornice);
  for(const sx of [-1,1]){holder.add(createTube([new THREE.Vector3(sx*.32,capitalY+1.48,faceDirection*.35),new THREE.Vector3(sx*.43,capitalY+1.69,faceDirection*.37),new THREE.Vector3(sx*.47,capitalY+1.90,faceDirection*.33),new THREE.Vector3(sx*.39,capitalY+2.015,faceDirection*.28)],.022,granite,36,10,'Hathor_Sistrum_Horn_Reconstructed'));const spiral=shadow(new THREE.Mesh(new THREE.TorusGeometry(.082,.019,9,34,Math.PI*1.55),granite));spiral.position.set(sx*.35,capitalY+2.025,faceDirection*.28);spiral.rotation.set(Math.PI/2,0,sx>0?.15:Math.PI+.15);spiral.name='Hathor_Sistrum_Horn_Spiral_Reconstructed';holder.add(spiral);}
  for(let i=0;i<5;i++){const x=(i-2)*.13,isNorthCrown=documentedNorth&&(i===0||i===4);holder.add(createTube([new THREE.Vector3(x,capitalY+1.43,faceDirection*.435),new THREE.Vector3(x+.012,capitalY+1.56,faceDirection*.474),new THREE.Vector3(x-.010,capitalY+1.67,faceDirection*.468)],.0135,granite,18,8,'Hathor_Uraeus_Cobra'));const hood=shadow(new THREE.Mesh(new THREE.SphereGeometry(.036,16,10),granite));hood.scale.set(1.22,1.55,.50);hood.position.set(x,capitalY+1.665,faceDirection*.475);hood.name='Hathor_Uraeus_Hood';holder.add(hood);if(isNorthCrown){const crown=shadow(new THREE.Mesh(new RoundedBoxGeometry(.058,.105,.025,3,.008),red));crown.position.set(x,capitalY+1.755,faceDirection*.49);crown.name='Lower_Egypt_Red_Crown_North_Attested';holder.add(crown);const crownStem=shadow(new THREE.Mesh(new RoundedBoxGeometry(.018,.075,.018,2,.005),red));crownStem.position.set(x+.034,capitalY+1.79,faceDirection*.492);crownStem.name='Lower_Egypt_Red_Crown_Stem_North_Attested';holder.add(crownStem);}else{const disk=shadow(new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,.012,24),gold));disk.rotation.x=faceDirection>0?Math.PI/2:-Math.PI/2;disk.position.set(x,capitalY+1.755,faceDirection*.49);disk.name='Hathor_Uraeus_Solar_Disk';holder.add(disk);}}
  if(documentedNorth)for(const sx of [-1,1]){holder.add(createTube([new THREE.Vector3(sx*.39,capitalY+1.28,faceDirection*.415),new THREE.Vector3(sx*.44,capitalY+1.47,faceDirection*.425),new THREE.Vector3(sx*.43,capitalY+1.65,faceDirection*.42)],.011,granite,22,8,'Papyrus_Emblem_North_Attested'));const bloom=shadow(new THREE.Mesh(new THREE.SphereGeometry(.055,20,12),granite));bloom.scale.set(1.45,.55,.62);bloom.position.set(sx*.43,capitalY+1.675,faceDirection*.43);bloom.name='Papyrus_Bloom_North_Attested';holder.add(bloom);}
}

export function createHathorColumn({materials,totalHeight=8.55,position=new THREE.Vector3(),detail='hero',northRotation=0,variant='EA1107-reconstructed'}={}){
  const documentedNorth=/attested|documented/i.test(variant),cacheKey=`hathor-v4|${totalHeight.toFixed(3)}|${detail}|${materials.granite.uuid}|${documentedNorth}`;if(COLUMN_TEMPLATE_CACHE.has(cacheKey)){const clone=COLUMN_TEMPLATE_CACHE.get(cacheKey).clone(true);clone.name=`Hathor_Column_${variant}`;clone.position.copy(position);clone.rotation.y=northRotation;return metadata(clone,COLUMN_METADATA.hathor_ea1107,variant);}
  const g=new THREE.Group();g.name=`Hathor_Column_${variant}`;const shaftRadius=.58,baseY=addBaseRings(g,shaftRadius,materials.granite),capitalHeight=1.95,abacusH=.26,transitionH=.54,shaftH=totalHeight-baseY-capitalHeight-abacusH-transitionH;
  const shaft=shadow(new THREE.Mesh(profiledBundleGeometry({height:shaftH,radiusBase:shaftRadius,radiusTop:shaftRadius*.82,lobes:12,radialSegments:detail==='hero'?176:112,heightSegments:detail==='hero'?52:34,lobeAmplitude:.095,grooveSharpness:1.72}),materials.granite));shaft.position.y=baseY;shaft.name='Hathor_Papyrus_Bundle_Shaft';g.add(shaft);addStoneTieBands(g,shaftRadius*.84,[baseY+shaftH*.27,baseY+shaftH*.55,baseY+shaftH*.82],materials.granite);addIncisedVerticalPanel(g,baseY+.45,baseY+shaftH-.32,shaftRadius*.91,materials.granite,0);addIncisedVerticalPanel(g,baseY+.45,baseY+shaftH-.32,shaftRadius*.91,materials.granite,Math.PI);
  const transitionY=baseY+shaftH,transition=shadow(new THREE.Mesh(modulatedCapitalGeometry({height:transitionH,baseRadius:shaftRadius*.80,maxRadius:.46,topRadius:.42,lobes:12,radialSegments:144,heightSegments:26,open:true}),materials.granite));transition.position.y=transitionY;g.add(transition);const capitalY=transitionY+transitionH,core=shadow(new THREE.Mesh(new RoundedBoxGeometry(.80,1.55,.84,8,.055),materials.granite));core.position.y=capitalY+.78;g.add(core);
  addHathorMask(g,{materials,faceDirection:1,capitalY,documentedNorth,detail});addHathorMask(g,{materials,faceDirection:-1,capitalY,documentedNorth,detail});
  const topBlock=shadow(new THREE.Mesh(new RoundedBoxGeometry(.96,.20,1.00,5,.04),materials.granite));topBlock.position.y=capitalY+capitalHeight-.36;g.add(topBlock);const abacus=shadow(new THREE.Mesh(new RoundedBoxGeometry(1.12,abacusH,1.16,5,.04),materials.granite));abacus.position.y=totalHeight-abacusH/2;g.add(abacus);
  const compact=compactColumnGroup(g);compact.userData.requestedTotalHeight=totalHeight;compact.userData.hathorPrincipalFaceCount=2;compact.userData.survivingCapitalReferenceM={height:1.95,width:.80,depth:.84};compact.userData.northSymbolsAttested=documentedNorth;COLUMN_TEMPLATE_CACHE.set(cacheKey,compact.clone(true));compact.position.copy(position);compact.rotation.y=northRotation;return metadata(compact,COLUMN_METADATA.hathor_ea1107,variant);
}

export function createColumnByType(type,options={}){if(type==='palm')return createPalmiformColumn(options);if(type==='hathor')return createHathorColumn(options);return createPapyrusBundleColumn(options);}
