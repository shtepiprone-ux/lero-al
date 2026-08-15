const t=["pending","active","inactive","sold","rented","archived","expired"],i=new Set(t);function S(e,n){return i.has(e)?n(`status_${e}`):e}export{t as L,S as g};
