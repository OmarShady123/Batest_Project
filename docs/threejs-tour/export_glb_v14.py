from __future__ import annotations
from pathlib import Path
import json, math
import numpy as np
from PIL import Image
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'exports' / 'bastet-temple-bubastis-v14-interactive-museum-experience.glb'
OUT.parent.mkdir(parents=True, exist_ok=True)
manifest = json.loads((ROOT/'assets/reliefs-v2/manifest.json').read_text(encoding='utf-8'))
asset = {a['id']: a for a in manifest}
scene = trimesh.Scene()

# PBR materials, using restrained reconstruction colours.
def mat(name, rgba, rough=.85, metal=.0):
    return PBRMaterial(name=name, baseColorFactor=list(rgba), roughnessFactor=rough, metallicFactor=metal)
M = {
 'sandstone': mat('Sandstone',[0.76,0.64,0.45,1],.92),
 'limestone': mat('Limestone',[0.84,0.78,0.65,1],.94),
 'mudbrick': mat('Mudbrick',[0.64,0.51,0.34,1],1.0),
 'granite': mat('Red_Granite',[0.56,0.31,0.29,1],.82,.01),
 'dark': mat('Dark_Granite',[0.34,0.29,0.27,1],.86,.0),
 'blue': mat('Egyptian_Blue_Traces',[0.18,0.36,0.45,1],.75),
 'green': mat('Green_Pigment_Traces',[0.29,0.43,0.31,1],.8),
 'red': mat('Red_Pigment_Traces',[0.54,0.24,0.21,1],.78),
 'gold': mat('Ochre_Gold',[0.72,0.55,0.24,1],.5,.1),
 'bronze': mat('Bronze_Interpretive',[0.34,0.27,0.16,1],.48,.55),
 'black': mat('Doorway_Shadow',[0.08,0.07,0.065,1],.9),
 'floor_joint': mat('Floor_Joints',[0.36,0.29,0.20,1],1.0),
 'dust': mat('Dust_Accumulation',[0.66,0.57,0.39,0.45],1.0),
 'wear': mat('Processional_Wear',[0.72,0.64,0.48,0.28],.98),
}

def add(mesh, name, material=None, metadata=None):
    if material is not None:
        mesh.visual = TextureVisuals(material=material)
    if metadata:
        mesh.metadata.update(metadata)
    scene.add_geometry(mesh, node_name=name, geom_name=name)
    return mesh


def conical_frustum(radius_top, radius_base, height, sections=32):
    """Create a capped frustum centered on Z, compatible with older trimesh builds."""
    sections=max(3,int(sections))
    angles=np.linspace(0.0, 2.0*math.pi, sections, endpoint=False)
    z0=-height/2.0; z1=height/2.0
    bottom=np.column_stack((np.cos(angles)*radius_base, np.sin(angles)*radius_base, np.full(sections,z0)))
    top=np.column_stack((np.cos(angles)*radius_top, np.sin(angles)*radius_top, np.full(sections,z1)))
    vertices=np.vstack((bottom, top, [[0,0,z0],[0,0,z1]]))
    cb=2*sections; ct=cb+1
    faces=[]
    for i in range(sections):
        j=(i+1)%sections
        faces.append([i,j,sections+j]); faces.append([i,sections+j,sections+i])
        if radius_base>1e-9: faces.append([cb,j,i])
        if radius_top>1e-9: faces.append([ct,sections+i,sections+j])
    return trimesh.Trimesh(vertices=vertices, faces=np.asarray(faces,dtype=np.int64), process=False)

def transform_translate(x,y,z):
    T=np.eye(4); T[:3,3]=[x,y,z]; return T

def box(w,h,d, material, x,y,z, name):
    mesh=trimesh.creation.box(extents=[w,h,d], transform=transform_translate(x,y,z))
    return add(mesh,name,material)

def cylinder(r1,r2,h,sections,material,x,y,z,name):
    # frustum if radii differ
    if abs(r1-r2)<1e-6:
        mesh=trimesh.creation.cylinder(radius=r1,height=h,sections=sections)
    else:
        mesh=conical_frustum(radius_top=r1,radius_base=r2,height=h,sections=sections)
    A=trimesh.geometry.align_vectors([0,0,1],[0,1,0])
    T=transform_translate(x,y,z)@A
    mesh.apply_transform(T)
    return add(mesh,name,material)

def cone(radius,height,sections,material,x,y,z,name,axis=(0,1,0)):
    mesh=trimesh.creation.cone(radius=radius,height=height,sections=sections)
    A=trimesh.geometry.align_vectors([0,0,1],axis)
    mesh.apply_transform(transform_translate(x,y,z)@A)
    return add(mesh,name,material)

def pylon(w,h,d,taper,material,x,y,z,name):
    bw=w/2;bd=d/2;tw=bw*taper;td=bd*taper;y0=-h/2;y1=h/2
    v=np.array([[-bw,y0,-bd],[bw,y0,-bd],[bw,y0,bd],[-bw,y0,bd],[-tw,y1,-td],[tw,y1,-td],[tw,y1,td],[-tw,y1,td]],float)
    f=np.array([[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]])
    mesh=trimesh.Trimesh(vertices=v,faces=f,process=True);mesh.apply_translation([x,y,z]);return add(mesh,name,material)

def wall(x,z,w,d,h=7,material=M['sandstone'],name='Wall'):
    return box(w,h,d,material,x,h/2,z,name)

def cross_wall(z,width,h=8,t=3.2,door=13,material=M['sandstone'],x=0,prefix='CrossWall',decorated=False):
    each=(width-door)/2
    wall(x-(door/2+each/2),z,each,t,h,material,f'{prefix}_Left')
    wall(x+(door/2+each/2),z,each,t,h,material,f'{prefix}_Right')
    box(door+2.3,2.2,t+1.3,material,x,h+1.1,z,f'{prefix}_Lintel')
    if decorated:
        for sx in [-1,1]: cylinder(.44,.44,h-.6,20,material,x+sx*(door/2+.58),h/2,z+1.7,f'{prefix}_Torus_{sx}')
        # horizontal torus approximation
        mesh=trimesh.creation.cylinder(radius=.44,height=door+2.1,sections=20)
        mesh.apply_transform(transform_translate(x,h-.2,z+1.7)@trimesh.geometry.align_vectors([0,0,1],[1,0,0]))
        add(mesh,f'{prefix}_Torus_Top',material)
        box(door+5,1.4,2.6,material,x,h+1.8,z,f'{prefix}_Cornice')



def beam_x(x1,x2,y,z,h=.9,d=1.3,material=M['sandstone'],name='BeamX'):
    return box(abs(x2-x1)+2.1,h,d,material,(x1+x2)/2,y,z,name)

def beam_z(x,z1,z2,y,w=1.3,h=.9,material=M['sandstone'],name='BeamZ'):
    return box(w,h,abs(z2-z1)+2.1,material,x,y,(z1+z2)/2,name)

def roof_slab(x,z,w,d,y,t=1.15,material=M['limestone'],name='RoofSlab'):
    return box(w,t,d,material,x,y,z,name)

def tie_hall_columns(xs,zs,beam_y,roof_y=None,beam_material=M['sandstone'],roof_material=M['limestone'],roof_bands=None,suffix='Hall',beam_d=1.3,beam_w=1.3):
    roof_bands = roof_bands or []
    for z in zs:
        for i in range(len(xs)-1):
            beam_x(xs[i], xs[i+1], beam_y, z, h=.9, d=beam_d, material=beam_material, name=f'{suffix}_BeamX_{i}_{z}')
    for x in xs:
        for i in range(len(zs)-1):
            beam_z(x, zs[i], zs[i+1], beam_y, w=beam_w, h=.9, material=beam_material, name=f'{suffix}_BeamZ_{i}_{x}')
    if roof_y is not None:
        for i,band in enumerate(roof_bands):
            roof_slab(band['x'], band['z'], band['w'], band['d'], roof_y, t=band.get('t',1.15), material=band.get('material', roof_material), name=f'{suffix}_Roof_{i}')





def build_v6_osorkon_gate():
    box(2.0,10.6,2.15,M['granite'],-7.5,5.3,13.15,'Osorkon_Jamb_Left')
    box(2.0,10.6,2.15,M['granite'],7.5,5.3,13.15,'Osorkon_Jamb_Right')
    box(17.3,.96,2.25,M['granite'],0,10.56,13.14,'Osorkon_Lintel')
    box(19.1,.74,2.25,M['granite'],0,11.15,13.10,'Osorkon_Cornice')
    box(15.8,.28,2.02,M['gold'],0,9.94,13.16,'Osorkon_Band')
    for sx in (-1,1):
        box(4.1,1.1,2.25,M['granite'],sx*10.7,1.0,13.05,f'Osorkon_Shoulder_{sx}')
        box(4.4,.46,2.35,M['granite'],sx*10.85,.23,13.05,f'Osorkon_Shoulder_Base_{sx}')
    box(9.6,.46,2.06,M['granite'],0,10.72,5.35,'Osorkon_Projecting_Beam')


def add_star_ceiling(x=0,y=12.34,z=-211,w=13.4,d=15.8):
    box(w,.34,d,M['dark'],x,y,z,'Sanctuary_Star_Roof_Slab')
    # symbolic stars as small gold discs under the slab
    coords=[]
    for ix in range(-4,5):
        for iz in range(-5,6):
            if (ix+iz)%2==0:
                coords.append((ix*1.35, iz*1.35))
    for i,(dx,dz) in enumerate(coords):
        mesh=trimesh.creation.cylinder(radius=.09,height=.02,sections=12)
        mesh.apply_transform(transform_translate(x+dx, y-.38, z+dz)@trimesh.geometry.align_vectors([0,0,1],[0,-1,0]))
        add(mesh, f'Star_{i}', M['gold'])


def build_v6_sanctuary_enhancements():
    box(8.0,.82,8.8,M['granite'],0,.41,-211,'Sanctuary_Podium')
    box(5.1,.42,3.15,M['limestone'],0,.21,-198.95,'Sanctuary_Threshold_Platform')
    add_star_ceiling()
    box(1.7,3.65,1.4,M['granite'],-4.0,1.83,-198.72,'Sanctuary_Front_Block_L')
    box(1.7,3.65,1.4,M['granite'],4.0,1.83,-198.72,'Sanctuary_Front_Block_R')
    for sx in (-2.8,2.8):
        cylinder(.16,.21,1.72,18,M['gold'],sx,.86,-199.6,f'Incense_Stem_{sx}')
        cylinder(.34,.28,.28,20,M['granite'],sx,1.88,-199.6,f'Incense_Bowl_{sx}')
    box(2.35,.92,1.95,M['granite'],0,.78,-205.1,'Sanctuary_Central_Offering_Block')

def build_superstructure():
    tie_hall_columns(xs=[-32,-16,16,32], zs=[112,132,152], beam_y=9.95, roof_y=11.0, suffix='Hall1', roof_bands=[
        {'x':-25,'z':132,'w':18,'d':56,'t':.72}, {'x':25,'z':132,'w':18,'d':56,'t':.72}
    ])
    tie_hall_columns(xs=[-34,-20,-7,7,20,34], zs=[42,61,80], beam_y=9.45, roof_y=10.45, suffix='Hall2', roof_bands=[
        {'x':-26.5,'z':61,'w':13.5,'d':44,'t':.68}, {'x':0.0,'z':61,'w':10.0,'d':44,'t':.64}, {'x':26.5,'z':61,'w':13.5,'d':44,'t':.68}
    ])
    tie_hall_columns(xs=[-22,0,22], zs=[-67,-83,-99], beam_y=10.15, roof_y=11.2, suffix='MainHall', roof_bands=[
        {'x':-15.5,'z':-83,'w':15,'d':40,'t':.72}, {'x':15.5,'z':-83,'w':15,'d':40,'t':.72}
    ])
    tie_hall_columns(xs=[-22,-7,7,22], zs=[-116,-132,-148], beam_y=8.9, roof_y=9.95, suffix='InnerHall', roof_bands=[
        {'x':-14.5,'z':-132,'w':13.5,'d':39,'t':.70}, {'x':14.5,'z':-132,'w':13.5,'d':39,'t':.70}
    ])
    tie_hall_columns(xs=[-18,18], zs=[-168,-184], beam_y=10.05, roof_y=11.0, suffix='HathorHall', beam_material=M['granite'], roof_material=M['sandstone'], beam_d=1.55, beam_w=1.55, roof_bands=[
        {'x':0,'z':-168,'w':46,'d':6.5,'material':M['sandstone'],'t':.64}, {'x':0,'z':-184,'w':46,'d':6.5,'material':M['sandstone'],'t':.64}, {'x':0,'z':-176,'w':10,'d':10,'material':M['granite'],'t':.76}
    ])
    roof_slab(0,-202.5,21,8.5,8.75,t=.62,material=M['granite'],name='Sanctuary_Approach_Roof')


def lathe_mesh(profile, segments=96):
    profile=np.asarray(profile,float)
    n=len(profile)
    verts=[]
    for i in range(segments):
        a=2*math.pi*i/segments
        ca,sa=math.cos(a),math.sin(a)
        for r,y in profile:
            verts.append([ca*r,y,sa*r])
    faces=[]
    for i in range(segments):
        ni=(i+1)%segments
        for j in range(n-1):
            a=i*n+j; b=ni*n+j
            faces += [[a,b,a+1],[b,b+1,a+1]]
    return trimesh.Trimesh(vertices=np.asarray(verts),faces=np.asarray(faces),process=False)

def bundle_shaft_mesh(height,radius_base,radius_top,lobes=12,radial_segments=80,height_segments=22,lobe_amplitude=.075):
    verts=[]; faces=[]
    for j in range(height_segments+1):
        t=j/height_segments; y=t*height
        br=(radius_base*(1-t)+radius_top*t)*(1+.018*math.sin(math.pi*t))
        for i in range(radial_segments):
            a=2*math.pi*i/radial_segments
            r=br*(1+lobe_amplitude*math.cos(lobes*a))
            verts.append([math.cos(a)*r,y,math.sin(a)*r])
    row=radial_segments
    for j in range(height_segments):
        for i in range(radial_segments):
            ni=(i+1)%radial_segments
            a=j*row+i; b=(j+1)*row+i; c=j*row+ni; d=(j+1)*row+ni
            faces += [[a,b,c],[b,d,c]]
    return trimesh.Trimesh(vertices=np.asarray(verts),faces=np.asarray(faces),process=False)

def leaf_mesh(length=1.35,width=.28,thickness=.04,segments=24,width_segments=5):
    verts=[]; faces=[]
    for side in range(2):
        zsign=1 if side==0 else -1
        for i in range(segments+1):
            t=i/segments
            x=length*(.035*t+.16*math.sin(t*math.pi/2))
            y=length*(.96*t-.035*t*t)
            w=width*(math.sin(math.pi*min(1,t))**.72)*(1-.20*t)
            for j in range(width_segments+1):
                v=j/width_segments
                zz=(v-.5)*2*w
                camber=.12*w*math.cos((v-.5)*math.pi*2)*math.sin(math.pi*t)
                verts.append([x,y+camber,zz+zsign*thickness/2])
    row=width_segments+1; sheet=(segments+1)*row
    for side in range(2):
        off=side*sheet
        for i in range(segments):
            for j in range(width_segments):
                a=off+i*row+j;b=a+row
                if side==0: faces += [[a,b,a+1],[b,b+1,a+1]]
                else: faces += [[a,a+1,b],[b,a+1,b+1]]
    for i in range(segments):
        for j in (0,width_segments):
            a=i*row+j;b=(i+1)*row+j;c=sheet+a;d=sheet+b
            if j==0: faces += [[a,c,b],[b,c,d]]
            else: faces += [[a,b,c],[b,d,c]]
    return trimesh.Trimesh(vertices=np.asarray(verts),faces=np.asarray(faces),process=False)

def face_relief_mesh(width=.61,height=1.08,depth=.105,nx=46,ny=62):
    verts=[];faces=[]
    def gauss(x,y,cx,cy,sx,sy,amp):
        return amp*math.exp(-(((x-cx)**2)/(2*sx*sx)+((y-cy)**2)/(2*sy*sy)))
    for side in range(2):
        for j in range(ny+1):
            v=j/ny;y=(v-.5)*height
            for i in range(nx+1):
                u=i/nx;x=(u-.5)*width;z=-depth*.25
                if side==0:
                    oval=max(0,1-(x/(width*.43))**2-((y+height*.03)/(height*.48))**2)
                    z=depth*(.16+.5*oval)
                    z+=gauss(x,y,0,.07*height,.065*width,.24*height,depth*.55)
                    z+=gauss(x,y,-.19*width,.06*height,.12*width,.10*height,depth*.24)
                    z+=gauss(x,y,.19*width,.06*height,.12*width,.10*height,depth*.24)
                    z+=gauss(x,y,-.19*width,.08*height,.085*width,.025*height,depth*.16)
                    z+=gauss(x,y,.19*width,.08*height,.085*width,.025*height,depth*.16)
                    z+=gauss(x,y,0,-.20*height,.11*width,.025*height,depth*.18)
                    z+=gauss(x,y,0,-.25*height,.16*width,.06*height,depth*.12)
                    z-=gauss(x,y,0,-.02*height,.025*width,.06*height,depth*.10)
                verts.append([x,y,z])
    row=nx+1;front=(nx+1)*(ny+1)
    for side in range(2):
        off=side*front
        for j in range(ny):
            for i in range(nx):
                a=off+j*row+i;b=a+row
                if side==0:faces += [[a,b,a+1],[b,b+1,a+1]]
                else:faces += [[a,a+1,b],[b,a+1,b+1]]
    # perimeter walls
    for i in range(nx):
        a=i;b=i+1;c=front+i;d=c+1;faces += [[a,b,c],[b,d,c]]
        a=ny*row+i;b=a+1;c=front+a;d=c+1;faces += [[a,c,b],[b,c,d]]
    for j in range(ny):
        a=j*row;b=(j+1)*row;c=front+a;d=front+b;faces += [[a,c,b],[b,c,d]]
        a=j*row+nx;b=(j+1)*row+nx;c=front+a;d=front+b;faces += [[a,b,c],[b,d,c]]
    return trimesh.Trimesh(vertices=np.asarray(verts),faces=np.asarray(faces),process=False)

def cylinder_between(p1,p2,radius,sections=12):
    p1=np.asarray(p1,float);p2=np.asarray(p2,float);v=p2-p1;L=np.linalg.norm(v)
    mesh=trimesh.creation.cylinder(radius=radius,height=L,sections=sections)
    A=trimesh.geometry.align_vectors([0,0,1],v/L)
    T=np.eye(4);T[:3,3]=(p1+p2)/2
    mesh.apply_transform(T@A)
    return mesh

def add_group_meshes(parts,prefix,x,z):
    # parts: list[(mesh, material, suffix)]
    by={}
    for mesh,material,suffix in parts:
        mesh.apply_translation([x,.18,z])
        key=(id(material),suffix.split('_')[0])
        by.setdefault((material,suffix.split('_')[0]),[]).append(mesh)
    for (material,cat),meshes in by.items():
        combined=trimesh.util.concatenate(meshes)
        add(combined,f'{prefix}_{cat}',material,{'column_family':prefix})

def base_parts(radius,material):
    parts=[];yy=0
    for k,(rt,rb,h) in enumerate([(radius*1.34,radius*1.46,.20),(radius*1.22,radius*1.34,.18),(radius*1.07,radius*1.20,.17)]):
        m=conical_frustum(rt,rb,h,96);m.apply_transform(transform_translate(0,yy+h/2,0)@trimesh.geometry.align_vectors([0,0,1],[0,1,0]));parts.append((m,material,f'Stone_Base{k}'));yy+=h
    return parts,yy

COLUMN_SERIAL = 0

def stone_torus(radius, tube, y, material, suffix='Stone_Tie'):
    ring=trimesh.creation.torus(major_radius=radius,minor_radius=tube,major_sections=96,minor_sections=10)
    ring.apply_transform(transform_translate(0,y,0)@trimesh.geometry.align_vectors([0,0,1],[0,1,0]))
    return ring,material,suffix

def palmiform_column(x,z,name='Palmiform_EA1065'):
    parts,basey=base_parts(.50,M['granite']); total=6.32; cap_h=1.46; ab_h=.22; shaft_h=total-basey-cap_h-ab_h
    profile=[]
    for i in range(49):
        t=i/48; r=(.505*(1-t)+.405*t)*(1+.018*math.sin(math.pi*t)); profile.append([r,basey+shaft_h*t])
    parts.append((lathe_mesh(profile,160),M['granite'],'Stone_Shaft'))
    necky=basey+shaft_h
    parts.append((lathe_mesh([[.405,necky],[.44,necky+.12],[.50,necky+.30],[.52,necky+.38]],144),M['granite'],'Stone_Neck'))
    leaf=leaf_mesh(length=1.30,width=.24,thickness=.052,segments=34,width_segments=8)
    for i in range(9):
        a=2*math.pi*i/9; R=trimesh.transformations.rotation_matrix(-a,[0,1,0]); m=leaf.copy(); m.apply_transform(transform_translate(math.cos(a)*.32,necky+.26,math.sin(a)*.32)@R); parts.append((m,M['granite'],'Stone_Leaf'))
        pts=[[.31,0,0],[.40,.42,0],[.46,.84,0],[.43,1.20,0]]
        for p0,p1 in zip(pts[:-1],pts[1:]):
            rib=cylinder_between(p0,p1,.017,10); rib.apply_transform(transform_translate(0,necky+.31,0)@R); parts.append((rib,M['granite'],'Stone_Rib'))
    parts.append((lathe_mesh([[.50,total-.38],[.66,total-.30],[.70,total-.24]],128),M['granite'],'Stone_Collar'))
    parts.append((trimesh.creation.box([1.36,ab_h,1.36],transform=transform_translate(0,total-ab_h/2,0)),M['granite'],'Stone_Abacus'))
    add_group_meshes(parts,name,x,z)

def papyrus_column(x,z,h=8.7,r=.63,material=M['limestone'],name='Papyrus_Bundle'):
    parts,basey=base_parts(r,material); cap_h=max(1.55,r*2.45); ab_h=.24; shaft_h=max(3.2,h-basey-cap_h-ab_h)
    shaft=bundle_shaft_mesh(shaft_h,r,r*.80,12,112,32,.085); shaft.apply_translation([0,basey,0]); parts.append((shaft,material,'Stone_Shaft'))
    for yy in [basey+shaft_h*.24,basey+shaft_h*.52,basey+shaft_h*.78]: parts.append(stone_torus(r*.90,.025,yy,material))
    capy=basey+shaft_h
    profile=[[r*.78,capy],[r*.82,capy+.15],[r*.98,capy+.48],[r*1.25,capy+.92],[r*1.34,capy+cap_h*.68],[r*1.10,capy+cap_h*.92],[r*1.02,capy+cap_h]]
    parts.append((lathe_mesh(profile,128),material,'Stone_Capital'))
    parts.append((trimesh.creation.box([r*2.72,ab_h,r*2.72],transform=transform_translate(0,h-ab_h/2,0)),material,'Stone_Abacus'))
    add_group_meshes(parts,name,x,z)

def hathor_face_parts(face_dir,capy,documented=False):
    parts=[]
    face=face_relief_mesh(width=.61,height=1.08,depth=.14,nx=56,ny=76)
    face.apply_transform(transform_translate(0,capy+.82,face_dir*.48)@trimesh.transformations.rotation_matrix(0 if face_dir>0 else math.pi,[0,1,0])); parts.append((face,M['granite'],'Stone_Face'))
    for sx in [-1,1]:
        ear=trimesh.creation.uv_sphere(radius=.12,count=[28,18]); ear.apply_scale([1.65,.70,.36]); ear.apply_translation([sx*.39,capy+1.00,face_dir*.47]); parts.append((ear,M['granite'],'Stone_Ear'))
        wig=trimesh.creation.box([.22,.80,.14],transform=transform_translate(sx*.31,capy+.69,face_dir*.47)); parts.append((wig,M['granite'],'Stone_Wig'))
    naos=trimesh.creation.box([.80,.40,.34],transform=transform_translate(0,capy+1.55,face_dir*.25)); parts.append((naos,M['granite'],'Stone_Naos'))
    corn=trimesh.creation.box([.90,.13,.40],transform=transform_translate(0,capy+1.80,face_dir*.25)); parts.append((corn,M['granite'],'Stone_Naos'))
    for sx in [-1,1]:
        pts=[[sx*.32,capy+1.50,face_dir*.36],[sx*.44,capy+1.72,face_dir*.38],[sx*.48,capy+1.92,face_dir*.34],[sx*.40,capy+2.04,face_dir*.28]]
        for p0,p1 in zip(pts[:-1],pts[1:]): parts.append((cylinder_between(p0,p1,.025,12),M['granite'],'Stone_Horn'))
    for i in range(5):
        xx=(i-2)*.13; pts=[[xx,capy+1.43,face_dir*.44],[xx+.012,capy+1.57,face_dir*.48],[xx-.012,capy+1.68,face_dir*.47]]
        for p0,p1 in zip(pts[:-1],pts[1:]): parts.append((cylinder_between(p0,p1,.015,10),M['granite'],'Stone_Cobra'))
        disk=trimesh.creation.cylinder(radius=.034,height=.014,sections=24); disk.apply_transform(transform_translate(xx,capy+1.76,face_dir*.49)@trimesh.geometry.align_vectors([0,0,1],[0,0,face_dir])); parts.append((disk,M['red'] if documented and i in (0,4) else M['gold'],'Pigment_Disk'))
    if documented:
        for sx in [-1,1]:
            pts=[[sx*.39,capy+1.28,face_dir*.42],[sx*.44,capy+1.48,face_dir*.43],[sx*.43,capy+1.67,face_dir*.42]]
            for p0,p1 in zip(pts[:-1],pts[1:]): parts.append((cylinder_between(p0,p1,.012,10),M['granite'],'Stone_Papyrus'))
    return parts

def hathor_column(x,z,h=8.55,name='Hathor_EA1107',north_rotation=0,documented=False):
    parts,basey=base_parts(.58,M['granite']); cap_h=1.95; ab_h=.26; trans_h=.54; shaft_h=h-basey-cap_h-ab_h-trans_h
    shaft=bundle_shaft_mesh(shaft_h,.58,.58*.82,12,144,42,.095); shaft.apply_translation([0,basey,0]); parts.append((shaft,M['granite'],'Stone_Shaft'))
    for yy in [basey+shaft_h*.27,basey+shaft_h*.55,basey+shaft_h*.82]: parts.append(stone_torus(.50,.025,yy,M['granite']))
    ty=basey+shaft_h
    trans=lathe_mesh([[.46,ty],[.48,ty+.12],[.44,ty+.32],[.42,ty+trans_h]],128); parts.append((trans,M['granite'],'Stone_Transition'))
    capy=ty+trans_h
    parts.append((trimesh.creation.box([.80,1.55,.84],transform=transform_translate(0,capy+.78,0)),M['granite'],'Stone_Core'))
    # EA1107 is represented as bifacial: two principal faces, front and back.
    parts.extend(hathor_face_parts(1,capy,documented)); parts.extend(hathor_face_parts(-1,capy,documented))
    parts.append((trimesh.creation.box([.96,.20,1.00],transform=transform_translate(0,capy+cap_h-.36,0)),M['granite'],'Stone_Upper'))
    parts.append((trimesh.creation.box([1.12,ab_h,1.16],transform=transform_translate(0,h-ab_h/2,0)),M['granite'],'Stone_Abacus'))
    R=trimesh.transformations.rotation_matrix(north_rotation,[0,1,0])
    for m,ma,suf in parts: m.apply_transform(R)
    add_group_meshes(parts,name,x,z)

def column(x,z,h=8.7,r=.63,material=M['limestone'],capital='papyrus',name='Column',painted=True,detail='standard',north_rotation=0,documented=False):
    if capital=='palm': return palmiform_column(x,z,name)
    if capital=='hathor': return hathor_column(x,z,h,name,north_rotation,documented)
    return papyrus_column(x,z,h,r,material,name)

def column_grid(xs,zs,**kw):
    global COLUMN_SERIAL
    for zz in zs:
        for xx in xs:
            COLUMN_SERIAL += 1
            prefix=kw.get('capital','papyrus')
            column(xx,zz,name=f"{prefix}_Column_{COLUMN_SERIAL:03d}_x{xx}_z{zz}",**kw)


# Architecture
box(124,1.8,462,M['limestone'],0,-.9,0,'Temple_Platform')
wall(-60.5,0,3.7,450,7.3,M['mudbrick'],'Outer_Wall_North');wall(60.5,0,3.7,450,7.3,M['mudbrick'],'Outer_Wall_South')
cross_wall(225,124,7.2,3.7,14,M['mudbrick'],prefix='East_Enclosure')
cross_wall(-225,124,7.2,3.7,12,M['mudbrick'],prefix='West_Enclosure')
pylon(25,26,13,.76,M['sandstone'],-25,13,207,'East_Pylon_Left');pylon(25,26,13,.76,M['sandstone'],25,13,207,'East_Pylon_Right')
box(14.4,18.4,7.4,M['granite'],0,9.2,207,'East_Gateway');box(9.2,13.2,8.2,M['black'],0,6.6,203.5,'East_Doorway');box(15.2,2,9.5,M['gold'],0,19.2,207,'East_Lintel')
column(-9,190,h=6.32,r=.48,capital='palm',material=M['granite'],name='EA1065_Palmiform_West');column(9,190,h=6.32,r=.48,capital='palm',material=M['granite'],name='EA1065_Palmiform_East')
for x,z,l in [(-46,125,90),(46,125,90),(-46,58,62),(46,58,62),(-48,-20,70),(48,-20,70),(-34,-125,140),(34,-125,140),(-39,-208,34),(39,-208,34)]: wall(x,z,3,l,8,M['sandstone'],f'Long_Wall_{x}_{z}')
for i,(z,w,h,d,ma) in enumerate([(172,92,8.5,15,M['sandstone']),(96,92,8.5,14,M['sandstone']),(25,92,9.5,12,M['granite']),(13,96,12,12,M['sandstone']),(-56,96,8.5,13,M['sandstone']),(-106,68,8.5,12,M['sandstone']),(-156,68,8.5,11,M['sandstone']),(-195,78,9,10,M['granite'])]): cross_wall(z,w,h,3.2,d,ma,prefix=f'Gate_{i+1}',decorated=True)
column_grid([-32,-16,16,32],[112,132,152],h=9.2,r=.78)
column_grid([-34,-20,-7,7,20,34],[42,61,80],h=8.7,r=.68)
column_grid([-37,-18,0,18,37],[-47,3],h=7.3,r=.58,material=M['granite'])
column_grid([-40,40],[-37,-21,-5],h=7.3,r=.58,material=M['granite'])
column_grid([-22,0,22],[-67,-83,-99],h=9.8,r=.76)
column_grid([-22,-7,7,22],[-116,-132,-148],h=8.5,r=.64)
column(-18,-168,h=8.55,capital='hathor',material=M['granite'],name='EA1107_Hathor_North_Side_Attested',documented=True)
column(18,-168,h=8.55,capital='hathor',material=M['granite'],name='EA1107_Hathor_Reconstructed_02')
column(-18,-184,h=8.55,capital='hathor',material=M['granite'],name='EA1107_Hathor_Reconstructed_03')
column(18,-184,h=8.55,capital='hathor',material=M['granite'],name='EA1107_Hathor_Reconstructed_04')
small=6.8
wall(-22,-206,3,34,small,M['sandstone'],'Inner_Wall_L');wall(22,-206,3,34,small,M['sandstone'],'Inner_Wall_R')
cross_wall(-202,47,small,3,8,M['sandstone'],prefix='Inner_Sanctuary_Gate_1',decorated=True);cross_wall(-220,47,small,3,7,M['sandstone'],prefix='Inner_Sanctuary_Gate_2',decorated=True)
for x,z,w,d in [(-12,-211,3,18),(12,-211,3,18),(-29,-214,13,3),(29,-214,13,3),(-29,-202,13,3),(29,-202,13,3)]:wall(x,z,w,d,small,M['sandstone'],f'Sanctuary_Partition_{x}_{z}')
# naos
box(18.2,1.45,21.2,M['granite'],0,.72,-211,'Naos_Base');box(14.2,11.6,16.8,M['dark'],0,6.55,-211,'Naos_Core');box(10.8,8.6,1.22,M['granite'],0,5.15,-201.82,'Naos_Front_Frame');box(4.9,6.45,1.18,M['dark'],0,4.05,-201.16,'Naos_Door');box(17.0,1.18,19.4,M['limestone'],0,12.28,-211,'Naos_Roof')
for x in [-6.15,6.15]:box(1.12,10.4,1.35,M['granite'],x,6.0,-201.25,f'Naos_Pilaster_{x}')
box(13.4,.78,1.7,M['granite'],0,11.32,-201.35,'Naos_Lintel');box(15.2,.82,2.08,M['gold'],0,11.95,-201.28,'Naos_Band')
build_superstructure()
def build_v13_museum_details():
    floor_sections=[
        {'z':188,'w':78,'d':42}, {'z':132,'w':82,'d':55}, {'z':61,'w':84,'d':48},
        {'z':-20,'w':88,'d':62}, {'z':-82,'w':62,'d':48}, {'z':-132,'w':58,'d':44}, {'z':-176,'w':52,'d':34},
    ]
    for section in floor_sections:
        x=-section['w']/2+6
        while x < section['w']/2:
            box(.035,.018,section['d'],M['floor_joint'],x,.018,section['z'],f"Floor_Joint_X_{section['z']}_{x:.1f}")
            x += 7.5
        z=section['z']-section['d']/2+6
        while z < section['z']+section['d']/2:
            box(section['w'],.018,.035,M['floor_joint'],0,.019,z,f"Floor_Joint_Z_{section['z']}_{z:.1f}")
            z += 7.5
    for x,z,d,w in [(-45.8,132,88,1.1),(45.8,132,88,1.1),(-45.8,61,58,1.1),(45.8,61,58,1.1),(-47.8,-20,66,1.1),(47.8,-20,66,1.1),(-33.8,-132,132,1.0),(33.8,-132,132,1.0)]:
        box(w,.025,d,M['dust'],x,.026,z,f'Dust_Base_{x}_{z}')
    box(7.5,.014,430,M['wear'],0,.016,4,'Processional_Path_Wear')

build_v13_museum_details()
build_v6_osorkon_gate()
build_v6_sanctuary_enhancements()

# dark columns
column(22,143,h=8.8,r=.72,material=M['dark'],painted=False,name='Dark_Column_1');column(34,122,h=8.8,r=.72,material=M['dark'],painted=False,name='Dark_Column_2');column(20,60,h=8.3,r=.66,material=M['dark'],painted=False,name='Dark_Column_3')

# Interpretive Bastet cult focus (named as interpretive in node metadata)
parts=[]
def P(mesh,ma):mesh.visual=TextureVisuals(material=ma);parts.append(mesh)
P(trimesh.creation.box([5.2,1.8,5.2],transform=transform_translate(0,.9,0)),M['dark'])
for rr1,rr2,hh,yy in [(.85,1.2,4.3,4),(0,1.35,3.1,2.35)]:
    if rr1==0: me=trimesh.creation.cone(radius=rr2,height=hh,sections=28)
    else: me=conical_frustum(radius_top=rr1,radius_base=rr2,height=hh,sections=28)
    me.apply_transform(transform_translate(0,yy,0)@trimesh.geometry.align_vectors([0,0,1],[0,1,0]));P(me,M['bronze'])
head=trimesh.creation.icosphere(subdivisions=2,radius=.78);head.apply_scale([.82,1,.92]);head.apply_translation([0,6.65,0]);P(head,M['bronze'])
for sx in [-1,1]:
    ear=trimesh.creation.cone(radius=.33,height=.9,sections=14);ear.apply_transform(transform_translate(sx*.42,7.35,0)@trimesh.geometry.align_vectors([0,0,1],[sx*.15,1,0]));P(ear,M['bronze'])
figure=trimesh.util.concatenate(parts);figure.apply_translation([0,1.25,-211]);add(figure,'Bastet_Cult_Focus_INTERPRETIVE',metadata={'certainty':'interpretive; original cult statue form unknown'})
# offering table
for idx,(xx,zz,sc) in enumerate([(0,-197.2,.92),(0,-87,.65),(0,-146,.58)]):
    parts=[]
    top=trimesh.creation.box([4*sc,.5*sc,2.6*sc],transform=transform_translate(0,2.2*sc,0));top.visual=TextureVisuals(material=M['granite']);parts.append(top)
    stem=conical_frustum(radius_top=.5*sc,radius_base=.7*sc,height=2.2*sc,sections=20);stem.apply_transform(transform_translate(0,1.1*sc,0)@trimesh.geometry.align_vectors([0,0,1],[0,1,0]));stem.visual=TextureVisuals(material=M['granite']);parts.append(stem)
    tab=trimesh.util.concatenate(parts);tab.apply_translation([xx,.1,zz]);add(tab,f'Offering_Table_{idx}_INTERPRETIVE')

# Relief placements: same as the Three.js project.
placements=[
('entrance_adoration','East_Pylon_Left_Adoration',18,8.5,-25,13.2,213.65,'z+',.12),('sed_ritual_objects','East_Pylon_Right_Ritual_Objects',18,8.5,25,13.2,213.65,'z+',.12),('sed_figures_and_text','Pylon_Inner_Left',17,7.4,-25,12.4,200.35,'z-',.11),('sed_offering_bands','Pylon_Inner_Right',17,7.4,25,12.4,200.35,'z-',.11),('reconstructed_kheker_band','Entrance_Lintel_Frieze',13.2,2.3,0,16.4,210.62,'z+',.08),
('hall_procession_a','Hall1_Left_Procession',31,6.4,-44.4,4.8,136,'x+',.16),('sed_small_fragments','Hall1_Right_Fragments',31,6.4,44.4,4.8,136,'x-',.16),('sed_seated_and_standing','Hall1_West_Register',35,5.9,0,4.7,97.68,'z+',.15),('hall_offering_a','Hall2_Left_Offerings',34,6.2,-44.4,4.8,62,'x+',.16),('sed_grouped_deities','Hall2_Right_Deities',34,6.2,44.4,4.8,62,'x-',.16),('sed_boat_or_emblem','Hall2_West_Ceremonial',36,5.8,0,4.7,26.67,'z+',.15),
('inner_gate_inscriptions','Inner_Gate_Left',30,6.2,-27,6.3,26.73,'z+',.18),('sed_deity_inventory','Inner_Gate_Right',30,6.2,27,6.3,26.73,'z+',.18),('reconstructed_kheker_band','Inner_Gate_Frieze',82,1.7,0,10.8,26.74,'z+',.08),
('sed_royal_kiosk','HebSed_East_Left_Royal_Kiosk',35,8.1,-27,6.4,11.27,'z-',.24),('sed_multi_register_01','HebSed_East_Right_MultiRegister',35,8.1,27,6.4,11.27,'z-',.24),('sed_procession_fragment','HebSed_Left_East_Procession',20,6.8,-46.42,4.8,0,'x+',.22),('sed_offering_registers','HebSed_Left_Centre_Offerings',20,6.8,-46.42,4.8,-22,'x+',.22),('sed_deity_rows','HebSed_Left_West_Deities',20,6.8,-46.42,4.8,-44,'x+',.22),('sed_multi_register_02','HebSed_Right_East_Registers',20,6.8,46.42,4.8,0,'x-',.22),('sed_long_register','HebSed_Right_Centre_LongRegister',20,6.8,46.42,4.8,-22,'x-',.22),('sed_large_composite','HebSed_Right_West_Composite',20,6.8,46.42,4.8,-44,'x-',.22),('sed_kiosk_procession_02','HebSed_West_Left_Kiosk',37,6.6,-27,5,-54.34,'z+',.22),('sed_ritual_group_03','HebSed_West_Right_RitualGroup',37,6.6,27,5,-54.34,'z+',.22),('sed_kiosk_fragment','HebSed_Short_Register_A',14,4.5,-38,4.2,11.25,'z-',.18),('sed_processional_group','HebSed_Short_Register_B',14,4.5,38,4.2,11.25,'z-',.18),
('main_hall_ritual','MainHall_Left_Ritual',25,6.1,-32.42,4.8,-82,'x+',.17),('sed_seated_and_standing','MainHall_Right_Ritual',25,6.1,32.42,4.8,-82,'x-',.17),('inner_hall_deities','InnerHall_Left_Deities',25,6.1,-32.42,4.8,-132,'x+',.17),('sed_deity_inventory','InnerHall_Right_Inventory',25,6.1,32.42,4.8,-132,'x-',.17),('hathor_court_register','HathorCourt_Left_Register',20,5.9,-32.42,4.8,-174,'x+',.17),('sed_divine_figures','HathorCourt_Right_Register',20,5.9,32.42,4.8,-174,'x-',.17),
('sanctuary_king_before_bastet','Sanctuary_Approach_King_Bastet_Left',27,6.2,-22,5.3,-193.34,'z+',.21),('sanctuary_deity_inventory','Sanctuary_Approach_Deities_Right',27,6.2,22,5.3,-193.34,'z+',.21),('sanctuary_shrine_inventory','Sanctuary_Left_Shrine_List',18,5.2,-20.45,5.1,-211,'x+',.18),('sanctuary_seven_arrows','Sanctuary_Right_Seven_Arrows',18,5.2,20.45,5.1,-211,'x-',.18),('reconstructed_kheker_band','Sanctuary_Text_Band_Approximation',56,1.6,0,8.8,-193.28,'z+',.08),('sanctuary_star_field','Sanctuary_Star_Field_BackWall',11,3.4,0,10.4,-201.05,'z+',.07)]

image_cache={}
material_cache={}
def img(path):
    p=ROOT/path.replace('./','')
    if str(p) not in image_cache:image_cache[str(p)]=Image.open(p).convert('RGBA')
    return image_cache[str(p)]
def relief_material(a):
    key=a['id']
    if key in material_cache:return material_cache[key]
    color=Image.open(ROOT/a['color'].replace('./','')).convert('RGBA')
    alpha=Image.open(ROOT/a['alpha'].replace('./','')).convert('L')
    color.putalpha(alpha)
    normal=Image.open(ROOT/a['normal'].replace('./','')).convert('RGB')
    m=PBRMaterial(name=f"Relief_{key}",baseColorTexture=color,normalTexture=normal,metallicFactor=0,roughnessFactor=.8,doubleSided=True,alphaMode='BLEND')
    material_cache[key]=m;return m

def relief_mesh(a,w,h,depth):
    height=np.array(Image.open(ROOT/a['height'].replace('./','')).convert('L').resize((45,25),Image.Resampling.BILINEAR),dtype=np.float32)/255
    height=np.flipud(height)
    ny,nx=height.shape
    xs=np.linspace(-w/2,w/2,nx);ys=np.linspace(-h/2,h/2,ny)
    vertices=[];uv=[]
    for j,y in enumerate(ys):
        for i,x in enumerate(xs):
            dz=max(0,height[j,i]-.5)*depth*2
            vertices.append([x,y,dz]);uv.append([i/(nx-1),j/(ny-1)])
    faces=[]
    for j in range(ny-1):
        for i in range(nx-1):
            a0=j*nx+i;b=a0+1;c=(j+1)*nx+i;d=c+1
            faces.extend([[a0,b,d],[a0,d,c]])
    mesh=trimesh.Trimesh(vertices=np.array(vertices),faces=np.array(faces),process=False)
    mesh.visual=TextureVisuals(uv=np.array(uv),material=relief_material(a))
    return mesh

def panel_transform(x,y,z,normal):
    T=transform_translate(x,y,z)
    if normal=='z-':R=trimesh.transformations.rotation_matrix(math.pi,[0,1,0])
    elif normal=='x+':R=trimesh.transformations.rotation_matrix(math.pi/2,[0,1,0])
    elif normal=='x-':R=trimesh.transformations.rotation_matrix(-math.pi/2,[0,1,0])
    else:R=np.eye(4)
    return T@R

for aid,name,w,h,x,y,z,norm,dep in placements:
    a=asset[aid];mesh=relief_mesh(a,w,h,dep);mesh.apply_transform(panel_transform(x,y,z,norm));mesh.metadata.update({'source':a['source'],'certainty':a['certainty'],'zone':a['zone']});add(mesh,name)

for geom_name, geom in scene.geometry.items():
    geom.metadata.setdefault('v13_version','V13')
    geom.metadata.setdefault('interaction','clickable_in_threejs_viewer')

scene.metadata['title']='Temple of Bastet at Bubastis V13 — museum detail and interactive walkthrough edition'
scene.metadata['accuracy_note']='EA1065, EA1105, EA1106 and EA1107 inform the documented object families. Complete architecture, roof systems, furnishing and exact placements remain interpretive reconstruction.'
blob=trimesh.exchange.gltf.export_glb(scene,include_normals=True)
OUT.write_bytes(blob)
print('wrote',OUT,'bytes',OUT.stat().st_size,'geometries',len(scene.geometry),'bounds',scene.bounds.tolist())
# verify reload
loaded=trimesh.load(OUT,force='scene')
print('verified',len(loaded.geometry),'bounds',loaded.bounds.tolist())
