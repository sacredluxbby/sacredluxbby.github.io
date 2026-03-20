# Turvamees

Node.js veebirakendus, mis kasutab kaamerat, tuvastab liikumise suuna ning mängib iga suuna jaoks erinevat heli.

## Mida rakendus teeb

- Loeb kaamera videovoogu brauseris.
- Võrdleb kaadreid, et leida liikuvad pikslid.
- Arvutab liikuva objekti keskpunkti ja piirkonna suuruse.
- Tuvastab liikumissuunad: vasakule, paremale, üles, alla, ette, tagasi.
- Mängib igale suunale oma helimustri.
- Kui objekt liigub tagasi (kaamerast eemale), mängitakse alarmilaadne signaal.

## Käivitamine

1. Ava terminal projekti kaustas.
2. Käivita:

```bash
node server.js
```

3. Ava brauseris:

```text
http://localhost:3000
```

## Märkused

- Brauser küsib kaamera kasutamise luba.
- Helide mängimiseks võib vaja minna kasutaja esmast nupuklõpsu (see on brauseri turvareegel).
- Täpne edasi-tagasi hinnang sõltub kaamera nurgast ja valgustusest.

## 10 lahedat lisafunktsiooni

1. Oma helifailide üleslaadimine igale liikumissuunale.
2. Tundlikkuse liugur müra vähendamiseks.
3. Ööreziim automaatse ajastusega.
4. Push-teavitused telefoni.
5. Sündmuste logi koos ajatempliga.
6. Kaadri automaatne pildistamine häire korral.
7. Mitme kaamera tugi.
8. Häälega sisse-välja lülitus.
9. Isikupärastatavad teemad ja taustad.
10. AI objektituvastus (inimene, loom, auto).
