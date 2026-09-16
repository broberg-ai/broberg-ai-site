#!/usr/bin/env bash
# Venter på CI-kørslen for DENNE commit — ikke på «den nyeste».
#
# HVORFOR DEN FINDES: `gh run list --limit 1` umiddelbart efter et push giver
# den FORRIGE kørsel, fordi GitHub ikke har registreret den nye endnu. Målt
# 17/9-2026: jeg meldte «CI grøn» på 13925cd mens min egen commit c066abf stod
# som in_progress — og målte derefter produktionen og konkluderede at koden
# ikke virkede. Den gjorde; den var bare ikke ude.
#
# Et grønt flueben for en anden commit er et falsk grønt af den værste slags:
# det peger på et problem der ikke findes, så man leder efter en fejl i noget
# der virker.
set -euo pipefail

sha="$(git rev-parse HEAD)"
kort="${sha:0:7}"

# Kørslen kan mangle et øjeblik efter push. Vent på at DEN dukker op frem for
# at tage en anden.
id=""
for _ in $(seq 1 30); do
  id="$(gh run list --branch main --limit 20 --json databaseId,headSha \
        --jq ".[] | select(.headSha==\"$sha\") | .databaseId" | head -1)"
  [ -n "$id" ] && break
  sleep 2
done

if [ -z "$id" ]; then
  echo "INGEN kørsel fundet for $kort — er commit'en pushet?" >&2
  exit 2
fi

echo "venter på kørsel $id for $kort"
gh run watch "$id" --exit-status
