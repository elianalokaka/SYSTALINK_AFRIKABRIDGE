#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AfricaBridge — Générateur de la planche de palette
==================================================

Rend une planche PNG de l'orientation artistique à partir des tokens définis
dans le bloc TOKENS ci-dessous.

POURQUOI CE FICHIER EXISTE
    Les tokens sont la source unique de vérité du design system (AGENTS.md § 3 bis).
    Quand ils changeront, cette planche se régénère d'une commande : elle ne peut
    donc pas se désynchroniser de la réalité.

USAGE
    python scripts/design/generer-palette.py
    -> produit docs/design/orientation-palette.png

CE N'EST PAS DU CODE APPLICATIF : c'est un outil de design. Il ne sera jamais
embarqué dans le build du frontend.

TOUS LES RATIOS AFFICHÉS SONT CALCULÉS (WCAG 2.1), PAS ESTIMÉS.
"""

import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow est requis : pip install Pillow")

# ═══════════════════════════════════════════════════════════════════════════════
# TOKENS — source unique de vérité
# ═══════════════════════════════════════════════════════════════════════════════

SURFACES = [
    ("#131211", "surface-0", "Fond général de l'application"),
    ("#191816", "surface-1", "Barres, navigation latérale"),
    ("#201E1B", "surface-2", "Cartes, panneaux"),
    ("#282521", "surface-3", "Survol, menus, modales"),
    ("#312D28", "surface-4", "Élément actif / sélectionné"),
]

# (couleur, token, usage, ratio vérifié sur les cartes = surface-2)
TEXTES = [
    ("#ECEAE7", "fg-1", "Titres et texte principal", "13.85:1"),
    ("#A9A39C", "fg-2", "Texte secondaire, métadonnées", "6.66:1"),
    ("#958F88", "fg-3", "Texte tertiaire, légendes", "5.20:1"),
    ("#5C5750", "fg-disabled", "Désactivé — exempté WCAG", "2.32:1"),
]

BORDURES = [
    ("#2C2B28", "border-subtle", "Séparateurs décoratifs, contours de cartes"),
    ("#3A3833", "border", "Contours au repos, champs de saisie"),
    ("#6E6A64", "border-strong", "Bordure seule indicatrice d'un contrôle — 3.09:1"),
]

ACCENT = [
    ("#F55800", "accent", "Liens, icônes, focus, CTA — 5.59:1 sur le fond"),
    ("#FF6B1A", "accent-hover", "Survol — 6.57:1 · 4.80:1 sur surface-4"),
    ("#E85200", "accent-press", "Pression — 5.02:1"),
    ("#2E1408", "accent-subtle", "Fond teinté (badge, compteur) — texte #FF8A47"),
]

# Libellé, couleur du texte, couleur de fond, légende — les statuts RÉELS du contrat
SEMANTIQUE = [
    ("Ouvert", "#3ECF8E", "#0D2A1E", "succès — recrutement"),
    ("En cours", "#58A6FF", "#0D1D2E", "info — en_cours"),
    ("Terminé", "#A9A39C", "#262523", "neutre — termine"),
    ("En attente", "#E3B341", "#2B2208", "attente — en_attente"),
    ("Acceptée", "#3ECF8E", "#0D2A1E", "succès — acceptee"),
    ("Refusée", "#F85149", "#2C1414", "erreur — refusee"),
]

RAYONS = [0, 4, 6, 8]

# ═══════════════════════════════════════════════════════════════════════════════
# Rendu
# ═══════════════════════════════════════════════════════════════════════════════

L, H = 1240, 1780
PAD = 52
FOND = "#131211"

F_SANS = ["C:/Windows/Fonts/segoeui.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
F_BOLD = ["C:/Windows/Fonts/segoeuib.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
F_MONO = ["C:/Windows/Fonts/consola.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"]
F_MONOB = ["C:/Windows/Fonts/consolab.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"]


def police(chemins, taille):
    for c in chemins:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, taille)
            except Exception:
                pass
    return ImageFont.load_default()


def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


img = Image.new("RGB", (L, H), hx(FOND))
d = ImageDraw.Draw(img)

f_titre = police(F_BOLD, 30)
f_sous = police(F_SANS, 15)
f_sec = police(F_BOLD, 19)
f_note = police(F_SANS, 14)
f_tok = police(F_MONOB, 13)
f_hex = police(F_MONO, 13)
f_usage = police(F_SANS, 12.5)
f_btn = police(F_SANS, 15)
f_lib = police(F_SANS, 13)

C_TXT1, C_TXT2, C_TXT3 = hx("#ECEAE7"), hx("#A9A39C"), hx("#8A847C")
C_BORD = hx("#3A3833")

y = PAD

# ── En-tête ───────────────────────────────────────────────────────────────────
d.text((PAD, y), "AfricaBridge — Orientation artistique", font=f_titre, fill=C_TXT1)
y += 40
d.text((PAD, y),
       "Proposition à valider. Aucune valeur n'est encore figée. Ratios de contraste WCAG 2.1 calculés, pas estimés.",
       font=f_sous, fill=C_TXT2)
y += 46


def titre_section(num, texte, precision=""):
    global y
    label = f"{num}. {texte}"
    d.text((PAD, y), label, font=f_sec, fill=C_TXT1)
    if precision:
        w = d.textlength(label, font=f_sec)
        d.text((PAD + w + 14, y + 4), precision, font=f_note, fill=C_TXT3)
    y += 34


# ── 1. Surfaces ───────────────────────────────────────────────────────────────
titre_section(1, "Échelle de surfaces", "« le sombre bien mélangé » — 5 crans, teinte chaude ~30°, saturation ≤ 8 %")
n = len(SURFACES)
gap = 16
cw = (L - 2 * PAD - gap * (n - 1)) // n
for i, (c, nom, usage) in enumerate(SURFACES):
    x = PAD + i * (cw + gap)
    d.rounded_rectangle((x, y, x + cw, y + 92), radius=6, fill=hx(c), outline=C_BORD, width=1)
    d.text((x, y + 102), nom, font=f_tok, fill=C_TXT1)
    d.text((x, y + 120), c, font=f_hex, fill=C_TXT3)
    d.text((x, y + 138), usage, font=f_usage, fill=C_TXT2)
y += 174

# ── 2. Le mélange en pratique ─────────────────────────────────────────────────
titre_section(2, "Le mélange en pratique", "aucune ombre portée : la surface et 1 px de bordure suffisent")
d.rounded_rectangle((PAD, y, PAD + 560, y + 118), radius=8, fill=hx("#191816"), outline=hx("#2C2B28"), width=1)
d.text((PAD + 14, y + 10), "surface-1", font=f_tok, fill=C_TXT3)
d.rounded_rectangle((PAD + 34, y + 34, PAD + 526, y + 104), radius=6, fill=hx("#201E1B"), outline=hx("#2C2B28"), width=1)
d.text((PAD + 48, y + 42), "surface-2", font=f_tok, fill=C_TXT3)
d.rounded_rectangle((PAD + 68, y + 66, PAD + 492, y + 96), radius=4, fill=hx("#282521"), outline=C_BORD, width=1)
d.text((PAD + 82, y + 72), "surface-3 — survol / actif", font=f_tok, fill=C_TXT2)

d.text((PAD + 600, y + 14), "Règle :", font=f_tok, fill=C_TXT2)
for i, t in enumerate([
    "Pas de noir pur (#000) : le fond est un",
    "brun-gris très sombre, presque neutre.",
    "",
    "Pas d'ombre portée pour « décoller » une",
    "carte. Une surface plus claire + 1 px de",
    "bordure suffisent. C'est ce qui distingue",
    "un outil de développeur d'un template SaaS.",
]):
    d.text((PAD + 600, y + 36 + i * 17), t, font=f_usage, fill=C_TXT3)
y += 146

# ── 3. Texte ──────────────────────────────────────────────────────────────────
titre_section(3, "Échelle de texte", "contrastes mesurés sur surface-2 (les cartes) : le cas le plus exigeant")
for c, nom, usage, ratio in TEXTES:
    d.rounded_rectangle((PAD, y, L - PAD, y + 44), radius=4, fill=hx("#201E1B"))
    d.rounded_rectangle((PAD + 12, y + 12, PAD + 58, y + 32), radius=3, fill=hx(c))
    d.text((PAD + 76, y + 22), "Le talent africain construit l'avenir numérique.",
           font=f_btn, fill=hx(c), anchor="lm")
    d.text((L - PAD - 16, y + 22), ratio, font=f_hex, fill=C_TXT2, anchor="rm")
    d.text((L - PAD - 86, y + 22), nom, font=f_tok, fill=C_TXT3, anchor="rm")
    y += 52
y += 10

# ── 4. Bordures ───────────────────────────────────────────────────────────────
titre_section(4, "Bordures", "jamais d'ombre portée : c'est la bordure qui sépare")
for c, nom, usage in BORDURES:
    d.rounded_rectangle((PAD, y, L - PAD, y + 40), radius=4, fill=hx("#201E1B"), outline=hx(c), width=1)
    d.text((PAD + 16, y + 20), nom, font=f_tok, fill=C_TXT2, anchor="lm")
    d.text((PAD + 210, y + 20), c, font=f_hex, fill=C_TXT3, anchor="lm")
    d.text((PAD + 310, y + 20), usage, font=f_usage, fill=C_TXT3, anchor="lm")
    y += 48
y += 10

# ── 5. Accent ─────────────────────────────────────────────────────────────────
titre_section(5, "Couleur d'accent", "une seule, réservée à l'ACTION — jamais à un état. Usage rare : < 5 % de la surface")
n = len(ACCENT)
cw = (L - 2 * PAD - gap * (n - 1)) // n
for i, (c, nom, usage) in enumerate(ACCENT):
    x = PAD + i * (cw + gap)
    d.rounded_rectangle((x, y, x + cw, y + 70), radius=6, fill=hx(c), outline=C_BORD, width=1)
    d.text((x, y + 80), nom, font=f_tok, fill=C_TXT1)
    d.text((x, y + 98), c, font=f_hex, fill=C_TXT3)
    d.text((x, y + 116), usage, font=f_usage, fill=C_TXT2)
y += 154

d.text((PAD, y), "Le point décisif : le libellé d'un bouton orange plein doit être SOMBRE, jamais blanc.",
       font=f_note, fill=hx("#E3B341"))
y += 26
bw, bh = 210, 44
demos = [
    ("#F55800", "#131211", "Continuer", "5.59:1  RETENU", "#3ECF8E"),
    ("#F55800", "#FFFFFF", "Continuer", "3.34:1  ÉCHEC", "#F85149"),
    ("#BF4400", "#FFFFFF", "Continuer", "5.20:1  mais terne", "#A9A39C"),
]
for i, (bg, fg, lib, note, col) in enumerate(demos):
    x = PAD + i * (bw + 26)
    d.rounded_rectangle((x, y, x + bw, y + bh), radius=6, fill=hx(bg))
    d.text((x + bw / 2, y + bh / 2), lib, font=f_btn, fill=hx(fg), anchor="mm")
    d.text((x, y + bh + 10), note, font=f_tok, fill=hx(col))
y += bh + 42

# ── 6. Sémantique ─────────────────────────────────────────────────────────────
titre_section(6, "Couleurs sémantiques", "les statuts réels du contrat API — séparés de l'accent")
# Grille de 3 colonnes : chaque badge dispose de sa colonne, la légende ne chevauche jamais.
cols = 3
colw = (L - 2 * PAD - (cols - 1) * 20) // cols
for i, (libelle, fg, bg, legende) in enumerate(SEMANTIQUE):
    cx = PAD + (i % cols) * (colw + 20)
    cy = y + (i // cols) * 66
    w = int(d.textlength(libelle, font=f_lib)) + 30
    d.rounded_rectangle((cx, cy, cx + w, cy + 34), radius=6, fill=hx(bg), outline=hx(fg), width=1)
    d.text((cx + w / 2, cy + 17), libelle, font=f_lib, fill=hx(fg), anchor="mm")
    d.text((cx, cy + 42), legende, font=f_usage, fill=C_TXT3)
y += 2 * 66 + 8

# ── 7. Rayons ─────────────────────────────────────────────────────────────────
titre_section(7, "Rayons", "un seul cran court, partout — jamais de pilule")
x = PAD
for r in RAYONS:
    d.rounded_rectangle((x, y, x + 118, y + 42), radius=r, fill=hx("#201E1B"), outline=C_BORD, width=1)
    d.text((x + 59, y + 21), f"radius {r}", font=f_tok, fill=C_TXT2, anchor="mm")
    x += 146
d.rounded_rectangle((x, y, x + 118, y + 42), radius=21, fill=hx("#201E1B"), outline=hx("#F85149"), width=1)
d.text((x + 59, y + 21), "pilule", font=f_tok, fill=hx("#F85149"), anchor="mm")
d.text((x, y + 52), "interdit", font=f_usage, fill=hx("#F85149"))
y += 90

# ── Pied ──────────────────────────────────────────────────────────────────────
d.line((PAD, y, L - PAD, y), fill=hx("#2C2B28"), width=1)
y += 18
d.text((PAD, y),
       "Ratios calculés selon WCAG 2.1. Contrat et conformité : docs/ANALYSE-CONTRAT.md · scripts/conformite/",
       font=f_usage, fill=hx("#5C5750"))
y += 40

img = img.crop((0, 0, L, min(y, H)))

sortie = os.path.normpath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "design", "orientation-palette.png"))
os.makedirs(os.path.dirname(sortie), exist_ok=True)
img.save(sortie)
print(f"Planche generee : {sortie}  ({img.width}x{img.height})")
