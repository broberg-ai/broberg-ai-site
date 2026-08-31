#!/usr/bin/env bash
# Prøv en post-deploy-ports VENTEBETINGELSE — uden at lave en dårlig udrulning.
#
# Baggrund: en post-deploy-port der venter en fast tid kan nå at måle den FORRIGE
# udgave og melde grønt (broberg-ai-site, 31/8-2026 — se
# docs/features/F005.3-porten-maalte-den-forrige-udgave.md). Rettelsen er at
# vente på PRÆCIS den commit man lige har udgivet. Dette script beviser at den
# ventebetingelse virker i ALLE TRE retninger.
#
# HVORFOR ET SCRIPT OG IKKE BARE EN GRØN CI-KØRSEL: en grøn kørsel hvor løkken
# rammer i første forsøg beviser kun at den kan LÆSE og SAMMENLIGNE. Den beviser
# ikke at den AFVISER en sund men forkert udgave — og det er netop dét en port
# skal kunne. En sleep ville have bestået den samme grønne kørsel.
#
# BRUG:
#   ./scripts/verify-deploy-gate.sh https://dit-site.tld/healthz <forventet-sha>
#
# BESTÅET = A grøn, B rød, C rød. Er B GRØN, er din ventebetingelse et
# helbredstjek forklædt som en identitet: den afslutter på den gamle maskine.

set -uo pipefail
HEALTH="${1:?brug: $0 <health-url> <forventet-sha>}"
SHA="${2:?brug: $0 <health-url> <forventet-sha>}"

# Nøjagtig samme logik som porten, men 3 forsøg à 1s i stedet for 60 à 5s.
proev() {
  local url="$1" forventet="$2" sidst_set="" saa_sha=0 svar live
  for _ in 1 2 3; do
    svar=$(curl -fsS --max-time 10 "$url" || true)
    live=$(printf '%s' "$svar" | jq -r '.sha // empty' 2>/dev/null || true)
    [ -n "$live" ] && saa_sha=1
    if [ "$live" = "$forventet" ]; then echo "EXIT 0 — match ($live)"; return 0; fi
    sidst_set="${live:-<intet sha-felt>}"
    sleep 1
  done
  if [ "$saa_sha" = "0" ]; then
    echo "EXIT 1 — intet sha-felt: appen er for gammel til at melde sin version"
  else
    echo "EXIT 1 — forkert udgave (sidst set $sidst_set, ventede $forventet)"
  fi
  return 1
}

fejl=0
echo "A) rigtig sha — SKAL bestå"
proev "$HEALTH" "$SHA"                        || { echo "   ✗ A fejlede"; fejl=1; }

echo "B) opdigtet sha — SKAL afvise (den vigtigste af de tre)"
proev "$HEALTH" "0000000000000000000000000000000000000000" && { echo "   ✗ B bestod — betingelsen afslutter på den gamle maskine"; fejl=1; }

# C fremstilles ved at pege på en URL der ikke er JSON: jq giver tom streng,
# præcis som en app der ikke kender feltet. Ingen gammel maskine skal graves frem.
echo "C) svar uden sha-felt — SKAL afvise med SIN EGEN besked"
proev "${HEALTH%/*}/" "$SHA"                  && { echo "   ✗ C bestod"; fejl=1; }

[ "$fejl" = "0" ] && echo "BESTÅET: alle tre udgange opfører sig rigtigt." \
                  || echo "FEJLET: se ovenfor."
exit "$fejl"
