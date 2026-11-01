// Toma aérea para "Desde el aire" (Mi equipo): video de Pexels → MP4 1280 px sin audio + póster.
import ffmpeg from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
const [id, name] = process.argv.slice(2);
const res = await fetch(`https://www.pexels.com/download/video/${id}/`, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' } });
const url = res.headers.get('location');
if (!url) throw new Error('sin URL ' + res.status);
const out = `projects/foto-astor/public/media/videos/${name}`;
execFileSync(ffmpeg, ['-y', '-v', 'error', '-t', '14', '-i', url, '-an', '-vf', "scale=1280:-2,fps=25", '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${out}.mp4`]);
execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', '2', '-i', `${out}.mp4`, '-frames:v', '1', '-q:v', '4', `${out}.jpg`]);
console.log('ok', url);
