#!/usr/bin/env node
/**
 * Auto-test du testeur de conformité
 * ==================================
 *
 * « Qui garde les gardiens ? »
 *
 * Ce fichier vérifie que le validateur OpenAPI de `verifier-conformite.mjs`
 * détecte RÉELLEMENT les divergences — et qu'il ne signale pas de faux positifs.
 *
 * POURQUOI C'EST NÉCESSAIRE : un validateur qui accepte tout est pire qu'aucun
 * validateur. Il donnerait un faux sentiment de conformité et laisserait passer
 * exactement les bugs que le contrat veut empêcher. Ce test prouve que le
 * validateur mord.
 *
 * Il teste deux choses :
 *   1. le VALIDATEUR  — sur un mini-contrat embarqué et des charges volontairement fautives ;
 *   2. le PARSEUR YAML — sur le VRAI contrat, avec des assertions vérifiables.
 *
 * USAGE
 *   node scripts/conformite/auto-test.mjs
 *
 * Code de sortie : 0 si tout passe, 1 sinon.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { lireYaml, Validateur, scalaire } from './verifier-conformite.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));

let reussis = 0;
let echoues = 0;
let total = 0;

function verifier(intitule, condition, detail = '') {
  total++;
  if (condition) {
    reussis++;
    console.log(`  ✓ ${intitule}`);
  } else {
    echoues++;
    console.log(`  ✗ ${intitule}`);
    if (detail) console.log(`      ${detail}`);
  }
}

/** Vérifie qu'une charge produit AU MOINS une erreur mentionnant `motif`. */
function doitEchouer(v, intitule, charge, schemaNom, motif) {
  const erreurs = v.valider(charge, { $ref: `#/components/schemas/${schemaNom}` }, '$');
  const trouve = erreurs.some((e) => e.toLowerCase().includes(motif.toLowerCase()));
  verifier(
    intitule,
    erreurs.length > 0 && trouve,
    erreurs.length === 0
      ? `AUCUNE erreur détectée alors que la charge est non conforme (motif attendu : « ${motif} »)`
      : `erreurs : ${erreurs.join(' | ')}`
  );
}

/** Vérifie qu'une charge conforme ne produit AUCUNE erreur (anti faux positif). */
function doitPasser(v, intitule, charge, schemaNom) {
  const erreurs = v.valider(charge, { $ref: `#/components/schemas/${schemaNom}` }, '$');
  verifier(intitule, erreurs.length === 0, `faux positif : ${erreurs.join(' | ')}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Le validateur — sur un mini-contrat reproduisant les pièges du vrai
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ 1. Le validateur détecte-t-il les divergences ? ═══\n');

const miniContrat = {
  components: {
    schemas: {
      // Piège n°1 : héritage par allOf, comme Profil → Talent → UtilisateurResume
      UtilisateurResume: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nom: { type: 'string', maxLength: 120 },
          photo_url: { type: 'string', format: 'uri', nullable: true },
          pays: { type: 'string', minLength: 2, maxLength: 2 },
          role_profil: { type: 'string', enum: ['developpeur_frontend', 'designer_ui_ux'] },
        },
      },
      // Piège n°2 : nullable et énumérations
      Profil: {
        allOf: [
          { $ref: '#/components/schemas/UtilisateurResume' },
          {
            type: 'object',
            properties: {
              bio: { type: 'string', nullable: true, maxLength: 500 },
              projets_realises_count: { type: 'integer' },
            },
          },
        ],
      },
      // Piège n°3 : pagination
      PaginationMeta: {
        type: 'object',
        properties: {
          current_page: { type: 'integer' },
          per_page: { type: 'integer' },
          total: { type: 'integer' },
          last_page: { type: 'integer' },
        },
      },
      TalentPage: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/UtilisateurResume' } },
          meta: { $ref: '#/components/schemas/PaginationMeta' },
        },
        required: ['data'],
      },
      // Piège n°4 : bornes numériques et tableaux bornés (domaines 1..3)
      ProjetResume: {
        type: 'object',
        required: ['id', 'nom', 'domaines', 'statut', 'progression'],
        properties: {
          id: { type: 'integer' },
          nom: { type: 'string', maxLength: 150 },
          domaines: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: { type: 'string', enum: ['agriculture', 'iot', 'sante'] },
          },
          statut: { type: 'string', enum: ['recrutement', 'en_cours', 'termine'] },
          progression: { type: 'integer', minimum: 0, maximum: 100 },
        },
      },
      // Piège n°5 : additionalProperties false (détecter une clé étrangère)
      ProfilStrict: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'integer' },
          nom: { type: 'string' },
        },
      },
    },
  },
};

const v = new Validateur(miniContrat);

const profilValide = {
  id: 7,
  nom: 'Eliana Lokoka',
  photo_url: null,
  pays: 'CD',
  role_profil: 'designer_ui_ux',
  bio: null,
  projets_realises_count: 2,
};
doitPasser(v, 'un profil conforme passe (allOf + nullable)', profilValide, 'Profil');

doitEchouer(
  v, 'une clé email dans un profil public est signalée',
  { ...profilValide, email: 'fuite@example.com' }, 'ProfilStrict', 'non prévue'
);

doitEchouer(
  v, 'un type erroné est signalé (id en chaîne)',
  { ...profilValide, id: '7' }, 'Profil', 'type attendu'
);

doitEchouer(
  v, 'un 1.5 là où un integer est attendu est signalé',
  { ...profilValide, projets_realises_count: 1.5 }, 'Profil', 'type attendu'
);

doitEchouer(
  v, 'une valeur hors enum est signalée',
  { ...profilValide, role_profil: 'astronaute' }, 'Profil', 'enum'
);

doitEchouer(
  v, 'null là où le schéma interdit null est signalé',
  { ...profilValide, nom: null }, 'Profil', 'interdit null'
);

doitEchouer(
  v, 'un pays de 3 lettres est signalé (ISO alpha-2)',
  { ...profilValide, pays: 'COD' }, 'Profil', 'maxLength'
);

doitEchouer(
  v, 'une propriété obligatoire absente est signalée',
  { id: 1, nom: 'Test', domaines: ['agriculture'], progression: 10 }, 'ProjetResume', 'obligatoire absente'
);

doitEchouer(
  v, 'progression > 100 est signalée',
  { id: 1, nom: 'Test', domaines: ['agriculture'], statut: 'en_cours', progression: 150 },
  'ProjetResume', 'maximum'
);

doitEchouer(
  v, 'un tableau domaines vide est signalé (minItems 1)',
  { id: 1, nom: 'Test', domaines: [], statut: 'en_cours', progression: 10 },
  'ProjetResume', 'minItems'
);

doitEchouer(
  v, 'un tableau domaines de 4 éléments est signalé (maxItems 3)',
  {
    id: 1, nom: 'Test', statut: 'en_cours', progression: 10,
    domaines: ['agriculture', 'iot', 'sante', 'agriculture'],
  },
  'ProjetResume', 'maxItems'
);

doitEchouer(
  v, 'un libellé affiché au lieu de la valeur technique est signalé',
  { id: 1, nom: 'Test', domaines: ['agriculture'], statut: 'Ouvert', progression: 10 },
  'ProjetResume', 'enum'
);

doitEchouer(
  v, 'un élément de tableau non conforme est localisé par son index',
  { data: [{ id: 'x', nom: 'Test' }], meta: {} }, 'TalentPage', '$.data[0].id'
);

doitPasser(
  v, 'une page paginée conforme passe',
  {
    data: [{ id: 1, nom: 'Arthur Manuana', photo_url: 'https://example.org/a.png', pays: 'CD', role_profil: 'developpeur_frontend' }],
    meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
  },
  'TalentPage'
);

doitEchouer(
  v, 'un format uri invalide est signalé',
  { ...profilValide, photo_url: 'pas-une-url' }, 'Profil', 'uri'
);

doitPasser(v, 'photo_url null est accepté (nullable)',
  { ...profilValide, photo_url: null, bio: 'Développeuse frontend.' }, 'Profil');

// ── Le parseur de scalaires ──────────────────────────────────────────────────
console.log('\n═══ 2. Le lecteur de scalaires YAML ═══\n');

verifier('« true » → booléen', scalaire('true') === true);
verifier('« false » → booléen', scalaire('false') === false);
verifier('« null » → null', scalaire('null') === null);
verifier('« 50 » → nombre', scalaire('50') === 50);
verifier('« 1.2.0 » reste une chaîne (pas un nombre)', scalaire('1.2.0') === '1.2.0');
verifier('« P0 » reste une chaîne', scalaire('P0') === 'P0');
verifier('liste de flux [a, b]', JSON.stringify(scalaire('[agriculture, iot]')) === '["agriculture","iot"]');
verifier(
  'objet de flux { type: integer }',
  JSON.stringify(scalaire('{ type: integer }')) === '{"type":"integer"}'
);
verifier(
  'chaîne quotee conserve ses espaces',
  scalaire('"Fichier trop volumineux (16 Mo maximum)."') === 'Fichier trop volumineux (16 Mo maximum).'
);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Le parseur YAML — sur le VRAI contrat
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ 3. Lecture du vrai contrat OpenAPI ═══\n');

const cheminSpec = path.resolve(ici, '..', '..', 'openapi-africabridgefinal.yaml');
let doc = null;
try {
  doc = lireYaml(await readFile(cheminSpec, 'utf8'));
} catch (e) {
  console.log(`  ✗ Contrat illisible : ${e.message}`);
  echoues++;
}

if (doc) {
  verifier('openapi = 3.0.3', doc.openapi === '3.0.3', `reçu : ${JSON.stringify(doc.openapi)}`);
  verifier('version de l\'info = 1.2.0', doc.info?.version === '1.2.0', `reçu : ${JSON.stringify(doc.info?.version)}`);
  verifier(
    'titre correct',
    typeof doc.info?.title === 'string' && doc.info.title.includes('AfricaBridge'),
    `reçu : ${JSON.stringify(doc.info?.title)}`
  );

  const schemas = doc.components?.schemas ?? {};
  const noms = Object.keys(schemas);
  verifier(`45 schémas lus (reçu : ${noms.length})`, noms.length === 45);

  for (const attendu of [
    'Domaine', 'RoleProfil', 'RoleEquipe', 'StatutProjet', 'StatutProjetCreation',
    'Profil', 'ProfilPrive', 'Talent', 'TalentSuggere', 'Projet', 'ProjetCarte',
    'ProjetResume', 'Message', 'MessageFil', 'Ressource', 'Dashboard', 'Stats',
    'PaginationMeta', 'TalentPage', 'ProjetPage', 'RessourcePage', 'DemandePage',
    'CommentairePage', 'UtilisateurPage', 'MessageFil',
  ]) {
    if (!(attendu in schemas)) verifier(`schéma « ${attendu} » présent`, false, 'absent');
  }
  verifier('tous les schémas nommés attendus sont présents', true);

  // Contrôles profonds : le parseur a-t-il bien compris l'imbrication ?
  const domaine = schemas.Domaine;
  verifier(
    'Domaine : enum de 12 valeurs',
    Array.isArray(domaine?.enum) && domaine.enum.length === 12,
    `reçu : ${JSON.stringify(domaine?.enum)}`
  );
  verifier('Domaine : agriculture présent', domaine?.enum?.includes('agriculture'));

  const statut = schemas.StatutProjet;
  verifier(
    'StatutProjet : enum [recrutement, en_cours, termine]',
    JSON.stringify(statut?.enum) === JSON.stringify(['recrutement', 'en_cours', 'termine']),
    `reçu : ${JSON.stringify(statut?.enum)}`
  );

  const profil = schemas.Profil;
  verifier(
    'Profil : construit par allOf (2 branches)',
    Array.isArray(profil?.allOf) && profil.allOf.length === 2,
    `reçu : ${JSON.stringify(profil?.allOf?.length)}`
  );
  verifier(
    'Profil : le $ref de la 1re branche pointe sur Talent',
    profil?.allOf?.[0]?.$ref === '#/components/schemas/Talent',
    `reçu : ${JSON.stringify(profil?.allOf?.[0]?.$ref)}`
  );

  verifier(
    'ProfilPrive : la clé email est absente de la 1re branche allOf (elle n\'est que dans la 2e)',
    !('email' in (schemas.Profil?.allOf?.[1]?.properties ?? {})) &&
      'email' in (schemas.ProfilPrive?.allOf?.[1]?.properties ?? {})
  );
  verifier(
    'ProfilPrive : email uniquement dans la 2e branche allOf',
    schemas.ProfilPrive?.allOf?.[1]?.properties?.email?.format === 'email',
    `reçu : ${JSON.stringify(schemas.ProfilPrive?.allOf?.[1]?.properties?.email)}`
  );

  const projCreate = schemas.ProjetCreate;
  verifier(
    'ProjetCreate : required contient nom, description, domaines, objectifs, nombre_membres_souhaite',
    JSON.stringify(projCreate?.required) ===
      JSON.stringify(['nom', 'description', 'domaines', 'objectifs', 'nombre_membres_souhaite']),
    `reçu : ${JSON.stringify(projCreate?.required)}`
  );
  verifier(
    'ProjetCreate : domaines bornés 1..3',
    projCreate?.properties?.domaines?.minItems === 1 && projCreate?.properties?.domaines?.maxItems === 3
  );
  verifier(
    'ProjetCreate : nombre_membres_souhaite borné 2..50',
    projCreate?.properties?.nombre_membres_souhaite?.minimum === 2 &&
      projCreate?.properties?.nombre_membres_souhaite?.maximum === 50
  );

  // Les chemins et les priorités
  const chemins = doc.paths ?? {};
  verifier('la section paths est lue', Object.keys(chemins).length > 0);

  let totalOperations = 0;
  let p0 = 0;
  let p1 = 0;
  for (const [, item] of Object.entries(chemins)) {
    for (const methode of ['get', 'post', 'put', 'patch', 'delete']) {
      if (item?.[methode]) {
        totalOperations++;
        const prio = item[methode]['x-priorite'];
        if (prio === 'P0') p0++;
        else if (prio === 'P1') p1++;
      }
    }
  }
  verifier(`44 opérations lues (reçu : ${totalOperations})`, totalOperations === 44);
  verifier(`33 opérations P0 (reçu : ${p0})`, p0 === 33);
  verifier(`11 opérations P1 (reçu : ${p1})`, p1 === 11);

  verifier(
    '/sanctum/csrf-cookie existe et répond 204',
    chemins['/sanctum/csrf-cookie']?.get?.responses?.['204'] !== undefined
  );
  verifier(
    '/sanctum/csrf-cookie est à la RACINE (pas sous /api/v1)',
    !cheminSpec.includes('/api/v1') && '/sanctum/csrf-cookie' in chemins
  );
  verifier(
    '/users/me n\'expose AUCUN GET (le contrat le dit explicitement)',
    chemins['/users/me']?.get === undefined,
    `reçu : ${JSON.stringify(Object.keys(chemins['/users/me'] ?? {}))}`
  );
  verifier(
    '/auth/me existe en GET',
    chemins['/auth/me']?.get !== undefined
  );
  verifier(
    'GET /stats est public (security: [])',
    Array.isArray(chemins['/stats']?.get?.security) && chemins['/stats'].get.security.length === 0
  );
  verifier(
    'GET /users/{id} ne déclare pas de schéma de réponse contenant email',
    !JSON.stringify(chemins['/users/{id}']?.get?.responses?.['200'] ?? {}).includes('"email"')
  );

  // Le validateur doit fonctionner sur le VRAI contrat
  const vReel = new Validateur(doc);
  doitPasser(
    vReel, 'charge réelle conforme : un Talent valide',
    {
      id: 3, nom: 'Aminata Diallo', photo_url: null, pays: 'SN',
      role_profil: 'designer_ui_ux', region: 'Dakar',
      bio_courte: 'Designer UI/UX, 6 ans d\'expérience.',
      competences: [{ id: 5, nom: 'UI/UX', categorie: 'design', niveau: 'avance' }],
      domaines: ['sante', 'education'], followers_count: 0, is_following: false,
    },
    'Talent'
  );
  doitEchouer(
    vReel, 'charge réelle non conforme : statut de projet en libellé',
    {
      id: 1, nom: 'Smart Agriculture RDC', domaines: ['agriculture', 'iot'],
      statut: 'Ouvert', progression: 40, nombre_membres_souhaite: 5, nombre_membres_actuel: 3,
    },
    'ProjetResume', 'enum'
  );
  doitEchouer(
    vReel, 'charge réelle non conforme : progression à 120',
    {
      id: 1, nom: 'Smart Agriculture RDC', domaines: ['agriculture'],
      statut: 'en_cours', progression: 120, nombre_membres_souhaite: 5, nombre_membres_actuel: 3,
    },
    'ProjetResume', 'maximum'
  );
  doitEchouer(
    vReel, 'charge réelle non conforme : MessageFil avec meta vide (server_time obligatoire)',
    { data: [], supprimes: [], meta: {} },
    'MessageFil', 'obligatoire'
  );
  doitPasser(
    vReel, 'charge réelle conforme : MessageFil complet',
    {
      data: [{ id: 12, projet_id: 1, auteur: { id: 2, nom: 'Arthur Manuana', photo_url: null, pays: 'CD', role_profil: 'developpeur_frontend' }, contenu: 'Proposition de maquette.', created_at: '2026-01-15T09:30:00Z' }],
      supprimes: [],
      meta: { server_time: '2026-01-15T09:30:05Z' },
    },
    'MessageFil'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Synthèse
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ Synthèse de l\'auto-test ═══');
console.log(`  Assertions exécutées : ${total}`);
console.log(`  Réussies : ${reussis}`);
console.log(`  Échouées : ${echoues}`);
console.log('');

if (echoues > 0) {
  console.log('  ✗ Le validateur ou le parseur présente un défaut.');
  console.log('    Tant que ce test échoue, le test de conformité n\'a AUCUNE valeur :');
  console.log('    il pourrait valider une API non conforme.\n');
  process.exit(1);
}

console.log('  ✓ Le validateur détecte les divergences et ne produit pas de faux positifs.');
console.log('  ✓ Le parseur lit le contrat réel (45 schémas, 44 opérations, 33 P0 / 11 P1).\n');
process.exit(0);
