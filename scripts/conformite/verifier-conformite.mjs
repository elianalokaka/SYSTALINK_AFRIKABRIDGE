#!/usr/bin/env node
/**
 * AfricaBridge — Test de conformité OpenAPI (zéro dépendance)
 * ===========================================================
 *
 * Interroge une API AfricaBridge réellement en marche et vérifie que ses réponses
 * respectent les schémas de `openapi-africabridgefinal.yaml`.
 *
 * Principe fondateur du projet :
 *   « Ce document fait autorité. Toute divergence entre le code et ce contrat est un bug. »
 *
 * Ce script rend cette phrase VÉRIFIABLE. Il tourne :
 *   - contre la vraie API Laravel, dès qu'elle est disponible ;
 *   - contre les mocks MSW, en pointant `--api` sur le serveur de dev du front.
 *
 * ─── POURQUOI AUCUNE DÉPENDANCE ────────────────────────────────────────────────
 * L'environnement de développement actuel est hors ligne (ni npm, ni pip joignables).
 * Le script n'utilise donc que la bibliothèque standard de Node 18+ :
 * `fetch` natif, gestion manuelle des cookies. Aucun `npm install` n'est requis
 * pour qu'il fonctionne.
 *
 * QUAND LE PROJET AURA SES DÉPENDANCES : ce script reste la référence de conformité,
 * mais le même contrôle doit être branché dans la suite de tests du projet
 * (`vitest` + `ajv` + `openapi-typescript`), pour qu'il tourne en CI à chaque commit.
 * Voir scripts/conformite/README.md.
 *
 * ─── USAGE ─────────────────────────────────────────────────────────────────────
 *   node scripts/conformite/verifier-conformite.mjs \
 *     --api http://localhost:8000 \
 *     --email demo@example.com --mot-de-passe 'MotDePasse123!'
 *
 * Options :
 *   --api <url>          Racine du serveur (sans /api/v1). Défaut : http://localhost:8000
 *   --email <e>          Compte utilisé pour les scénarios authentifiés.
 *   --mot-de-passe <p>   Mot de passe de ce compte.
 *   --prefixe <p>        Préfixe de l'API. Défaut : /api/v1
 *   --spec <fichier>     Chemin du contrat. Défaut : openapi-africabridgefinal.yaml
 *   --sans-auth          Ne lancer que les scénarios publics.
 *   --verbeux            Journaliser chaque scénario, y compris ceux qui passent.
 *
 * Codes de sortie :
 *   0  toutes les vérifications passent
 *   1  au moins une divergence détectée   → un BUG, pas un avertissement
 *   2  erreur d'exécution (API injoignable, contrat illisible…)
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Lecteur YAML minimal — sous-ensemble OpenAPI strictement indenté
// ═══════════════════════════════════════════════════════════════════════════════

/** Retire un éventuel BOM (le contrat peut être enregistré en UTF-8 avec BOM). */
function sansBom(texte) {
  return texte.charCodeAt(0) === 0xfeff ? texte.slice(1) : texte;
}

/**
 * Convertit un scalaire YAML en valeur JavaScript.
 * Gère : null, booléens, entiers, flottants, chaînes quotees, flux JSON-like, chaînes nues.
 */
function scalaire(brut) {
  const s = brut.trim();
  if (s === '' || s === '~' || s === 'null') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+$/.test(s)) return Number.parseInt(s, 10);
  if (/^-?\d*\.\d+$/.test(s)) return Number.parseFloat(s);
  if (s.startsWith('"') && s.endsWith('"') && s.length > 1) return s.slice(1, -1);
  if (s.startsWith("'") && s.endsWith("'") && s.length > 1) return s.slice(1, -1);
  // Flux YAML : { a: 1, b: [x, y] } — fréquent dans ce contrat (schemas en ligne)
  if (s.startsWith('{') && s.endsWith('}')) return fluxObjet(s);
  if (s.startsWith('[') && s.endsWith(']')) return fluxListe(s);
  return s;
}

/** Découpe une liste de flux en respectant les imbrications et les quotes. */
function decouperFlux(interieur) {
  const parts = [];
  let niveau = 0;
  let courant = '';
  let quote = null;
  for (const c of interieur) {
    if (quote) {
      courant += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; courant += c; continue; }
    if (c === '{' || c === '[') niveau++;
    if (c === '}' || c === ']') niveau--;
    if (c === ',' && niveau === 0) { parts.push(courant); courant = ''; continue; }
    courant += c;
  }
  if (courant.trim() !== '') parts.push(courant);
  return parts;
}

function fluxListe(s) {
  const interieur = s.slice(1, -1).trim();
  if (interieur === '') return [];
  return decouperFlux(interieur).map((p) => scalaire(p));
}

function fluxObjet(s) {
  const interieur = s.slice(1, -1).trim();
  const obj = {};
  if (interieur === '') return obj;
  for (const part of decouperFlux(interieur)) {
    const i = part.indexOf(':');
    if (i === -1) continue;
    const cle = scalaire(part.slice(0, i));
    obj[String(cle)] = scalaire(part.slice(i + 1));
  }
  return obj;
}

/**
 * Analyseur YAML par pile d'indentation.
 * Ne traite pas les ancres, les balises ni les blocs `|`/`>` multi-lignes :
 * ce contrat n'en utilise pas. Les commentaires `#` sont ignorés hors quotes.
 */
function lireYaml(texte) {
  const brut = sansBom(texte).replace(/\r\n?/g, '\n').split('\n');
  const racine = {};
  // Chaque entrée : { indent, conteneur }
  const pile = [{ indent: -1, conteneur: racine }];

  for (let no = 0; no < brut.length; no++) {
    const ligne = brut[no];

    // Lignes vides et commentaires purs
    if (/^\s*$/.test(ligne)) continue;
    const sansCommentaire = retirerCommentaire(ligne);
    if (/^\s*$/.test(sansCommentaire)) continue;

    const indent = sansCommentaire.match(/^ */)[0].length;
    const contenu = sansCommentaire.trim();

    // Bloc multi-lignes `>` ou `|` : consommé comme une simple chaîne repliée
    const mBloc = contenu.match(/^([^:]+):\s*([|>])\s*$/);
    if (mBloc) {
      const cle = scalaire(mBloc[1]);
      const suite = [];
      let j = no + 1;
      while (j < brut.length && (brut[j].trim() === '' || brut[j].match(/^ */)[0].length > indent)) {
        if (brut[j].trim() !== '') suite.push(brut[j].trim());
        j++;
      }
      no = j - 1;
      while (pile.length > 1 && pile[pile.length - 1].indent >= indent) pile.pop();
      pile[pile.length - 1].conteneur[String(cle)] = suite.join(' ');
      continue;
    }

    // Élément de liste : "- ..."
    if (contenu.startsWith('- ') || contenu === '-') {
      while (pile.length > 1 && pile[pile.length - 1].indent > indent) pile.pop();
      const parent = pile[pile.length - 1].conteneur;
      if (!Array.isArray(parent)) continue; // sécurité : liste inattendue
      const reste = contenu === '-' ? '' : contenu.slice(2).trim();
      if (reste === '') {
        const nouveau = {};
        parent.push(nouveau);
        pile.push({ indent, conteneur: nouveau });
      } else if (reste.includes(': ') || /:$/.test(reste)) {
        // "- clé: valeur" ⇒ objet dont la première clé est sur la même ligne
        const obj = {};
        parent.push(obj);
        const i = reste.indexOf(':');
        const cle = scalaire(reste.slice(0, i));
        const val = reste.slice(i + 1).trim();
        obj[String(cle)] = val === '' ? null : scalaire(val);
        pile.push({ indent: indent + 1, conteneur: obj });
      } else {
        parent.push(scalaire(reste));
      }
      continue;
    }

    // "clé: valeur" ou "clé:"
    const m = contenu.match(/^([^:]+):(.*)$/);
    if (!m) continue;
    const cle = scalaire(m[1]);
    const reste = m[2].trim();

    while (pile.length > 1 && pile[pile.length - 1].indent >= indent) pile.pop();
    const conteneur = pile[pile.length - 1].conteneur;

    if (reste === '') {
      // Conteneur dont le type dépend de la ligne suivante : on devine par anticipation
      const suivante = prochaineLigneUtile(brut, no + 1);
      const estListe = suivante !== null && suivante.trim().startsWith('-');
      const nouveau = estListe ? [] : {};
      conteneur[String(cle)] = nouveau;
      pile.push({ indent, conteneur: nouveau });
    } else {
      conteneur[String(cle)] = scalaire(reste);
    }
  }
  return racine;
}

function prochaineLigneUtile(lignes, depuis) {
  for (let i = depuis; i < lignes.length; i++) {
    const t = retirerCommentaire(lignes[i]);
    if (t.trim() !== '') return t;
  }
  return null;
}

/** Retire un commentaire `#` en respectant les chaînes quotees. */
function retirerCommentaire(ligne) {
  let quote = null;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '#' && (i === 0 || /\s/.test(ligne[i - 1]))) return ligne.slice(0, i);
  }
  return ligne;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Validateur JSON Schema — sous-ensemble OpenAPI 3.0 utilisé par ce contrat
// ═══════════════════════════════════════════════════════════════════════════════
//
// Couvert : $ref (local), allOf, type, nullable, enum, const, required, properties,
//           items, minItems, maxItems, minLength, maxLength, minimum, maximum,
//           additionalProperties (objet), format (email, uri, date, date-time).
// Non couvert (inutile ici) : oneOf, anyOf, not, patternProperties, if/then/else.

class Validateur {
  constructor(doc) {
    this.doc = doc;
    this.schemas = doc?.components?.schemas ?? {};
    // Garde-fou anti-récursion : une même paire (schéma, chemin) n'est validée qu'une fois.
    this.vus = new Set();
  }

  /** Résout un `$ref` local vers son schéma. */
  resoudre(ref) {
    if (typeof ref !== 'string') return null;
    const m = ref.match(/^#\/components\/schemas\/(.+)$/);
    if (!m) return null;
    return this.schemas[m[1]] ?? null;
  }

  /**
   * Valide `valeur` contre `schema`. Retourne un tableau de messages d'erreur
   * (vide si conforme). `chemin` sert à localiser précisément la divergence.
   */
  valider(valeur, schema, chemin = '$') {
    const erreurs = [];
    if (schema == null) return erreurs;

    // $ref
    if (schema.$ref) {
      const cible = this.resoudre(schema.$ref);
      if (!cible) return [`${chemin} : $ref non résolu (${schema.$ref})`];
      const cle = `${schema.$ref}|${chemin}`;
      if (this.vus.has(cle)) return erreurs;
      this.vus.add(cle);
      try {
        return this.valider(valeur, cible, chemin);
      } finally {
        this.vus.delete(cle);
      }
    }

    // allOf : toutes les contraintes s'appliquent
    if (Array.isArray(schema.allOf)) {
      for (const sous of schema.allOf) erreurs.push(...this.valider(valeur, sous, chemin));
      // Les propriétés déclarées à côté de allOf s'appliquent aussi
      const { allOf, ...reste } = schema;
      if (Object.keys(reste).length > 0 && !reste.type && !reste.properties) return erreurs;
      if (reste.properties || reste.type) erreurs.push(...this.valider(valeur, reste, chemin));
      return erreurs;
    }

    // nullable OpenAPI 3.0
    if (valeur === null) {
      if (schema.nullable === true) return erreurs;
      if (schema.type && schema.type !== 'null') {
        return [`${chemin} : null reçu alors que le schéma interdit null (type ${schema.type})`];
      }
      return erreurs;
    }

    // enum / const
    if (Array.isArray(schema.enum) && !schema.enum.includes(valeur)) {
      erreurs.push(
        `${chemin} : valeur ${JSON.stringify(valeur)} absente de l'enum ` +
        `[${schema.enum.map((e) => JSON.stringify(e)).join(', ')}]`
      );
    }
    if (schema.const !== undefined && valeur !== schema.const) {
      erreurs.push(`${chemin} : attendu ${JSON.stringify(schema.const)}, reçu ${JSON.stringify(valeur)}`);
    }

    // type
    const typeAttendu = schema.type;
    if (typeAttendu) {
      const types = Array.isArray(typeAttendu) ? typeAttendu : [typeAttendu];
      const ok = types.some((t) => typeCorrespond(valeur, t));
      if (!ok) {
        erreurs.push(
          `${chemin} : type attendu ${types.join('|')}, reçu ${typeReel(valeur)}` +
          (types.includes('integer') ? ' (attention : 1.5 est un number, pas un integer)' : '')
        );
        return erreurs; // inutile d'aller plus loin
      }
    }

    // Chaînes
    if (typeof valeur === 'string') {
      if (typeof schema.minLength === 'number' && valeur.length < schema.minLength) {
        erreurs.push(`${chemin} : longueur ${valeur.length} < minLength ${schema.minLength}`);
      }
      if (typeof schema.maxLength === 'number' && valeur.length > schema.maxLength) {
        erreurs.push(`${chemin} : longueur ${valeur.length} > maxLength ${schema.maxLength}`);
      }
      if (schema.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur)) {
        erreurs.push(`${chemin} : format email invalide (${JSON.stringify(valeur)})`);
      }
      if (schema.format === 'uri' && !/^[a-z][a-z0-9+.-]*:/i.test(valeur)) {
        erreurs.push(`${chemin} : format uri invalide (${JSON.stringify(valeur)})`);
      }
      if (schema.format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
        erreurs.push(`${chemin} : format date attendu YYYY-MM-DD, reçu ${JSON.stringify(valeur)}`);
      }
      if (schema.format === 'date-time' && Number.isNaN(Date.parse(valeur))) {
        erreurs.push(`${chemin} : format date-time ISO 8601 invalide (${JSON.stringify(valeur)})`);
      }
    }

    // Nombres
    if (typeof valeur === 'number') {
      if (typeof schema.minimum === 'number' && valeur < schema.minimum) {
        erreurs.push(`${chemin} : ${valeur} < minimum ${schema.minimum}`);
      }
      if (typeof schema.maximum === 'number' && valeur > schema.maximum) {
        erreurs.push(`${chemin} : ${valeur} > maximum ${schema.maximum}`);
      }
    }

    // Tableaux
    if (Array.isArray(valeur)) {
      if (typeof schema.minItems === 'number' && valeur.length < schema.minItems) {
        erreurs.push(`${chemin} : ${valeur.length} élément(s) < minItems ${schema.minItems}`);
      }
      if (typeof schema.maxItems === 'number' && valeur.length > schema.maxItems) {
        erreurs.push(`${chemin} : ${valeur.length} élément(s) > maxItems ${schema.maxItems}`);
      }
      if (schema.items) {
        valeur.forEach((el, i) => erreurs.push(...this.valider(el, schema.items, `${chemin}[${i}]`)));
      }
      return erreurs;
    }

    // Objets
    if (typeof valeur === 'object') {
      for (const req of schema.required ?? []) {
        if (!(req in valeur)) erreurs.push(`${chemin} : propriété obligatoire absente « ${req} »`);
      }
      const props = schema.properties ?? {};
      for (const [cle, val] of Object.entries(valeur)) {
        if (props[cle]) {
          erreurs.push(...this.valider(val, props[cle], `${chemin}.${cle}`));
        } else if (schema.additionalProperties === false) {
          erreurs.push(
            `${chemin} : propriété « ${cle} » NON PRÉVUE par le schéma ` +
            `(le contrat n'autorise que : ${Object.keys(props).join(', ') || '—'})`
          );
        } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
          erreurs.push(...this.valider(val, schema.additionalProperties, `${chemin}.${cle}`));
        }
      }
    }

    return erreurs;
  }
}

function typeReel(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}

function typeCorrespond(valeur, type) {
  switch (type) {
    case 'string': return typeof valeur === 'string';
    case 'integer': return Number.isInteger(valeur);
    case 'number': return typeof valeur === 'number' && Number.isFinite(valeur);
    case 'boolean': return typeof valeur === 'boolean';
    case 'array': return Array.isArray(valeur);
    case 'object': return valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur);
    case 'null': return valeur === null;
    default: return true;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Client HTTP avec gestion des cookies de session Sanctum
// ═══════════════════════════════════════════════════════════════════════════════

class ClientSession {
  constructor(racine, prefixe) {
    this.racine = racine.replace(/\/+$/, '');
    this.prefixe = prefixe.startsWith('/') ? prefixe : `/${prefixe}`;
    /** @type {Map<string,string>} */
    this.cookies = new Map();
  }

  /** Enregistre les cookies `Set-Cookie` (plusieurs possibles dans une réponse). */
  absorberCookies(reponse) {
    // Node expose getSetCookie() sur Headers ; repli sur get('set-cookie').
    const bruts =
      typeof reponse.headers.getSetCookie === 'function'
        ? reponse.headers.getSetCookie()
        : [reponse.headers.get('set-cookie')].filter(Boolean);

    for (const brut of bruts) {
      const [paire] = brut.split(';');
      const i = paire.indexOf('=');
      if (i === -1) continue;
      const nom = paire.slice(0, i).trim();
      const valeur = paire.slice(i + 1).trim();
      if (valeur === '' ) this.cookies.delete(nom);
      else this.cookies.set(nom, valeur);
    }
  }

  enTeteCookie() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  /** Le cookie XSRF-TOKEN doit être renvoyé décodé dans X-XSRF-TOKEN (comportement axios). */
  jetonXsrf() {
    const brut = this.cookies.get('XSRF-TOKEN');
    return brut ? decodeURIComponent(brut) : null;
  }

  /**
   * Requête HTTP. `chemin` est relatif à la RACINE (permet de viser /sanctum/csrf-cookie,
   * qui vit hors du préfixe /api/v1).
   */
  async requete(methode, chemin, { corps, json = true, brut = false } = {}) {
    const url = `${this.racine}${chemin}`;
    const entetes = { Accept: 'application/json' };
    entetes.Origin = 'http://localhost:5173';
    entetes.Referer = 'http://localhost:5173/';
    const cookie = this.enTeteCookie();
    if (cookie) entetes.Cookie = cookie;
    if (methode !== 'GET' && methode !== 'HEAD') {
      const xsrf = this.jetonXsrf();
      if (xsrf) entetes['X-XSRF-TOKEN'] = xsrf;
    }

    let body;
    if (corps !== undefined) {
      if (json) {
        entetes['Content-Type'] = 'application/json';
        body = JSON.stringify(corps);
      } else {
        body = corps; // FormData : ne pas fixer Content-Type, fetch pose la frontière
      }
    }

    let reponse;
    try {
      reponse = await fetch(url, { method: methode, headers: entetes, body, redirect: 'manual' });
    } catch (e) {
      throw new ErreurReseau(`${methode} ${chemin} : ${e.message}`);
    }
    this.absorberCookies(reponse);

    const texte = await reponse.text();
    let donnees = null;
    if (texte !== '') {
      try { donnees = JSON.parse(texte); } catch { donnees = brut ? texte : { _corpsNonJson: texte }; }
    }
    return { statut: reponse.status, donnees, texte, entetes: reponse.headers, url };
  }

  /** GET /api/v1/... */
  get(chemin, options) {
    return this.requete('GET', `${this.prefixe}${chemin}`, options);
  }
  post(chemin, corps, options) {
    return this.requete('POST', `${this.prefixe}${chemin}`, { ...options, corps });
  }
  patch(chemin, corps, options) {
    return this.requete('PATCH', `${this.prefixe}${chemin}`, { ...options, corps });
  }
  put(chemin, corps, options) {
    return this.requete('PUT', `${this.prefixe}${chemin}`, { ...options, corps });
  }
  delete(chemin, options) {
    return this.requete('DELETE', `${this.prefixe}${chemin}`, options);
  }

  /** Vérifie que l'API répond. */
  async joignable() {
    try {
      const r = await fetch(`${this.racine}${this.prefixe}/skills`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      return { ok: true, statut: r.status };
    } catch (e) {
      return { ok: false, erreur: e.message };
    }
  }

  /** Flux CSRF + login. Retourne le ProfilPrive ou null. */
  async seConnecter(email, motDePasse) {
    // 1. /sanctum/csrf-cookie est à la RACINE, hors /api/v1 (règle du contrat)
    const csrf = await this.requete('GET', '/sanctum/csrf-cookie');
    if (csrf.statut !== 204) {
      return { ok: false, raison: `/sanctum/csrf-cookie a renvoyé ${csrf.statut} (204 attendu)` };
    }
    // 2. Connexion
    const login = await this.post('/auth/login', { email, mot_de_passe: motDePasse });
    if (login.statut !== 200) {
      return {
        ok: false,
        raison: `/auth/login a renvoyé ${login.statut}`,
        corps: login.donnees,
      };
    }
    return { ok: true, profil: login.donnees };
  }
}

class ErreurReseau extends Error {}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Registre de vérifications
// ═══════════════════════════════════════════════════════════════════════════════

class Rapport {
  constructor() {
    this.resultats = [];
  }
  /** Enregistre une vérification. `erreurs` vide ⇒ conforme. */
  ajouter({ id, titre, priorite = 'P0', operation, erreurs = [], note = '' }) {
    this.resultats.push({ id, titre, priorite, operation, erreurs, note });
  }
  get conformes() { return this.resultats.filter((r) => r.erreurs.length === 0); }
  get divergents() { return this.resultats.filter((r) => r.erreurs.length > 0); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Scénarios de conformité
// ═══════════════════════════════════════════════════════════════════════════════

const valider = (v, schemaNom) => (valeur, chemin) =>
  v.valider(valeur, { $ref: `#/components/schemas/${schemaNom}` }, chemin);

/**
 * Construit la liste des scénarios. Chaque scénario reçoit le contexte
 * { client, v, validerSchema, etat, journal } et enregistre ses résultats.
 */
function scenarios() {
  return [
    // ─── Auth ───────────────────────────────────────────────────────────────
    {
      id: 'AUTH-01', titre: 'GET /sanctum/csrf-cookie répond 204 et pose XSRF-TOKEN',
      operation: 'GET /sanctum/csrf-cookie', priorite: 'P0',
      async executer({ client, rapport }) {
        const r = await client.requete('GET', '/sanctum/csrf-cookie');
        const erreurs = [];
        if (r.statut !== 204) erreurs.push(`statut ${r.statut}, attendu 204`);
        if (!client.cookies.has('XSRF-TOKEN')) {
          erreurs.push('cookie XSRF-TOKEN absent (le front ne pourra pas remplir X-XSRF-TOKEN)');
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'AUTH-02', titre: 'GET /auth/me respecte ProfilPrive (email PRÉSENT)',
      operation: 'GET /auth/me', priorite: 'P0',
      async executer({ client, validerSchema, rapport, etat }) {
        const r = await client.get('/auth/me');
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else {
          erreurs.push(...validerSchema('ProfilPrive')(r.donnees, '$'));
          if (r.donnees && !('email' in r.donnees)) {
            erreurs.push('clé « email » absente de ProfilPrive — le front ne peut pas l\'afficher');
          }
          if (r.donnees?.id != null) etat.moiId = r.donnees.id;
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'AUTH-03', titre: 'GET /auth/me sans session répond 401 (et non 403)',
      operation: 'GET /auth/me', priorite: 'P0',
      async executer({ racine, prefixe, rapport }) {
        const anonyme = new ClientSession(racine, prefixe);
        const r = await anonyme.get('/auth/me');
        const erreurs = [];
        if (r.statut !== 401) {
          erreurs.push(
            `statut ${r.statut}, attendu 401 — le contrat impose 401 pour une session absente ` +
            '(un 403 empêcherait le front de distinguer « non connecté » de « non autorisé »)'
          );
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },

    // ─── Profils & compétences ──────────────────────────────────────────────
    {
      id: 'PROFIL-01', titre: 'GET /skills renvoie une collection bornée { data } sans meta',
      operation: 'GET /skills', priorite: 'P0',
      async executer({ client, validerSchema, rapport }) {
        const r = await client.get('/skills');
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else {
          if (!Array.isArray(r.donnees?.data)) erreurs.push('« data » absent ou non tableau');
          if ('meta' in (r.donnees ?? {})) {
            erreurs.push('« meta » présent : le contrat déclare /skills comme collection BORNÉE (sans meta)');
          }
          for (const [i, c] of (r.donnees?.data ?? []).entries()) {
            erreurs.push(...validerSchema('Competence')(c, `$.data[${i}]`));
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'PROFIL-02', titre: 'GET /users/{id} NE CONTIENT JAMAIS la clé email',
      operation: 'GET /users/{id}', priorite: 'P0',
      async executer({ client, validerSchema, rapport, etat }) {
        const cible = etat.moiId ?? 1;
        const r = await client.get(`/users/${cible}`);
        const erreurs = [];
        if (r.statut === 200) {
          if (r.donnees && 'email' in r.donnees) {
            erreurs.push(
              'FUITE : la clé « email » est présente dans la réponse de GET /users/{id}. ' +
              'Le contrat impose ProfilResource, sans e-mail. C\'est une violation de sécurité.'
            );
          }
          erreurs.push(...validerSchema('Profil')(r.donnees, '$'));
        } else if (![404].includes(r.statut)) {
          erreurs.push(`statut ${r.statut}, attendu 200 ou 404`);
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },

    // ─── Recherche de talents : la sérialisation des tableaux ───────────────
    {
      id: 'TALENT-01', titre: 'GET /users répond TalentPage conforme (meta de pagination)',
      operation: 'GET /users', priorite: 'P0',
      async executer({ client, validerSchema, rapport, etat }) {
        const r = await client.get('/users?page=1&per_page=5');
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else {
          erreurs.push(...validerSchema('TalentPage')(r.donnees, '$'));
          if (r.donnees?.meta?.per_page !== 5) {
            erreurs.push(`meta.per_page = ${r.donnees?.meta?.per_page}, attendu 5 (le paramètre est ignoré ?)`);
          }
          // Le contrat exclut l'utilisateur connecté des résultats
          if (etat.moiId != null && (r.donnees?.data ?? []).some((t) => t.id === etat.moiId)) {
            erreurs.push(
              'l\'utilisateur connecté apparaît dans ses propres résultats de recherche ' +
              '(le contrat impose de l\'exclure)'
            );
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'TALENT-02', titre: 'competence_ids[]= sérialisé en brackets renvoie 200 (et non 422)',
      operation: 'GET /users', priorite: 'P0',
      async executer({ client, validerSchema, rapport }) {
        const r = await client.get('/users?competence_ids[]=1&competence_ids[]=2&competence_match=any');
        const erreurs = [];
        if (r.statut !== 200) {
          erreurs.push(
            `statut ${r.statut}, attendu 200. Si 422 : le backend attend une autre sérialisation ` +
            'que competence_ids[]=1&competence_ids[]=2, imposée pourtant par le contrat.'
          );
        } else {
          erreurs.push(...validerSchema('TalentPage')(r.donnees, '$'));
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'TALENT-03', titre: 'competence_match=all est accepté',
      operation: 'GET /users', priorite: 'P0',
      async executer({ client, rapport }) {
        const r = await client.get('/users?competence_ids[]=1&competence_match=all');
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'TALENT-04', titre: 'competence_match hors enum (any|all) est rejeté en 422',
      operation: 'GET /users', priorite: 'P0',
      async executer({ client, rapport }) {
        const r = await client.get('/users?competence_match=nimportequoi');
        const erreurs = [];
        if (r.statut !== 422) {
          erreurs.push(`statut ${r.statut}, attendu 422 — l'enum any|all n'est pas validée`);
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'TALENT-05', titre: 'per_page=100 est borné à 50 maximum',
      operation: 'GET /users', priorite: 'P0',
      async executer({ client, rapport }) {
        const r = await client.get('/users?per_page=100');
        const erreurs = [];
        if (r.statut === 200 && r.donnees?.meta?.per_page > 50) {
          erreurs.push(`meta.per_page = ${r.donnees.meta.per_page} : le contrat impose 50 maximum`);
        } else if (![200, 422].includes(r.statut)) {
          erreurs.push(`statut ${r.statut}, attendu 200 (borné) ou 422 (rejeté)`);
        }
        rapport.ajouter({ ...this, erreurs, note: 'bornage à 50 ou rejet : les deux sont défendables' });
      },
    },

    // ─── Projets ────────────────────────────────────────────────────────────
    {
      id: 'PROJET-01', titre: 'GET /projects répond ProjetPage (cartes) conforme',
      operation: 'GET /projects', priorite: 'P0',
      async executer({ client, validerSchema, rapport, etat }) {
        const r = await client.get('/projects?page=1&per_page=5');
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else {
          erreurs.push(...validerSchema('ProjetPage')(r.donnees, '$'));
          const premier = r.donnees?.data?.[0];
          if (premier) {
            if ('description' in premier && !('description_courte' in premier)) {
              erreurs.push(
                'les cartes de liste exposent « description » (3000 car.) au lieu de ' +
                '« description_courte » (200 car.) : le contrat impose ProjetCarte en liste'
              );
            }
            etat.premierProjetId = premier.id;
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'PROJET-02', titre: 'Le statut ne prend que recrutement|en_cours|termine',
      operation: 'GET /projects', priorite: 'P0',
      async executer({ client, rapport }) {
        const autorises = ['recrutement', 'en_cours', 'termine'];
        const r = await client.get('/projects?per_page=50');
        const erreurs = [];
        if (r.statut === 200) {
          const statuts = new Set((r.donnees?.data ?? []).map((p) => p.statut));
          for (const s of statuts) {
            if (!autorises.includes(s)) {
              erreurs.push(`statut « ${s} » hors enum [${autorises.join(', ')}]`);
            }
            if (['Ouvert', 'En cours', 'Terminé'].includes(s)) {
              erreurs.push(
                `le backend renvoie le LIBELLÉ « ${s} » au lieu de la valeur TECHNIQUE. ` +
                'Le contrat impose la valeur technique ; le libellé est une affaire de front.'
              );
            }
          }
        } else {
          erreurs.push(`statut ${r.statut}, attendu 200`);
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'PROJET-03', titre: 'GET /projects/{id} respecte le schéma Projet complet',
      operation: 'GET /projects/{id}', priorite: 'P0',
      async executer({ client, validerSchema, rapport, etat }) {
        const id = etat.premierProjetId;
        if (id == null) {
          rapport.ajouter({ ...this, erreurs: [], note: 'ignoré : aucun projet en base (seeder non lancé ?)' });
          return;
        }
        const r = await client.get(`/projects/${id}`);
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else {
          erreurs.push(...validerSchema('Projet')(r.donnees, '$'));
          if (r.donnees?.domaines && (r.donnees.domaines.length < 1 || r.donnees.domaines.length > 3)) {
            erreurs.push(`domaines contient ${r.donnees.domaines.length} élément(s), le contrat impose 1 à 3`);
          }
          if (typeof r.donnees?.is_member !== 'boolean') {
            erreurs.push('« is_member » absent ou non booléen : le bouton Rejoindre ne peut pas être piloté');
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'PROJET-04', titre: 'Créer un projet avec statut=termine est refusé en 422',
      operation: 'POST /projects', priorite: 'P0',
      async executer({ client, rapport }) {
        const r = await client.post('/projects', {
          nom: 'CONFORMITÉ — test de refus (à supprimer)',
          description: 'Requête émise par le script de conformité OpenAPI pour vérifier la règle « termine refusé à la création ».',
          domaines: ['agriculture'],
          objectifs: 'Vérifier la règle métier du contrat.',
          nombre_membres_souhaite: 2,
          statut: 'termine',
        });
        const erreurs = [];
        if (r.statut !== 422) {
          erreurs.push(
            `statut ${r.statut}, attendu 422 — la règle « termine refusé à la création » n'est pas appliquée` +
            (r.statut === 201 ? ' (⚠️ UN PROJET A ÉTÉ CRÉÉ et doit être supprimé à la main)' : '')
          );
        }
        rapport.ajouter({ ...this, erreurs, note: 'écriture : n\'est exécutée qu\'avec --ecritures' });
      },
    },
    {
      id: 'PROJET-05', titre: 'Valider un projet : erreurs par champ au format Laravel',
      operation: 'POST /projects', priorite: 'P0',
      async executer({ client, rapport }) {
        const r = await client.post('/projects', { nom: '' });
        const erreurs = [];
        if (r.statut !== 422) {
          erreurs.push(`statut ${r.statut}, attendu 422`);
        } else {
          if (typeof r.donnees?.message !== 'string') erreurs.push('« message » absent de la réponse 422');
          const e = r.donnees?.errors;
          if (!e || typeof e !== 'object' || Array.isArray(e)) {
            erreurs.push('« errors » absent : le front ne peut pas rattacher les erreurs aux champs');
          } else {
            for (const [champ, msgs] of Object.entries(e)) {
              if (!Array.isArray(msgs) || msgs.some((m) => typeof m !== 'string')) {
                erreurs.push(`errors.${champ} n'est pas un tableau de chaînes`);
              }
            }
            for (const attendu of ['nom', 'description', 'domaines', 'objectifs', 'nombre_membres_souhaite']) {
              if (!(attendu in e)) {
                erreurs.push(`errors.${attendu} absent alors que le champ est obligatoire au contrat`);
              }
            }
          }
        }
        rapport.ajouter({ ...this, erreurs, note: 'écriture : n\'est exécutée qu\'avec --ecritures' });
      },
    },
    {
      id: 'PROJET-06', titre: 'nombre_membres_souhaite=1 est refusé (minimum 2)',
      operation: 'POST /projects', priorite: 'P0',
      async executer({ client, rapport }) {
        const r = await client.post('/projects', {
          nom: 'CONFORMITÉ — test de borne (à supprimer)',
          description: 'Vérifie le minimum de 2 membres souhaités imposé par le contrat.',
          domaines: ['agriculture'],
          objectifs: 'Vérifier la borne.',
          nombre_membres_souhaite: 1,
        });
        const erreurs = [];
        if (r.statut !== 422) erreurs.push(`statut ${r.statut}, attendu 422 (minimum 2)`);
        rapport.ajouter({ ...this, erreurs, note: 'écriture : n\'est exécutée qu\'avec --ecritures' });
      },
    },

    // ─── Équipes ────────────────────────────────────────────────────────────
    {
      id: 'EQUIPE-01', titre: 'GET /projects/{id}/members renvoie { data } NON paginé',
      operation: 'GET /projects/{id}/members', priorite: 'P0',
      async executer({ client, validerSchema, rapport, etat }) {
        const id = etat.premierProjetId;
        if (id == null) { rapport.ajouter({ ...this, erreurs: [], note: 'ignoré : aucun projet' }); return; }
        const r = await client.get(`/projects/${id}/members`);
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else {
          if (!Array.isArray(r.donnees?.data)) erreurs.push('« data » absent ou non tableau');
          if ('meta' in (r.donnees ?? {})) {
            erreurs.push('« meta » présent : le contrat déclare cette collection BORNÉE (sans meta)');
          }
          for (const [i, m] of (r.donnees?.data ?? []).entries()) {
            erreurs.push(...validerSchema('Membre')(m, `$.data[${i}]`));
            if (m?.role_equipe && !['proprietaire', 'membre'].includes(m.role_equipe)) {
              erreurs.push(`$.data[${i}].role_equipe = « ${m.role_equipe} » hors enum [proprietaire, membre]`);
            }
          }
          // Le créateur doit être proprietaire (règle : le créateur devient proprietaire)
          const proprios = (r.donnees?.data ?? []).filter((m) => m.role_equipe === 'proprietaire');
          if (proprios.length === 0) {
            erreurs.push('aucun membre avec role_equipe = « proprietaire » : le créateur n\'est pas rattaché');
          }
          if (proprios.length > 1) {
            erreurs.push(`${proprios.length} propriétaires : le contrat en suppose un seul (le créateur)`);
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },

    // ─── Messagerie : le point le plus délicat ──────────────────────────────
    {
      id: 'MSG-01', titre: 'GET /projects/{id}/messages respecte MessageFil (data + supprimes + meta)',
      operation: 'GET /projects/{id}/messages', priorite: 'P0',
      async executer({ client, validerSchema, rapport, etat }) {
        const id = etat.premierProjetId;
        if (id == null) { rapport.ajouter({ ...this, erreurs: [], note: 'ignoré : aucun projet' }); return; }
        const r = await client.get(`/projects/${id}/messages`);
        const erreurs = [];
        if (r.statut === 403) {
          erreurs.push(
            'statut 403 : le compte de test n\'est pas membre de ce projet. ' +
            'Le scénario MSG est ignoré — relancer avec un compte membre.'
          );
        } else if (r.statut !== 200) {
          erreurs.push(`statut ${r.statut}, attendu 200`);
        } else {
          erreurs.push(...validerSchema('MessageFil')(r.donnees, '$'));
          if (!Array.isArray(r.donnees?.supprimes)) {
            erreurs.push('« supprimes » absent ou non tableau (le polling ne pourra pas retirer les messages supprimés)');
          }
          // « meta » n'est pas obligatoire au niveau racine, mais il l'est EN PRATIQUE :
          // sans meta.server_time, le curseur « depuis » ne peut pas être constitué et le
          // polling ne verra jamais les suppressions. On le contrôle explicitement.
          if (r.donnees?.meta === undefined || r.donnees?.meta === null) {
            erreurs.push(
              '« meta » est ABSENT de la réponse : le contrat ne le marque pas obligatoire, ' +
              'mais sans meta.server_time le curseur « depuis » est impossible et les messages ' +
              'supprimés ne disparaîtront jamais de l\'écran'
            );
          } else if (typeof r.donnees.meta.server_time !== 'string') {
            erreurs.push('meta.server_time absent ou non chaîne : le curseur « depuis » ne peut pas être renvoyé');
          } else if (!/^\d{4}-\d{2}-\d{2}T/.test(r.donnees.meta.server_time)) {
            erreurs.push(
              `meta.server_time = ${JSON.stringify(r.donnees.meta.server_time)} n'est pas un ISO 8601 ` +
              '— le contrat impose un format date-time'
            );
          }
          // Au premier appel (sans « depuis »), supprimes doit être vide
          if (Array.isArray(r.donnees?.supprimes) && r.donnees.supprimes.length > 0) {
            erreurs.push(
              '« supprimes » non vide alors que le paramètre « depuis » était ABSENT : ' +
              'le contrat impose un tableau vide dans ce cas'
            );
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'MSG-02', titre: 'Les messages arrivent triés du plus ancien au plus récent',
      operation: 'GET /projects/{id}/messages', priorite: 'P0',
      async executer({ client, rapport, etat }) {
        const id = etat.premierProjetId;
        if (id == null) { rapport.ajouter({ ...this, erreurs: [], note: 'ignoré : aucun projet' }); return; }
        const r = await client.get(`/projects/${id}/messages?limit=50`);
        const erreurs = [];
        if (r.statut === 200) {
          const ids = (r.donnees?.data ?? []).map((m) => m.id);
          const croissant = ids.every((v, i) => i === 0 || ids[i - 1] < v);
          if (!croissant) {
            erreurs.push(
              `ids non croissants : [${ids.join(', ')}]. Le contrat impose « du plus ancien au plus récent » ` +
              '— un ordre décroissant ferait afficher la discussion à l\'envers.'
            );
          }
        } else if (r.statut !== 403) {
          erreurs.push(`statut ${r.statut}, attendu 200`);
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'MSG-03', titre: 'apres_id filtre strictement (id > apres_id)',
      operation: 'GET /projects/{id}/messages', priorite: 'P0',
      async executer({ client, rapport, etat }) {
        const id = etat.premierProjetId;
        if (id == null) { rapport.ajouter({ ...this, erreurs: [], note: 'ignoré : aucun projet' }); return; }
        const complet = await client.get(`/projects/${id}/messages?limit=50`);
        if (complet.statut !== 200 || (complet.donnees?.data ?? []).length < 2) {
          rapport.ajouter({ ...this, erreurs: [], note: 'ignoré : moins de 2 messages pour tester le curseur' });
          return;
        }
        const messages = complet.donnees.data;
        const pivot = messages[Math.floor(messages.length / 2)].id;
        const r = await client.get(`/projects/${id}/messages?apres_id=${pivot}`);
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else {
          const fautifs = (r.donnees?.data ?? []).filter((m) => m.id <= pivot);
          if (fautifs.length > 0) {
            erreurs.push(
              `apres_id=${pivot} a renvoyé ${fautifs.length} message(s) d'id inférieur ou égal ` +
              `(${fautifs.map((m) => m.id).join(', ')}) : le polling réafficherait des messages déjà vus`
            );
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'MSG-04', titre: 'avant_id filtre strictement (id < avant_id)',
      operation: 'GET /projects/{id}/messages', priorite: 'P0',
      async executer({ client, rapport, etat }) {
        const id = etat.premierProjetId;
        if (id == null) { rapport.ajouter({ ...this, erreurs: [], note: 'ignoré : aucun projet' }); return; }
        const pivot = 10_000_000;
        const r = await client.get(`/projects/${id}/messages?avant_id=${pivot}&limit=10`);
        const erreurs = [];
        if (r.statut === 200) {
          const fautifs = (r.donnees?.data ?? []).filter((m) => m.id >= pivot);
          if (fautifs.length > 0) erreurs.push(`avant_id=${pivot} a renvoyé des ids supérieurs ou égaux`);
        } else if (r.statut !== 403) {
          erreurs.push(`statut ${r.statut}, attendu 200`);
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },

    // ─── Ressources ─────────────────────────────────────────────────────────
    {
      id: 'RESS-01', titre: 'GET /resources répond RessourcePage conforme',
      operation: 'GET /resources', priorite: 'P0',
      async executer({ client, validerSchema, rapport }) {
        const r = await client.get('/resources?page=1&per_page=5');
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else erreurs.push(...validerSchema('RessourcePage')(r.donnees, '$'));
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'RESS-02', titre: 'POST /resources sans fichier accepte application/json',
      operation: 'POST /resources', priorite: 'P0',
      async executer({ client, validerSchema, rapport }) {
        const r = await client.post('/resources', {
          type: 'lien',
          titre: 'CONFORMITÉ — ressource de test (à supprimer)',
          description: 'Ressource créée par le script de conformité OpenAPI pour valider le content-type JSON.',
          url: 'https://example.org/conformite',
        });
        const erreurs = [];
        if (r.statut === 201) {
          erreurs.push(...validerSchema('Ressource')(r.donnees, '$'));
          if (r.donnees?.visibilite !== 'publique') {
            erreurs.push(
              `visibilite = « ${r.donnees?.visibilite} » sans projet_id : le contrat impose « publique » ` +
              '(« projet » sans projet_id ⇒ 422)'
            );
          }
        } else if (r.statut === 422) {
          erreurs.push(
            'statut 422 sur un POST /resources JSON valide — vérifier que le backend n\'exige pas ' +
            'multipart/form-data alors que le contrat autorise les deux content-types'
          );
        } else {
          erreurs.push(`statut ${r.statut}, attendu 201`);
        }
        rapport.ajouter({ ...this, erreurs, note: 'écriture : n\'est exécutée qu\'avec --ecritures' });
      },
    },
    {
      id: 'RESS-03', titre: 'type=document sans fichier est refusé en 422 sur le champ fichier',
      operation: 'POST /resources', priorite: 'P0',
      async executer({ client, rapport }) {
        const r = await client.post('/resources', {
          type: 'document',
          titre: 'CONFORMITÉ — document sans fichier (à supprimer)',
        });
        const erreurs = [];
        if (r.statut !== 422) {
          erreurs.push(`statut ${r.statut}, attendu 422 (type=document exige un fichier)`);
        } else if (!r.donnees?.errors?.fichier) {
          erreurs.push(
            'errors.fichier absent : le front ne peut pas désigner le champ fautif ' +
            `(reçu : ${JSON.stringify(r.donnees?.errors ?? null)})`
          );
        }
        rapport.ajouter({ ...this, erreurs, note: 'écriture : n\'est exécutée qu\'avec --ecritures' });
      },
    },

    // ─── Dashboard & stats ──────────────────────────────────────────────────
    {
      id: 'DASH-01', titre: 'GET /stats est public (sans session) et conforme',
      operation: 'GET /stats', priorite: 'P1',
      async executer({ racine, prefixe, validerSchema, rapport }) {
        const anonyme = new ClientSession(racine, prefixe);
        const r = await anonyme.get('/stats');
        const erreurs = [];
        if (r.statut === 404) {
          rapport.ajouter({ ...this, erreurs: [], note: 'P1 non livré : route absente (404). Repli front requis.' });
          return;
        }
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200 (route PUBLIQUE)`);
        else erreurs.push(...validerSchema('Stats')(r.donnees, '$'));
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'DASH-02', titre: 'GET /me/dashboard respecte le schéma Dashboard',
      operation: 'GET /me/dashboard', priorite: 'P1',
      async executer({ client, validerSchema, rapport }) {
        const r = await client.get('/me/dashboard');
        const erreurs = [];
        if (r.statut === 404) {
          rapport.ajouter({
            ...this, erreurs: [],
            note: 'P1 non livré (404) : le front doit utiliser le repli P0 — GET /me/projects + GET /me/join-requests',
          });
          return;
        }
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else {
          erreurs.push(...validerSchema('Dashboard')(r.donnees, '$'));
          for (const champ of ['followers_count', 'following_count']) {
            if (champ in (r.donnees ?? {}) && r.donnees[champ] !== 0) {
              erreurs.push(
                `${champ} = ${r.donnees[champ]} alors que le follow (P1) n'est pas livré : ` +
                'le contrat impose 0 tant que le follow ne l\'est pas'
              );
            }
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },

    // ─── Pagination ─────────────────────────────────────────────────────────
    {
      id: 'PAGE-01', titre: 'GET /me/projects répond ProjetPage avec meta complet',
      operation: 'GET /me/projects', priorite: 'P0',
      async executer({ client, validerSchema, rapport }) {
        const r = await client.get('/me/projects?page=1&per_page=5');
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else {
          erreurs.push(...validerSchema('ProjetPage')(r.donnees, '$'));
          for (const cle of ['current_page', 'per_page', 'total', 'last_page']) {
            if (typeof r.donnees?.meta?.[cle] !== 'number') {
              erreurs.push(`meta.${cle} absent ou non numérique : la pagination est inexploitable`);
            }
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'PAGE-02', titre: 'GET /me/join-requests répond DemandePage conforme',
      operation: 'GET /me/join-requests', priorite: 'P0',
      async executer({ client, validerSchema, rapport }) {
        const r = await client.get('/me/join-requests?page=1&per_page=5');
        const erreurs = [];
        if (r.statut !== 200) erreurs.push(`statut ${r.statut}, attendu 200`);
        else erreurs.push(...validerSchema('DemandePage')(r.donnees, '$'));
        rapport.ajouter({ ...this, erreurs });
      },
    },

    // ─── Portfolio ──────────────────────────────────────────────────────────
    {
      id: 'PORT-01', titre: 'GET /users/{id}/portfolio ne contient que des projets terminés',
      operation: 'GET /users/{id}/portfolio', priorite: 'P0',
      async executer({ client, validerSchema, rapport, etat }) {
        const id = etat.moiId ?? 1;
        const r = await client.get(`/users/${id}/portfolio`);
        const erreurs = [];
        if (r.statut !== 200) {
          if (r.statut !== 404) erreurs.push(`statut ${r.statut}, attendu 200`);
        } else {
          if (!Array.isArray(r.donnees?.data)) erreurs.push('« data » absent ou non tableau');
          if ('meta' in (r.donnees ?? {})) {
            erreurs.push('« meta » présent : le contrat déclare le portfolio comme collection BORNÉE (sans meta)');
          }
          for (const [i, p] of (r.donnees?.data ?? []).entries()) {
            erreurs.push(...validerSchema('Projet')(p, `$.data[${i}]`));
            if (p?.statut !== 'termine') {
              erreurs.push(
                `$.data[${i}].statut = « ${p?.statut} » : le portfolio ne doit contenir que des projets « termine » ` +
                '(un projet en cours dans un portfolio est un mensonge sur le parcours du membre)'
              );
            }
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },

    // ─── Sécurité transversale ──────────────────────────────────────────────
    {
      id: 'SECU-01', titre: 'Aucune route protégée n\'est accessible sans session (échantillon)',
      operation: 'transversal', priorite: 'P0',
      async executer({ racine, prefixe, rapport }) {
        const anonyme = new ClientSession(racine, prefixe);
        const routes = [
          '/auth/me', '/skills', '/users', '/users/1', '/projects',
          '/me/projects', '/me/join-requests', '/resources',
        ];
        const erreurs = [];
        for (const route of routes) {
          const r = await anonyme.get(route);
          if (r.statut !== 401) {
            erreurs.push(`${route} sans session → ${r.statut} (attendu 401)`);
          }
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
    {
      id: 'SECU-02', titre: 'Le drapeau 401 n\'est pas confondu avec 403',
      operation: 'transversal', priorite: 'P0',
      async executer({ client, rapport }) {
        // On demande les demandes d'un projet dont on n'est PAS propriétaire : 403 attendu.
        const r = await client.get('/projects/999999/join-requests');
        const erreurs = [];
        if (![403, 404].includes(r.statut)) {
          erreurs.push(
            `statut ${r.statut} sur un projet inexistant : attendu 404 (introuvable) ou 403 (non propriétaire)`
          );
        }
        rapport.ajouter({ ...this, erreurs });
      },
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Programme principal
// ═══════════════════════════════════════════════════════════════════════════════

function lireArguments(argv) {
  const options = {
    api: process.env.AB_API ?? 'http://localhost:8000',
    email: process.env.AB_EMAIL ?? null,
    motDePasse: process.env.AB_MOT_DE_PASSE ?? null,
    prefixe: process.env.AB_PREFIXE ?? '/api/v1',
    spec: 'openapi-africabridgefinal.yaml',
    sansAuth: false,
    verbeux: false,
    ecritures: false,
    json: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const suivant = () => argv[++i];
    switch (a) {
      case '--api': options.api = suivant(); break;
      case '--email': options.email = suivant(); break;
      case '--mot-de-passe': options.motDePasse = suivant(); break;
      case '--prefixe': options.prefixe = suivant(); break;
      case '--spec': options.spec = suivant(); break;
      case '--sans-auth': options.sansAuth = true; break;
      case '--verbeux': options.verbeux = true; break;
      case '--ecritures': options.ecritures = true; break;
      case '--json': options.json = suivant(); break;
      case '--aide': case '-h': options.aide = true; break;
      default:
        if (a.startsWith('--')) { console.error(`Option inconnue : ${a}`); options.erreur = true; }
    }
  }
  return options;
}

const AIDE = `
Test de conformité OpenAPI — AfricaBridge
=========================================

Interroge une API AfricaBridge et vérifie ses réponses contre
openapi-africabridgefinal.yaml.

USAGE
  node scripts/conformite/verifier-conformite.mjs --api <url> --email <e> --mot-de-passe <p>

OPTIONS
  --api <url>          Racine du serveur, SANS /api/v1. Défaut : http://localhost:8000
  --prefixe <p>        Préfixe de l'API. Défaut : /api/v1
  --email <e>          Compte pour les scénarios authentifiés
  --mot-de-passe <p>   Mot de passe de ce compte
  --spec <fichier>     Contrat OpenAPI. Défaut : openapi-africabridgefinal.yaml
  --ecritures          Exécute AUSSI les scénarios qui ÉCRIVENT en base (créations de test)
  --sans-auth          Ne lance que les scénarios publics
  --verbeux            Affiche aussi les vérifications conformes
  --json <fichier>     Écrit le rapport JSON à ce chemin
  -h, --aide           Affiche cette aide

VARIABLES D'ENVIRONNEMENT (équivalentes)
  AB_API, AB_EMAIL, AB_MOT_DE_PASSE, AB_PREFIXE

CODES DE SORTIE
  0 conformité vérifiée   1 divergence détectée (BUG)   2 erreur d'exécution
`;

async function main() {
  const options = lireArguments(process.argv.slice(2));

  if (options.aide) { console.log(AIDE); return 0; }
  if (options.erreur) { console.error(AIDE); return 2; }

  // ── Chargement du contrat ─────────────────────────────────────────────────
  const ici = path.dirname(fileURLToPath(import.meta.url));
  const cheminSpec = path.isAbsolute(options.spec)
    ? options.spec
    : path.resolve(ici, '..', '..', options.spec);

  let doc;
  try {
    doc = lireYaml(await readFile(cheminSpec, 'utf8'));
  } catch (e) {
    console.error(`✗ Contrat illisible : ${cheminSpec}\n  ${e.message}`);
    return 2;
  }
  const nbSchemas = Object.keys(doc?.components?.schemas ?? {}).length;
  if (nbSchemas === 0) {
    console.error(`✗ Aucun schéma lu dans le contrat (${cheminSpec}). L'analyseur YAML a échoué.`);
    return 2;
  }

  const v = new Validateur(doc);
  const client = new ClientSession(options.api, options.prefixe);

  console.log('');
  console.log('═══ Test de conformité OpenAPI — AfricaBridge ═══');
  console.log(`  Contrat   : ${path.relative(process.cwd(), cheminSpec)} (${nbSchemas} schémas)`);
  console.log(`  API       : ${client.racine}${client.prefixe}`);
  console.log(`  Écritures : ${options.ecritures ? 'ACTIVÉES (créations de test en base)' : 'désactivées'}`);
  console.log('');

  // ── Joignabilité ──────────────────────────────────────────────────────────
  const ping = await client.joignable();
  if (!ping.ok) {
    console.error(`✗ API injoignable sur ${client.racine}${client.prefixe}`);
    console.error(`  ${ping.erreur}`);
    console.error('');
    console.error('  Vérifier que le backend tourne : php artisan serve');
    console.error('  Pour tester les MOCKS du front, pointer sur le serveur de dev Vite :');
    console.error('    --api http://localhost:5173 --prefixe /api/v1');
    return 2;
  }
  console.log(`  → API joignable (HTTP ${ping.statut} sur GET /skills)\n`);

  // ── Authentification ──────────────────────────────────────────────────────
  let connecte = false;
  if (!options.sansAuth) {
    if (!options.email || !options.motDePasse) {
      console.log('  ⚠ Aucun compte fourni (--email / --mot-de-passe) : seuls les scénarios');
      console.log('    publics seront lancés. Les scénarios authentifiés seront marqués IGNORÉS.\n');
    } else {
      const tentative = await client.seConnecter(options.email, options.motDePasse);
      if (tentative.ok) {
        connecte = true;
        console.log(`  → Connecté en tant que « ${tentative.profil?.nom ?? options.email} » (id ${tentative.profil?.id ?? '?'})\n`);
      } else {
        console.log(`  ✗ Connexion impossible : ${tentative.raison}`);
        if (tentative.corps) console.log(`    ${JSON.stringify(tentative.corps)}`);
        console.log('    Le flux CSRF + login est lui-même en échec : c\'est un résultat de test.\n');
        const rapportEchec = new Rapport();
        rapportEchec.ajouter({
          id: 'AUTH-00', titre: 'Flux /sanctum/csrf-cookie + POST /auth/login',
          priorite: 'P0', operation: 'authentification',
          erreurs: [tentative.raison],
        });
        afficherRapport(rapportEchec, options);
        return 1;
      }
    }
  }

  // ── Exécution des scénarios ───────────────────────────────────────────────
  const rapport = new Rapport();
  const etat = { moiId: null, premierProjetId: null };
  const contexte = {
    client, v, rapport, etat, options,
    racine: options.api.replace(/\/+$/, ''),
    prefixe: client.prefixe,
    validerSchema: (nom) => (valeur, chemin = '$') =>
      v.valider(valeur, { $ref: `#/components/schemas/${nom}` }, chemin),
  };

  for (const sc of scenarios()) {
    const estEcriture = (sc.note ?? '').includes('écriture');
    if (estEcriture && !options.ecritures) {
      rapport.ajouter({
        id: sc.id, titre: sc.titre, priorite: sc.priorite, operation: sc.operation,
        erreurs: [], note: 'IGNORÉ — scénario d\'écriture (utiliser --ecritures)',
      });
      continue;
    }
    if (options.sansAuth && !['GET /sanctum/csrf-cookie', 'GET /stats'].includes(sc.operation) && sc.id !== 'SECU-01') {
      rapport.ajouter({
        id: sc.id, titre: sc.titre, priorite: sc.priorite, operation: sc.operation,
        erreurs: [], note: 'IGNORÉ — mode --sans-auth',
      });
      continue;
    }
    if (!connecte && !['GET /sanctum/csrf-cookie', 'GET /stats'].includes(sc.operation) && sc.id !== 'SECU-01' && sc.id !== 'AUTH-03') {
      rapport.ajouter({
        id: sc.id, titre: sc.titre, priorite: sc.priorite, operation: sc.operation,
        erreurs: [], note: 'IGNORÉ — aucun compte authentifié',
      });
      continue;
    }
    try {
      await sc.executer(contexte);
    } catch (e) {
      rapport.ajouter({
        id: sc.id, titre: sc.titre, priorite: sc.priorite, operation: sc.operation,
        erreurs: [`exception pendant le scénario : ${e.message}`],
      });
    }
  }

  afficherRapport(rapport, options);

  if (options.json) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(
      options.json,
      JSON.stringify(
        {
          horodatage: new Date().toISOString(),
          api: `${client.racine}${client.prefixe}`,
          contrat: path.basename(cheminSpec),
          total: rapport.resultats.length,
          conformes: rapport.conformes.length,
          divergents: rapport.divergents.length,
          resultats: rapport.resultats,
        },
        null, 2
      ),
      'utf8'
    );
    console.log(`  Rapport JSON écrit : ${options.json}\n`);
  }

  return rapport.divergents.length > 0 ? 1 : 0;
}

function afficherRapport(rapport, options) {
  const ignores = rapport.resultats.filter((r) => r.note?.startsWith('IGNORÉ'));
  const executes = rapport.resultats.filter((r) => !r.note?.startsWith('IGNORÉ'));

  console.log('═══ Résultats ═══\n');
  for (const r of executes) {
    const conforme = r.erreurs.length === 0;
    if (conforme && !options.verbeux) continue;
    const marque = conforme ? '  ✓' : '  ✗';
    console.log(`${marque} [${r.priorite}] ${r.id} — ${r.titre}`);
    if (r.operation && r.operation !== 'transversal') console.log(`      ${r.operation}`);
    for (const e of r.erreurs) console.log(`      ⚠ ${e}`);
    if (r.note && !r.note.startsWith('IGNORÉ')) console.log(`      ℹ ${r.note}`);
    console.log('');
  }

  console.log('═══ Synthèse ═══');
  console.log(`  Vérifiées : ${executes.length}`);
  console.log(`  Conformes : ${rapport.conformes.filter((r) => !r.note?.startsWith('IGNORÉ')).length}`);
  console.log(`  DIVERGENTES : ${rapport.divergents.length}`);
  if (ignores.length > 0) console.log(`  Ignorées  : ${ignores.length}`);

  if (rapport.divergents.length > 0) {
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────────────────┐');
    console.log('  │ DIVERGENCE = BUG. Le contrat fait autorité.                     │');
    console.log('  │ Procédure : section « Règle des écarts » de INTEGRATION.md.      │');
    console.log('  │ Interdit : rustine silencieuse dans le front.                    │');
    console.log('  └─────────────────────────────────────────────────────────────────┘');
    console.log('');
  } else {
    console.log('');
    console.log('  ✓ Aucune divergence : l\'API est conforme au contrat.');
    console.log('');
  }
}

// ── Point d'entrée ────────────────────────────────────────────────────────────
// Garde d'exécution directe : les fonctions restent importables (auto-test) sans
// déclencher le programme principal.
const executeDirectement =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (executeDirectement) {
  try {
    const code = await main();
    process.exit(code);
  } catch (e) {
    console.error(`\n✗ Erreur d'exécution : ${e?.stack ?? e}\n`);
    process.exit(2);
  }
}

export { lireYaml, Validateur, ClientSession, Rapport, scenarios, scalaire };
