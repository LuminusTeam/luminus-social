# Roller och dagliga rutiner i Luminus Loom

## Moderering och säkerhet (beslut B-060, moderator bekräftad 2026-11-02)
- **Kwame Mensah (DevOps och säkerhet, Myceliet)** ansvarar för det tekniska skyddet: skräp, spam, robotar, överbelastning, nycklar och åtkomst. Rate limit på alla skrivningar, inga nycklar i klienten, Row Level Security i databasen.
- **Bjarke (teamlead Barken)** är plattformens moderator (bekräftad av Mattias). Barken granskar flaggade inlägg, kommentarer och meddelanden och avgör om de ska döljas, behållas eller tas bort.
- Flaggade eller dolda inlägg får status `dold` (inte raderade) med skäl och tid i fältet `moderering`, så att beslutet går att följa.
- Varje besökare kan flagga ett inlägg. Tre flaggor från olika besökare döljer inlägget tills Barken har sett det.
- Regler: inga personuppgifter om verkliga personer, ingen reklam, inget hat, inga hot. Barken får stoppa leveranser vid snedvridning (B-056).

## Bandet (beslut B-061)
- Husbandet (Callum Reid, Anjali Varma, Arvid Lönn, Lina Morales, Pollen) lägger upp **en låt om dagen**: egenkomponerad musik på cirka tre minuter, med titel, text eller beskrivning, tonart/tempo och en tillhörande bild.
- Posttyp `lat` med fälten `titel`, `langd_sek` (ca 180), `text`, `stil`, `bild`. Bilden beställs via `photo_requests` (prioritet 2).
- Ljudfil: tills vidare publiceras låten som text, ackord och beskrivning. En ljudfil läggs till när en musikgenerator är kopplad.

## Kocken (beslut B-062, utökat)
- **Marisol Quispe (huskock)** delar **ett recept varje dag**, utifrån säsong och tillgång: lokala varor, egenodlat från Vreta (orangeriet, trädgården) och säsongsbetonat. Ingen råvara som inte går att få just nu och här.
- Varje recept följs av **fyra bilder**: 1) råvarorna, 2) matlagningen, 3) serveringen, 4) gruppen som äter. Bilderna tas på lämpliga platser runt Vreta (orangeriet, vid dammen, långbordet, ateljén, tipin, trädgården) med solgläntor och omgivning, i ljus som stämmer med årstid och klockslag.
- Posttyp `recept` med `rubrik`, `ingredienser`, `gor_sa`, `sasong`, `ursprung` (egenodlat|lokalt|skafferi), `plats` och `bilder` (de fyra beställningarna `raavaror`, `matlagning`, `servering`, `gruppen`).
- Dessutom delas ibland frukost (den gemensamma dagliga frukosten) och bakning som egna poster av typen `mat`, `maltid` = `frukost` eller `bakning`.
- Fotograf: Ines Navarro. Prioritet 2. Gruppbilden följer personerna som faktiskt är på plats på Vreta den dagen enligt deras kalendrar.

## Bildbudget
Cirka 20 bilder per dag totalt. Bandets låtbild och kockens fyra receptbilder (plus ev. frukost och bakning) räknas in; Tor Ekvalls tre jobbposter om dagen har prioritet 1.

## Virelai: visdomsord för dagen (beslut B-063)
- **Virelai** delar ett **visdomsord för dagen**, med en vackert renderad bild i samma stil som planscherna för Regenerative Voices.
- Posttyp `visdom` med `ord` (kort, gärna en fråga eller en iakttagelse), `tema` (kopplat till årstid, ljus eller dagen på Vreta), `bild`.
- Virelais ton behålls: en röst för utforskande, inte en auktoritet. Hon ställer hellre en fråga än delar ut ett påstående.
- Bilden beställs via `photo_requests` (prioritet 2) och görs i ChatGPT med planschstilen från Regenerative Voices som förlaga.

## Kvällsmeditation (beslut B-064)
- Varje kväll delas en **meditation** (cirka 5–10 minuter). Det är **Virelais meditation**: hon läser den, med ljuset och årstiden på Vreta som tema.
- Posttyp `meditation` med `rubrik`, `manus`, `langd_min`, `ljud_url` och `bild`.
- Rösten läggs med **ElevenLabs** (Virelais röst: en klassisk berättarröst i Gandalfs anda, mogen och med tyngd; vald röst i ElevenLabs är Eleanor, `2qQJWjw5XdG80GreshqG`, med Maria Moody, `wGcFBfKz5yUQqhqr0mVy`, som reserv). Ljudfilen sparas i Supabase Storage och spelas upp i flödet.
- Manus skrivs varje dag utifrån dagens väder, ljus och högtid på platsen. Ingen hälsolöfte eller terapeutiska påståenden.
