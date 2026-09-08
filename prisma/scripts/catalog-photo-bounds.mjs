// Inspect original pixels to measure framing; this script never edits images.
// From the project root: node prisma/scripts/catalog-photo-bounds.mjs --write
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const requireRepo=createRequire(new URL('../../package.json', import.meta.url));
const sharp=createRequire(requireRepo.resolve('next/package.json'))('sharp');
const files=[];
files.push({src:'/catalog/product-photos/meta-photo/dji-osmo-mobile-7p.png',file:'public/catalog/product-photos/meta-photo/dji-osmo-mobile-7p.png'});
for(const group of ['apple-keyboards','gaming-lifestyle','audio']) {
  for(const file of await readdir(`public/catalog/product-photos/${group}`)) {
    if(/\.(png|jpe?g|webp|avif)$/.test(file)) files.push({src:`/catalog/product-photos/${group}/${file}`,file:`public/catalog/product-photos/${group}/${file}`});
  }
}
const manifest=JSON.parse(await readFile('prisma/seed-photos/manifest.json','utf8'));
for(const job of manifest.jobs.filter(j=>j.slug.startsWith('samsung-'))) {
  for(const file of new Set(Object.values(job.colors).flat())) files.push({src:`/uploads/products/${file}`,file:`prisma/seed-photos/${file}`});
}
const result={};
for(const {src,file} of files){
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height,channels}=info;
  let x=width,y=height,right=0,bottom=0;
  for(let row=0;row<height;row++)for(let col=0;col<width;col++){
    const i=(row*width+col)*channels;
    if(data[i+3]>20 && Math.min(data[i],data[i+1],data[i+2])<240){
      x=Math.min(x,col);y=Math.min(y,row);right=Math.max(right,col);bottom=Math.max(bottom,row);
    }
  }
  if(x>=width)continue;
  const margin=Math.ceil(Math.max(width,height)*0.015);
  x=Math.max(0,x-margin);y=Math.max(0,y-margin);right=Math.min(width-1,right+margin);bottom=Math.min(height-1,bottom+margin);
  result[src]={width,height,x,y,w:right-x+1,h:bottom-y+1};
}
const json = JSON.stringify(result, null, 2) + "\n";
if (process.argv.includes("--write")) await writeFile("src/lib/catalogPhotoBounds.json", json);
else console.log(json);
