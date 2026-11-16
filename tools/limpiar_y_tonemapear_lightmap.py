import sys, numpy as np, OpenEXR, Imath, oidn
from PIL import Image
def read_exr(p):
    f=OpenEXR.InputFile(p); dw=f.header()['dataWindow']; W=dw.max.x-dw.min.x+1; H=dw.max.y-dw.min.y+1
    ch=[k for k in ('R','G','B')]; pt=Imath.PixelType(Imath.PixelType.FLOAT)
    arr=np.stack([np.frombuffer(f.channel(c,pt),dtype=np.float32).reshape(H,W) for c in ch],-1)
    a=np.frombuffer(f.channel('A',pt),dtype=np.float32).reshape(H,W) if 'A' in f.header()['channels'] else np.ones((H,W),np.float32)
    return np.ascontiguousarray(arr),a,W,H
def denoise(col,W,H):
    d=oidn.NewDevice(); oidn.CommitDevice(d)
    out=np.zeros_like(col); f=oidn.NewFilter(d,'RT')
    oidn.SetSharedFilterImage(f,'color',col,oidn.FORMAT_FLOAT3,W,H); oidn.SetSharedFilterImage(f,'output',out,oidn.FORMAT_FLOAT3,W,H)
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
col,a,W,H=read_exr(inp)
# (sin invertir: el EXR de Blender ya está en orden de arriba hacia abajo)
lin=tonemap_lin(col,expo)
dn=denoise(lin,W,H)
img=(srgb(np.clip(dn,0,1))*255+0.5).astype(np.uint8)
Image.fromarray(img).save(outp,quality=92)
print("ok",W,H,float(dn.mean()))
