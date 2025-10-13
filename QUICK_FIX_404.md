# 🚨 Résolution Rapide - Erreur 404 Webhook

## Problème Actuel

```
ERROR  ❌ Erreur lors du streaming de l'interprétation: [Error: Erreur HTTP 404]
```

## Cause

Le webhook `Get Job Result` retourne une erreur 404, ce qui signifie :
- ❌ Le workflow n'est pas activé dans n8n
- ❌ L'URL du webhook est incorrecte
- ❌ La variable d'environnement n'est pas définie

## Solution Rapide

### Option 1 : Définir la Variable d'Environnement

1. **Ouvrez votre fichier `.env`** (dans `project/.env`)

2. **Ajoutez cette ligne** :
```bash
EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/result
```

3. **Remplacez l'URL** par votre propre URL n8n si différente

4. **Redémarrez le serveur** :
```bash
# Appuyez sur Ctrl+C pour arrêter
npm start
```

### Option 2 : Activer le Workflow dans n8n

1. **Connectez-vous à n8n** : https://qubextai.app.n8n.cloud

2. **Ouvrez le workflow "Get Job Result"**

3. **Cliquez sur le bouton "Active"** (en haut à droite)
   - Le bouton doit devenir **VERT** (ON)
   - Si déjà vert, désactivez puis réactivez

4. **Vérifiez le chemin du webhook** :
   - Ouvrez le nœud "Webhook"
   - Le chemin doit être : `result`
   - L'URL complète sera : `https://[votre-instance]/webhook/result`

5. **Testez le webhook** :
```bash
curl -X POST https://qubextai.app.n8n.cloud/webhook/result \
  -H "Content-Type: application/json" \
  -d '{"signal_id": "test-123"}'
```

### Option 3 : Désactiver le Streaming (temporaire)

Si vous voulez juste que l'app fonctionne sans l'interprétation :

1. **Commentez la ligne dans `.env`** :
```bash
# EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/result
```

2. **Redémarrez le serveur**

3. **Résultat** : L'app fonctionnera normalement, mais sans afficher l'interprétation de Qubext

## Vérification

### Logs Attendus (Succès)

```
🎯 Démarrage du streaming de l'interprétation pour signal_id: xxx
📡 Appel du webhook: https://qubextai.app.n8n.cloud/webhook/result
📊 Réponse du serveur: 200 OK
✅ Streaming de l'interprétation terminé
```

### Logs Attendus (Webhook Non Défini)

```
⚠️ URL du webhook Get Job Result non définie. Streaming d'interprétation désactivé.
```

## Checklist de Dépannage

- [ ] Le fichier `.env` existe dans `project/.env`
- [ ] La variable `EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL` est définie
- [ ] L'URL du webhook est correcte
- [ ] Le workflow "Get Job Result" est activé dans n8n (bouton VERT)
- [ ] Le serveur de développement a été redémarré
- [ ] Testez manuellement le webhook avec `curl`

## Exemple de Fichier .env Complet

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_clé_ici

# Webhooks
EXPO_PUBLIC_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/maestro
EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/result
```

## Besoin d'Aide ?

1. Vérifiez les logs n8n pour voir si le webhook reçoit bien la requête
2. Vérifiez que le workflow contient bien tous les nœuds requis
3. Consultez `ENV_SETUP.md` pour une configuration détaillée

---

**Astuce** : Si vous ne voulez pas utiliser le streaming d'interprétation pour l'instant, il suffit de ne pas définir la variable `EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL`. L'app fonctionnera normalement sans cette fonctionnalité.

