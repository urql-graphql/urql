---
'@urql/core': minor
---

Fixes an issue where `addMetadata` calls were stripped in production mode, ensuring consistent metadata availability (e.g., `cacheOutcome`) in both development and production environments
