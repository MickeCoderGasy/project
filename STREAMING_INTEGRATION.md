# 🎯 Intégration du Streaming d'Interprétation des Signaux

## Vue d'ensemble

Ce document explique l'intégration du système de streaming d'interprétation des signaux de trading après l'analyse. Le système utilise le workflow n8n "Get Job Result" pour streamer en temps réel l'interprétation générée par l'IA agent Qubext.

## Architecture

### Flux de Données

```
┌─────────────────┐
│  Utilisateur    │
│  Lance Analyse  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Maestro Workflow       │
│  (Analyse de marché)    │
└────────┬────────────────┘
         │
         │ jobId généré
         ▼
┌─────────────────────────┐
│  Supabase DB            │
│  (workflow_jobs table)  │
└────────┬────────────────┘
         │
         │ Analyse terminée
         ▼
┌─────────────────────────┐
│  Get Job Result         │
│  (Streaming webhook)    │
└────────┬────────────────┘
         │
         │ Stream de texte
         ▼
┌─────────────────────────┐
│  Interface Utilisateur  │
│  (Animation typewriter) │
└─────────────────────────┘
```

## Configuration

### 1. Variables d'Environnement

Ajoutez cette variable dans votre fichier `.env` :

```bash
# Webhook pour l'interprétation du signal (optionnel)
# Si non défini, utilise l'URL par défaut
EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL=https://qubextai.app.n8n.cloud/webhook/result
```

**Note**: Cette variable est optionnelle. Si elle n'est pas définie, le système utilise l'URL par défaut.

### 2. Workflow n8n "Get Job Result"

Le workflow doit être configuré avec :
- **URL webhook** : `/webhook/result`
- **Méthode** : `POST`
- **Entrée** : `{ "signal_id": "job_id_here" }`
- **Sortie** : Streaming de texte (réponse de l'IA agent)

#### Structure du Workflow

1. **Webhook** : Reçoit le `signal_id` (jobId)
2. **Get a row (Supabase)** : Récupère les données du signal depuis `signals_log`
3. **AI Agent (Gemini)** : Génère l'interprétation avec streaming activé
4. **Respond to Webhook** : Retourne le stream de texte

## Fonctionnalités Implémentées

### 1. Streaming en Temps Réel

```typescript
// La fonction streamSignalInterpretation gère le streaming
const streamSignalInterpretation = async (signalId: string) => {
  // Appel au webhook avec le signal_id
  const response = await fetch(ENV_GET_JOB_RESULT_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signal_id: signalId }),
  });

  // Lecture du stream en temps réel
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  // Accumulation et affichage progressif
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    accumulatedText += chunk;
    setInterpretationText(accumulatedText);
  }
};
```

### 2. Interface Utilisateur

#### Section d'Interprétation

- **Container avec bordure bleue** et effet de shadow
- **Header** avec titre "🤖 Qubext - Interprétation du Signal"
- **Indicateur de streaming** : ActivityIndicator + texte "Streaming en cours..."
- **Zone de texte scrollable** : Hauteur max 400px
- **Curseur clignotant** : `▋` pendant le streaming
- **Indicateur de complétion** : CheckCircle + "Interprétation complète"

#### Positionnement

L'interprétation s'affiche **en premier** après l'analyse, avant les résultats détaillés :

```jsx
{showAnalysis ? (
  <ScrollView>
    {showInterpretation && renderInterpretation()}
    <AnalysisResultDisplay analysisResult={analysisResult} />
  </ScrollView>
) : (
  renderConfiguration()
)}
```

### 3. Gestion des États

```typescript
// États pour l'interprétation
const [isStreamingInterpretation, setIsStreamingInterpretation] = useState(false);
const [interpretationText, setInterpretationText] = useState<string>('');
const [interpretationComplete, setInterpretationComplete] = useState(false);
const [showInterpretation, setShowInterpretation] = useState(false);
```

## Déclenchement Automatique

Le streaming de l'interprétation est déclenché automatiquement lorsque l'analyse est terminée :

### Via Polling

```typescript
if (newRecord.overall_status === 'completed') {
  setAnalysisResult(newRecord.final_result);
  setShowAnalysis(true);
  setIsLoading(false);
  stopTypewriterAnimation();
  
  // 🎯 Déclenchement du streaming
  if (jobId) {
    streamSignalInterpretation(jobId);
  }
}
```

### Via Realtime

```typescript
if (newRecord.overall_status === 'completed') {
  setAnalysisResult(newRecord.final_result);
  setShowAnalysis(true);
  setIsLoading(false);
  stopTypewriterAnimation();
  
  // 🎯 Déclenchement du streaming
  if (jobId) {
    streamSignalInterpretation(jobId);
  }
}
```

## Prompt de l'IA Agent Qubext

L'IA agent utilise deux prompts selon le contexte :

### PROMPT 1 : Absence de Signal

Explique pourquoi aucun signal n'est recommandé :
- Score de confluence < 70/100
- Analyses contradictoires
- Risque événementiel élevé
- Niveaux techniques sous surveillance

### PROMPT 2 : Signal Détecté

Fournit un plan d'action détaillé :
- Type de signal (Buy/Sell)
- Score de confluence (> 70/100)
- Point d'entrée suggéré
- Objectif de profit (Take Profit)
- Niveau de Stop-Loss
- Explication technique accessible

## Design et Style

### Couleurs

- **Bordure** : `#60A5FA` (Bleu)
- **Background** : `#1E293B` (Gris foncé)
- **Header** : `#334155` (Gris moyen)
- **Texte** : `#E2E8F0` (Gris clair)
- **Curseur** : `#60A5FA` (Bleu)
- **Complétion** : `#34D399` (Vert)

### Typographie

- **Titre** : 18px, bold, couleur bleue
- **Texte** : 16px, lineHeight 26px, justifié
- **Curseur** : 20px, bold

### Effets

- **Shadow** : `shadowColor: '#60A5FA'`, opacity 0.3, radius 8
- **Elevation** : 8 (Android)
- **Border** : 2px solid `#60A5FA`

## Gestion des Erreurs

### Erreurs de Streaming

```typescript
try {
  // Streaming logic
} catch (error: any) {
  console.error('❌ Erreur lors du streaming:', error);
  setIsStreamingInterpretation(false);
  setInterpretationText(`Erreur: ${error.message}`);
}
```

### Vérifications

- ✅ Vérification du support du streaming (`response.body`)
- ✅ Gestion des erreurs HTTP
- ✅ Décodage UTF-8 des chunks
- ✅ Cleanup automatique des états

## Reset de l'État

Lors de l'annulation ou du reset de l'analyse :

```typescript
const resetAnalysisState = () => {
  // ... autres resets
  setIsStreamingInterpretation(false);
  setInterpretationText('');
  setInterpretationComplete(false);
  setShowInterpretation(false);
};
```

## Performance

### Optimisations

1. **Streaming natif** : Utilise l'API native `ReadableStream`
2. **Décodage progressif** : `TextDecoder` avec option `stream: true`
3. **Updates optimisés** : Mise à jour de l'état uniquement lors de nouveaux chunks
4. **ScrollView imbriqué** : `nestedScrollEnabled={true}` pour performances

### Limitations

- Le streaming peut ne pas fonctionner sur tous les environnements (vérification avec `response.body`)
- Temps de réponse variable selon la longueur de l'interprétation
- Nécessite une connexion réseau stable

## Testing

### Scénarios de Test

1. ✅ Streaming normal avec signal détecté
2. ✅ Streaming avec absence de signal
3. ✅ Gestion d'erreur réseau
4. ✅ Annulation pendant le streaming
5. ✅ Reset après complétion

### Logs de Debugging

```typescript
console.log('🎯 Démarrage du streaming pour jobId:', jobId);
console.log('✅ Streaming de l\'interprétation terminé');
console.error('❌ Erreur lors du streaming:', error);
```

## Maintenance

### Points d'Attention

1. **URL du webhook** : Vérifier que l'URL est accessible
2. **Format de réponse** : S'assurer que le workflow retourne du texte brut
3. **Timeout** : Gérer les timeouts de connexion
4. **Logs Supabase** : Vérifier que les données sont bien enregistrées dans `signals_log`

### Évolutions Futures

- [ ] Support de markdown dans l'interprétation
- [ ] Possibilité de régénérer l'interprétation
- [ ] Sauvegarde de l'interprétation dans la base de données
- [ ] Partage de l'interprétation (export PDF/texte)
- [ ] Historique des interprétations
- [ ] Notation de la qualité de l'interprétation

## Documentation Technique

### Fichiers Modifiés

- `project/app/(tabs)/analyse.tsx` : Logique principale et UI
- `project/env.d.ts` : Déclaration de la variable d'environnement
- `workflow/Get Job Result.json` : Workflow n8n pour le streaming

### Dépendances

- React Native `ReadableStream` API
- `TextDecoder` pour le décodage UTF-8
- Supabase pour le stockage des signaux

---

**Date de création** : 13 octobre 2025  
**Auteur** : Assistant IA  
**Version** : 1.0

