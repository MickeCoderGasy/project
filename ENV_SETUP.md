# 🔧 Configuration des Variables d'Environnement

## Vue d'ensemble

Ce document explique comment configurer correctement les variables d'environnement pour faire fonctionner le système de streaming d'interprétation.

## Variables Requises

### 1. Supabase (Obligatoire)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key_ici
```

**Où les trouver ?**
1. Connectez-vous à [Supabase](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans `Settings` > `API`
4. Copiez l'URL et la clé `anon/public`

### 2. Webhook Maestro (Obligatoire)

```bash
EXPO_PUBLIC_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/maestro
```

**Rôle** : Lance l'analyse complète du marché via le workflow Maestro

**Format de l'URL** : `https://[votre-instance-n8n]/webhook/maestro`

### 3. Webhook Get Job Result (Recommandé)

```bash
EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/result
```

**Rôle** : Génère l'interprétation textuelle du signal en streaming

**Format de l'URL** : `https://[votre-instance-n8n]/webhook/result`

⚠️ **IMPORTANT** : Si cette variable n'est pas définie, le streaming d'interprétation sera **désactivé** (pas d'erreur, juste pas d'interprétation affichée).

## Installation

### Étape 1 : Créer le fichier .env

Créez un fichier `.env` à la racine du dossier `project/` :

```bash
cd project
touch .env  # Linux/Mac
# ou créez-le manuellement sous Windows
```

### Étape 2 : Remplir le fichier .env

Copiez et remplissez vos valeurs :

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Webhooks n8n
EXPO_PUBLIC_WEBHOOK_URL=https://votre-instance.app.n8n.cloud/webhook/maestro
EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL=https://votre-instance.app.n8n.cloud/webhook/result
```

### Étape 3 : Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez
npm start
```

## Configuration n8n

### Workflow "Get Job Result"

Pour que le streaming fonctionne, le workflow doit être configuré ainsi :

#### 1. Activer le Workflow

- Dans n8n, ouvrez le workflow "Get Job Result"
- Cliquez sur le bouton **Active** (en haut à droite)
- Le workflow doit être **ON** (vert)

#### 2. Configuration du Webhook

```json
{
  "path": "result",
  "responseMode": "responseNode",
  "method": "POST"
}
```

#### 3. Configuration du nœud AI Agent

**CRUCIAL** : Le streaming doit être activé !

```json
{
  "options": {
    "enableStreaming": true  // ← IMPORTANT !
  }
}
```

#### 4. Tester le Webhook

Testez manuellement dans n8n :

```bash
curl -X POST https://votre-instance.app.n8n.cloud/webhook/result \
  -H "Content-Type: application/json" \
  -d '{"signal_id": "test-id-123"}'
```

Vous devriez voir du texte streamer en retour.

## Vérification de la Configuration

### Tester dans l'Application

1. Lancez une analyse de marché
2. Attendez la fin de l'analyse
3. Vérifiez les logs de la console :

**Si tout fonctionne :**
```
🎯 Démarrage du streaming de l'interprétation pour signal_id: xxx
📡 Appel du webhook: https://...
📊 Réponse du serveur: 200 OK
✅ Streaming de l'interprétation terminé
```

**Si l'URL n'est pas définie :**
```
⚠️ URL du webhook Get Job Result non définie. Streaming d'interprétation désactivé.
```

**Si erreur 404 :**
```
❌ Erreur HTTP 404
Le webhook d'interprétation n'est pas accessible (404). 
Vérifiez que le workflow "Get Job Result" est bien activé.
```

## Dépannage

### Erreur 404 - Webhook introuvable

**Causes possibles :**
1. Le workflow n'est pas activé dans n8n
2. L'URL du webhook est incorrecte
3. Le chemin du webhook ne correspond pas (doit être `/webhook/result`)

**Solutions :**
1. ✅ Activez le workflow dans n8n (bouton Active)
2. ✅ Vérifiez l'URL dans votre fichier `.env`
3. ✅ Vérifiez le chemin dans le nœud Webhook n8n

### Le streaming ne fonctionne pas

**Causes possibles :**
1. `enableStreaming` n'est pas activé dans le nœud AI Agent
2. Le nœud Respond to Webhook ne retourne pas correctement

**Solutions :**
1. ✅ Ajoutez `"enableStreaming": true` dans les options du nœud AI Agent
2. ✅ Vérifiez que le nœud Respond to Webhook est bien configuré

### Erreur réseau / CORS

**Causes possibles :**
1. L'instance n8n n'est pas accessible publiquement
2. Problème de CORS (rare avec n8n)

**Solutions :**
1. ✅ Vérifiez que l'URL n8n est bien accessible depuis votre navigateur
2. ✅ Testez avec `curl` ou Postman pour vérifier

### Variable d'environnement non reconnue

**Causes possibles :**
1. Le fichier `.env` n'est pas à la racine de `project/`
2. Le serveur de développement n'a pas été redémarré
3. Faute de frappe dans le nom de la variable

**Solutions :**
1. ✅ Placez `.env` dans `project/.env` (pas ailleurs)
2. ✅ Redémarrez avec `npm start`
3. ✅ Vérifiez l'orthographe : `EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL`

## Structure du Fichier .env

Voici un exemple de fichier `.env` complet :

```bash
# ============================================
# Supabase
# ============================================
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjM0NTY3OCwiZXhwIjoxOTI3OTIxNjc4fQ.xxxxx

# ============================================
# n8n Webhooks
# ============================================
EXPO_PUBLIC_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/maestro
EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/result
```

## Sécurité

### ⚠️ Important

- **NE JAMAIS** commiter le fichier `.env` dans Git
- Le fichier `.env` est déjà dans `.gitignore`
- Partagez uniquement `.env.example` (sans les vraies clés)

### Vérifier que .env est ignoré

```bash
git status
# .env ne doit PAS apparaître dans la liste
```

## Support

Si vous rencontrez des problèmes :

1. 📝 Vérifiez les logs de la console
2. 🔍 Consultez les logs n8n
3. 🧪 Testez les webhooks manuellement avec `curl`
4. 📖 Relisez ce guide de configuration

## Checklist de Configuration

- [ ] Fichier `.env` créé à `project/.env`
- [ ] Variables Supabase renseignées
- [ ] Variable `EXPO_PUBLIC_WEBHOOK_URL` renseignée
- [ ] Variable `EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL` renseignée
- [ ] Workflow "Get Job Result" activé dans n8n
- [ ] Option `enableStreaming: true` définie dans le nœud AI Agent
- [ ] Serveur de développement redémarré
- [ ] Test d'une analyse réussie
- [ ] Streaming d'interprétation visible dans l'app

---

**Date de création** : 13 octobre 2025  
**Version** : 1.0

