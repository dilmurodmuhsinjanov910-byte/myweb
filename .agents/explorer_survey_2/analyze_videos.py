import os, glob, subprocess, json

videos = sorted(glob.glob('d:/my web/assets/videos_webm/*.webm'))
print(f"Total videos to analyze: {len(videos)}")

results = []

for v in videos:
    base = os.path.splitext(os.path.basename(v))[0]
    
    # Probe duration and format
    cmd = [
        'ffprobe', '-v', 'error',
        '-show_entries', 'format=duration,size',
        '-show_entries', 'stream=codec_name,width,height,pix_fmt,nb_frames',
        '-show_entries', 'stream_tags=ALPHA_MODE',
        '-of', 'json', v
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    probe = json.loads(res.stdout) if res.stdout else {}
    
    stream = [s for s in probe.get('streams', []) if s.get('codec_name') == 'vp9'][0]
    duration = float(probe.get('format', {}).get('duration', 0))
    alpha_mode = stream.get('tags', {}).get('ALPHA_MODE', '0')
    
    # Check if exploded or rotation from filename
    is_rotation_name = any(k in base.lower() for k in ['360', 'rotation', 'showcase'])
    is_exploded_name = any(k in base.lower() for k in ['exploded', 'disassembly', 'explod'])
    
    results.append({
        'base': base,
        'duration': round(duration, 2),
        'alpha_mode': alpha_mode,
        'is_rotation_name': is_rotation_name,
        'is_exploded_name': is_exploded_name
    })

print(f"Name classification:")
print(f"Rotation in name: {sum(1 for r in results if r['is_rotation_name'])}")
print(f"Exploded in name: {sum(1 for r in results if r['is_exploded_name'])}")
print(f"Neither: {sum(1 for r in results if not r['is_rotation_name'] and not r['is_exploded_name'])}")

with open('d:/my web/.agents/explorer_survey_2/video_analysis_raw.json', 'w') as f:
    json.dump(results, f, indent=2)
