"""musica.py — OPCIONAL. Pista instrumental propia con ACE-Step 1.5, en tu computadora y gratis (licencia Apache 2.0: uso comercial permitido).
Necesita el repositorio de ACE-Step 1.5 bajado (git clone https://github.com/ace-step/ACE-Step-1.5) y una compu con
fuerza: Mac con chip Apple (MLX) o una PC con tarjeta de video. La primera vez baja varios GB de modelos.

Uso (corre unos 70 s por pista en una Mac con chip Apple; lánzalo en segundo plano):
  cd <carpeta de ACE-Step 1.5>
  uv run python <skill>/scripts/musica.py <carpeta-salida> <duración-s> [G H ...]
  (o define ACESTEP_DIR con esa carpeta y córrelo desde donde quieras)
Sale <carpeta-salida>/pista-<letra>.wav. Las letras salen de ESTILOS (abajo); sin letras genera G y H.
"""
import os, sys, time, glob, shutil

ROOT = os.path.abspath(os.path.expanduser(os.environ.get('ACESTEP_DIR') or os.getcwd()))
if not os.path.isdir(os.path.join(ROOT, 'acestep')):
    sys.exit('No encuentro ACE-Step 1.5: corre esto desde su carpeta o define ACESTEP_DIR. La música es opcional: puedes mezclar sin ella.')
os.chdir(ROOT); sys.path.insert(0, ROOT)
from acestep.handler import AceStepHandler
from acestep.llm_inference import LLMHandler
from acestep.inference import GenerationParams, GenerationConfig, generate_music
from acestep.model_downloader import ensure_main_model, ensure_dit_model, ensure_lm_model, get_checkpoints_dir, check_main_model_exists, check_model_exists

ESTILOS = {   # letra: (caption, semilla, bpm)
    # G y H: las del reel «Sesgo de supervivencia». G quedó en la versión final aprobada.
    'G': ("contemplative documentary score, instrumental, solo felt piano melody, soft sustained strings, distant low cello drones, subtle vinyl crackle and tape warmth, slow ticking clock pulse, melancholic and philosophical, history documentary, quiet build with gentle swell in the middle, intimate wide reverb, no drums", 7707, 72),
    'I': ("modern minimal electronic explainer underscore, instrumental, soft marimba and synth plucks, light lo-fi hip-hop drums, warm sub bass, glassy pads, curious confident and optimistic, tech video essay, steady groove with gentle lift in the last third, clean modern mix", 9909, 96),
    'H': ("neo-classical ambient underscore, instrumental, warm muted piano arpeggios, airy string pads, granular paper textures, faint music box, reflective and curious, thoughtful video essay, gentle evolving build, sparse percussion pulse, spacious premium mix", 8808, 80),
}
if len(sys.argv) < 3:
    sys.exit(__doc__)
OUT, DUR, which = os.path.abspath(os.path.expanduser(sys.argv[1])), float(sys.argv[2]), sys.argv[3:] or ['G', 'H']
DIT, LM = 'acestep-v15-turbo', 'acestep-5Hz-lm-1.7B'
ckpt = get_checkpoints_dir()
if not check_main_model_exists(ckpt): ensure_main_model(ckpt)
if not check_model_exists(DIT, ckpt): ensure_dit_model(DIT, ckpt)
if not check_model_exists(LM, ckpt): ensure_lm_model(LM, checkpoints_dir=ckpt)
dit = AceStepHandler(); dit.initialize_service(project_root=ROOT, config_path=DIT, device='auto')
llm = LLMHandler(); llm.initialize(checkpoint_dir=str(ckpt), lm_model_path=LM, backend='mlx' if sys.platform == 'darwin' else 'pt', device='auto')   # MLX en Mac, PyTorch en Windows
for k in which:
    caption, seed, bpm = ESTILOS[k]
    tmp = os.path.join(OUT, '_raw', k); os.makedirs(tmp, exist_ok=True)
    t = time.time()
    res = generate_music(dit, llm, GenerationParams(caption=caption, lyrics='[Instrumental]', instrumental=True, bpm=bpm, duration=DUR,
                         vocal_language='unknown', inference_steps=8, shift=3.0, seed=seed, thinking=True),
                         GenerationConfig(batch_size=1, use_random_seed=False, seeds=[seed], audio_format='wav'), save_dir=tmp)
    if not res.success:
        print(f'[{k}] ERROR {res.error}'); continue
    shutil.copy(res.audios[0]['path'], os.path.join(OUT, f'pista-{k}.wav'))
    print(f'[{k}] {OUT}/pista-{k}.wav ({time.time() - t:.0f} s)')
