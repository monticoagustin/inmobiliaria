import sys, numpy as np, OpenEXR, Imath, oidn
from PIL import Image
def read_exr(p):
    f=OpenEXR.InputFile(p); dw=f.header()['dataWindow']; W=dw.max.x-dw.min.x+1; H=dw.max.y-dw.min.y+1
    ch=[k for k in ('R','G','B')]; pt=Imath.PixelType(Imath.PixelType.FLOAT)
    arr=np.stack([np.frombuffer(f.channel(c,pt),dtype=np.float32).reshape(H,W) for c in ch],-1)
    a=np.frombuffer(f.channel('A',pt),dtype=np.float32).reshape(H,W) if 'A' in f.header()['channels'] else np.ones((H,W),np.float32)
    return np.ascontiguousarray(arr),a,W,H
def denoise(col,W,H,alb=None):
    d=oidn.NewDevice(); oidn.CommitDevice(d)
    out=np.zeros_like(col); f=oidn.NewFilter(d,'RT')
    oidn.SetSharedFilterImage(f,'color',col,oidn.FORMAT_FLOAT3,W,H); oidn.SetSharedFilterImage(f,'output',out,oidn.FORMAT_FLOAT3,W,H)
    if alb is not None: oidn.SetSharedFilterImage(f,'albedo',alb,oidn.FORMAT_FLOAT3,W,H)
    oidn.CommitFilter(f); oidn.ExecuteFilter(f)
    return out
# Tonemapping tipo AgX aproximado no: usamos exposición + curva filmic simple y sRGB
def tonemap_lin(x,expo):
    x=x*(2.0**expo)
    # curva suave (Reinhard extendido) para no quemar blancos
    L=0.2126*x[...,0]+0.7152*x[...,1]+0.0722*x[...,2]; Lw=4.0
    Ld=L*(1+L/(Lw*Lw))/(1+L); s=np.where(L>1e-6,Ld/np.maximum(L,1e-6),0)[...,None]
    return np.ascontiguousarray(np.clip(x*s,0,1).astype(np.float32))
def srgb(y): return np.where(y<=0.0031308,12.92*y,1.055*np.power(np.clip(y,0,1),1/2.4)-0.055)
inp,outp,expo=sys.argv[1],sys.argv[2],float(sys.argv[3])
alb_p=sys.argv[4] if len(sys.argv)>4 else None
col,a,W,H=read_exr(inp)
# (sin invertir: el EXR de Blender ya está en orden de arriba hacia abajo)
if alb_p:
    # separar luz y color: se limpia solo la luz (suave) y después se vuelve a multiplicar por el color
    alb=read_exr(alb_p)[0]; albc=np.maximum(alb,0.02)
    luz=tonemap_lin(col/albc*0.5,expo)  # 0.5: margen para no saturar antes de remultiplicar
    # pre-suavizado de la luz dentro de cada isla (la luz indirecta es suave; el ruido no)
    from scipy.ndimage import gaussian_filter
    m=(alb[...,0]+alb[...,1]+alb[...,2]>0.05).astype(np.float32)
    sg=float(__import__('os').environ.get('SIGMA_LUZ','2.5'))
    if sg>0:
        den=gaussian_filter(m,sg)+1e-6
        luz=np.ascontiguousarray(np.stack([gaussian_filter(luz[...,i]*m,sg)/den for i in range(3)],-1).astype(np.float32))
    blanco=np.ascontiguousarray(np.full_like(luz,1.0))
    dl=denoise(luz,W,H,blanco)
    dn=np.clip(dl*2.0*albc,0,1)
    dn=np.where(alb>0.019,dn,0)
else:
    lin=tonemap_lin(col,expo)
    dn=denoise(lin,W,H)
img=(srgb(np.clip(dn,0,1))*255+0.5).astype(np.uint8)
Image.fromarray(img).save(outp,quality=92)
print("ok",W,H,float(dn.mean()))
