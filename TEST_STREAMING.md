# 🧪 Guide de Test du Streaming d'Interprétation

## Vue d'ensemble

Une nouvelle fonctionnalité de test a été ajoutée pour tester directement le streaming d'interprétation sans avoir à lancer une analyse complète.

## Configuration

### Variable d'Environnement (Optionnelle)

Ajoutez dans votre `.env` :

```bash
# ID de signal par défaut pour les tests (optionnel)
EXPO_PUBLIC_TEST_SIGNAL_ID=b82490e4-9c0a-482d-b9a0-541d52c08dae
```

**Avantages** :
- ✅ Pré-remplit automatiquement le champ de test
- ✅ Gain de temps pour les tests répétés
- ✅ Utile pour les tests de développement

**Note** : Cette variable est totalement optionnelle. Vous pouvez aussi entrer manuellement un `signal_id` dans l'interface.

## Utilisation

### Configuration Requise

**L'application utilise uniquement la variable d'environnement. Aucune saisie manuelle nécessaire.**

1. **Définissez la variable dans `.env`** :
```bash
EXPO_PUBLIC_TEST_SIGNAL_ID=votre-signal-id-ici
```

2. **Redémarrez le serveur** :
```bash
npm start
```

3. **Dans l'application** :
   - Allez dans l'onglet "Analyse"
   - Ouvrez la section "Configuration Webhook"
   - La section de test apparaît automatiquement (si `EXPO_PUBLIC_TEST_SIGNAL_ID` est défini)
   - Cliquez sur "🧪 Lancer le Test"

4. **Observez le résultat** :
   - L'interface bascule automatiquement vers l'affichage des résultats
   - L'interprétation s'affiche en streaming
   - Le curseur animé montre la progression

## Obtenir un signal_id Valide

### Option 1 : Depuis une Analyse Précédente

1. Lancez une analyse normale
2. Attendez qu'elle se termine
3. Regardez les logs de la console :
```
🎯 Démarrage du streaming pour jobId: b82490e4-9c0a-482d-b9a0-541d52c08dae
```
4. Copiez ce `jobId` et utilisez-le pour les tests

### Option 2 : Depuis Supabase

1. Connectez-vous à votre dashboard Supabase
2. Allez dans la table `workflow_jobs`
3. Copiez un `job_id` d'une analyse réussie (`overall_status = 'completed'`)
4. Utilisez-le dans le champ de test

### Option 3 : Depuis la Table signals_log

1. Connectez-vous à votre dashboard Supabase
2. Allez dans la table `signals_log`
3. Copiez un `signal_id` existant
4. Utilisez-le dans le champ de test

## Interface de Test

### Emplacement

La section de test se trouve dans :
```
Onglet Analyse > Configuration Webhook > 🧪 Test du Streaming d'Interprétation
```

### Composants

1. **Titre** : "🧪 Test du Streaming d'Interprétation"
2. **Description** : "Testez rapidement le webhook avec le signal_id configuré dans .env"
3. **Boîte d'information** : Affiche le `signal_id` configuré dans .env
4. **Bouton de test** : "🧪 Lancer le Test"
5. **Indicateurs** :
   - ⚠️ URL du webhook non définie (si manquante)

**Note** : La section de test ne s'affiche que si `EXPO_PUBLIC_TEST_SIGNAL_ID` est défini dans .env

### États du Bouton

- **Normal** : Bouton vert "🧪 Tester le Streaming"
- **Pendant le streaming** : ActivityIndicator animé
- **Désactivé** : Grisé pendant le streaming

## Flux de Test

```
┌──────────────────────┐
│ Saisir signal_id     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Clic sur le bouton   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Validation du        │
│ signal_id et URL     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Basculement vers     │
│ affichage résultats  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Streaming démarre    │
│ (interprétation)     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Affichage progressif │
│ avec curseur animé   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ ✅ Streaming terminé │
└──────────────────────┘
```

## Vérifications Automatiques

Le bouton de test vérifie automatiquement :

### 1. Signal_id de Test Défini
```typescript
if (!ENV_TEST_SIGNAL_ID || ENV_TEST_SIGNAL_ID.trim() === '') {
  alert('❌ Aucun signal_id de test défini dans .env');
}
```

### 2. URL du Webhook
```typescript
if (!ENV_GET_JOB_RESULT_WEBHOOK_URL) {
  alert('❌ L\'URL du webhook n\'est pas définie');
}
```

## Logs de Console

### Test Réussi

```
🧪 Test du streaming avec signal_id: b82490e4-9c0a-482d-b9a0-541d52c08dae
🎯 Démarrage du streaming de l'interprétation pour signal_id: b82490e4-9c0a-482d-b9a0-541d52c08dae
📡 Appel du webhook: https://qubextai.app.n8n.cloud/webhook/result
📊 Réponse du serveur: 200 OK
✅ Streaming de l'interprétation terminé
```

### Erreur - Signal_id Invalide

```
🧪 Test du streaming avec signal_id: invalid-id
🎯 Démarrage du streaming de l'interprétation pour signal_id: invalid-id
📡 Appel du webhook: https://qubextai.app.n8n.cloud/webhook/result
❌ Erreur HTTP 404: Signal non trouvé
```

### Erreur - Webhook Non Défini

```
Alert: ❌ L'URL du webhook Get Job Result n'est pas définie. Vérifiez votre fichier .env
```

## Dépannage

### Erreur 404 - Signal Introuvable

**Cause** : Le `signal_id` n'existe pas dans la base de données

**Solution** :
1. Vérifiez que le `signal_id` existe dans Supabase
2. Lancez une analyse complète pour générer un nouveau signal
3. Utilisez le `job_id` de cette analyse

### Alerte - signal_id Vide

**Cause** : Aucun `signal_id` n'a été saisi

**Solution** :
1. Entrez un `signal_id` valide dans le champ
2. Ou définissez `EXPO_PUBLIC_TEST_SIGNAL_ID` dans `.env`

### Alerte - Webhook Non Défini

**Cause** : La variable `EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL` n'est pas dans `.env`

**Solution** :
1. Ajoutez la variable dans votre `.env` :
```bash
EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/result
```
2. Redémarrez le serveur

### Pas de Streaming Visible

**Cause** : Le workflow n8n n'a pas le streaming activé

**Solution** :
1. Ouvrez le workflow "Get Job Result" dans n8n
2. Dans le nœud AI Agent, vérifiez :
```json
{
  "options": {
    "enableStreaming": true
  }
}
```
3. Sauvegardez et réactivez le workflow

## Exemple de Fichier .env Complet

```bash
# ============================================
# Supabase
# ============================================
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# Webhooks n8n
# ============================================
EXPO_PUBLIC_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/maestro
EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/result

# ============================================
# Test du Streaming (Optionnel)
# ============================================
# Pré-remplit le champ de test avec ce signal_id
EXPO_PUBLIC_TEST_SIGNAL_ID=b82490e4-9c0a-482d-b9a0-541d52c08dae
```

## Cas d'Usage

### 1. Développement

Testez rapidement les modifications du prompt Qubext sans relancer une analyse complète :

```bash
# Dans .env
EXPO_PUBLIC_TEST_SIGNAL_ID=mon-signal-de-test

# Modifiez le prompt dans n8n
# Cliquez sur "🧪 Tester le Streaming"
# Observez la nouvelle interprétation
```

### 2. Débogage

Identifiez les problèmes de streaming :

```bash
# Testez avec différents signal_id
# Vérifiez les logs de la console
# Comparez avec les données Supabase
```

### 3. Démonstration

Montrez la fonctionnalité de streaming sans attendre une analyse :

```bash
# Utilisez un signal_id avec un bon résultat
# Montrez l'animation typewriter en action
# Expliquez l'interprétation de Qubext
```

## Bonnes Pratiques

### ✅ À Faire

- Utilisez des `signal_id` d'analyses réussies (`overall_status = 'completed'`)
- Vérifiez les logs de console pour le débogage
- Testez avec différents types de signaux (BUY/SELL/HOLD)
- Gardez un `signal_id` par défaut dans `.env` pour les tests rapides

### ❌ À Éviter

- N'utilisez pas de `signal_id` inexistants
- Ne testez pas pendant qu'une analyse est en cours
- Ne laissez pas le champ vide si pas de valeur par défaut
- N'oubliez pas de redémarrer après modification de `.env`

## Avantages de cette Fonctionnalité

1. **⚡ Gain de temps** : Pas besoin de lancer une analyse complète
2. **🧪 Tests rapides** : Itération rapide sur le prompt de Qubext
3. **🔍 Débogage** : Identification facile des problèmes
4. **📱 Démonstration** : Montrez le streaming sans attendre
5. **🎯 Ciblé** : Testez uniquement la partie interprétation

## Support

Si vous rencontrez des problèmes :

1. Vérifiez que le `signal_id` existe dans Supabase
2. Vérifiez que le webhook est activé dans n8n
3. Consultez les logs de la console pour les détails
4. Relisez `QUICK_FIX_404.md` pour les erreurs 404
5. Consultez `ENV_SETUP.md` pour la configuration complète

---

**Date de création** : 13 octobre 2025  
**Version** : 1.0

