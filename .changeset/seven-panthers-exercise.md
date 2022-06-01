---
'@urql/exchange-graphcache': patch
---

Keep track of mutations in the offline exchange so we can accurately recreate the original variables, there could be more variables for use in updater functions which we strip away in graphCache before sending to the API
