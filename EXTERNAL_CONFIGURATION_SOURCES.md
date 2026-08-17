# Sources externes — configuration AITools

## IA intégrée à Chrome

La documentation officielle Chrome indique que les API **Translator**, **Language Detector** et **Summarizer** sont disponibles dans Chrome 138 pour les extensions. Le **Prompt API** est également disponible pour les extensions Chrome à partir de Chrome 138. Les modèles de fondation nécessitent un appareil compatible et peuvent être téléchargés localement lors de la première utilisation ; une fois téléchargés, les appels sont locaux et ne transmettent pas le texte à Google ou à un tiers.

Les API doivent être détectées avant emploi. `Summarizer.availability()` et `LanguageModel.availability()` permettent d’identifier si le modèle est disponible, téléchargeable ou indisponible. La création du modèle doit être déclenchée par une activation utilisateur lorsque le téléchargement est nécessaire.

Sources : [Chrome Built-in AI APIs](https://developer.chrome.com/docs/ai/built-in-apis), [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api), [Chrome Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api).

## Stripe et abonnements

Stripe recommande d’utiliser un endpoint HTTPS de webhook pour les abonnements, de vérifier chaque événement avec le secret de signature et de conserver l’état de l’abonnement côté serveur. Les transitions asynchrones, notamment `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` et `invoice.payment_failed`, doivent être traitées pour maintenir les droits d’accès à jour.

Les webhooks doivent répondre rapidement avec un statut 2xx, et l’endpoint doit utiliser le corps brut ainsi que l’en-tête `Stripe-Signature` pour vérifier l’authenticité des événements. Supabase documente l’usage de fonctions Edge pour gérer les webhooks Stripe signés.

Sources : [Stripe — Receive webhook events](https://docs.stripe.com/webhooks), [Stripe — Subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks), [Supabase — Handling Stripe Webhooks](https://supabase.com/docs/guides/functions/examples/stripe-webhooks).
