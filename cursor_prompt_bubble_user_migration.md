# Cursor Prompt: Migrate Bubble Legacy Users into Supabase

## Context

JobHunch was originally built in Bubble and had ~380 users. The app was paused in 2024 and has now been rebuilt in Next.js + Supabase. We already migrated company and review data. We now need to migrate the **legacy user accounts** so that when those users visit the site and sign in (via Google OAuth or magic link), their account already exists in the system.

The data has been cleaned and 368 valid users are ready to import.

---

## What We Need to Build

Create a **one-time migration script** (`scripts/migrate-bubble-users.ts`) that inserts legacy Bubble users into Supabase as pre-existing accounts, with the following behaviour:

### How It Should Work

1. **Do NOT create Supabase Auth accounts** for these users. We cannot do that without their passwords (which we don't have). Instead, insert them directly into the **`profiles` table** (or whatever table stores user profile info in this app — check the existing schema).

2. When a legacy user signs in for the first time via magic link or Google OAuth, Supabase Auth will create a new `auth.users` entry. We need a **Supabase Auth trigger** (or an existing one) that links their new auth account to the pre-seeded profile row using their **email address as the join key**.

3. The script should:
   - Accept the user data array (provided below)
   - For each user, check if a profile row with that email already exists — **skip if it does**
   - Insert a new profile row with:
     - `email` — from the CSV
     - `full_name` — from the CSV
     - `first_name` — from the CSV (if available)
     - `last_name` — from the CSV (if available)
     - `imported_from_bubble: true` — flag to identify legacy users
     - `source: 'bubble'`
     - `user_id: null` — leave null until they actually sign in and create an auth account
     - Any other required non-nullable fields — use sensible defaults

4. **Check the existing profiles table schema** before writing anything. The column names in this app may differ from the ones above. Map accordingly.

5. After the profiles trigger already exists (the one that creates a profile row on new auth user creation), update it or add logic so that: when a new auth user is created, **before inserting a new profile row**, check if a row with that email already exists (i.e., a Bubble legacy user). If it does, **update that row** with the new `user_id` from `auth.users` instead of creating a duplicate.

---

## The User Data

Paste the following array into the script as a constant called `BUBBLE_USERS`:

```typescript
const BUBBLE_USERS = [
  { email: "oviepe@gmail.com", first_name: "Ovie", last_name: "Paul-Ejukorlem", full_name: "Ovie Paul-Ejukorlem" },
  { email: "luchechi08@gmail.com", first_name: "Lilian", last_name: "Anyanwu", full_name: "Lilian Anyanwu" },
  { email: "adesinatobi@gmail.com", first_name: "Tobi", last_name: "Adesina", full_name: "Tobi Adesina" },
  { email: "fanyaoha@yahoo.com", first_name: "Faith", last_name: "Anyaoha", full_name: "Faith Anyaoha" },
  { email: "osunborjoshua@gmail.com", first_name: "Joshua", last_name: "Osunbor", full_name: "Joshua Osunbor" },
  { email: "omotayolawal91@gmail.com", first_name: "Omotayo", last_name: "Lawal", full_name: "Omotayo Lawal" },
  { email: "oreeboy@gmail.com", first_name: "Oreoluwa", last_name: "Ojo", full_name: "Oreoluwa Ojo" },
  { email: "stanokey5@gmail.com", first_name: "stanley", last_name: "Iheacho", full_name: "stanley  Iheacho" },
  { email: "ayfolut@gmail.com", first_name: "Foluso", last_name: "Ayodele", full_name: "Foluso Ayodele" },
  { email: "doyinabayomi@gmail.com", first_name: "Abayomi", last_name: "'Doyin", full_name: "Abayomi 'Doyin" },
  { email: "peteromoyele@gmail.com", first_name: "Peter", last_name: "Omoyele", full_name: "Peter Omoyele" },
  { email: "imadeekpo@gmail.com", first_name: "Imade", last_name: "Ekpo", full_name: "Imade Ekpo" },
  { email: "maryannorutugu@gmail.com", first_name: "Maryann", last_name: "Lambo", full_name: "Maryann Lambo" },
  { email: "areolajohnbayo@gmail.com", first_name: "John", last_name: "Areola", full_name: "John Areola" },
  { email: "realbumite@yahoo.com", first_name: "Oluwabunmi", last_name: "Adeyemi", full_name: "Oluwabunmi Adeyemi" },
  { email: "rhamonayobami@gmail.com", first_name: "Abdulrahaman", last_name: "Ayobami", full_name: "Abdulrahaman  Ayobami" },
  { email: "yemiosinkolu@gmail.com", first_name: "Olayemi", last_name: "Osinkolu", full_name: "Olayemi Osinkolu" },
  { email: "phaluta@gmail.com", first_name: "Oluwatosin", last_name: "Faluta", full_name: "Oluwatosin Faluta" },
  { email: "modupesavage22@gmail.com", first_name: "Oluwatobi", last_name: "Savage", full_name: "Oluwatobi Savage" },
  { email: "lindaokeorji@gmail.com", first_name: "Linda", last_name: "Okeorji", full_name: "Linda Okeorji" },
  { email: "kraziesheys@gmail.com", first_name: "Khadijat", last_name: "Adesheye", full_name: "Khadijat Adesheye" },
  { email: "doncasino14@gmail.com", first_name: "Tandem", last_name: "Mandet", full_name: "Tandem Mandet" },
  { email: "obasantaiwojames@gmail.com", first_name: "Taiwo", last_name: "Obasan", full_name: "Taiwo Obasan" },
  { email: "spineleconcepts@gmail.com", first_name: "Robert", last_name: "Yusuf", full_name: "Robert Yusuf" },
  { email: "dammy.fenwa@gmail.com", first_name: "Damilola", last_name: "Isiramen", full_name: "Damilola  Isiramen" },
  { email: "adewoyindabira@gmail.com", first_name: "Oluwadabira", last_name: "Adewoyin", full_name: "Oluwadabira Adewoyin" },
  { email: "mide@kashbase.com", first_name: "Olamide", last_name: "Olayinka", full_name: "Olamide Olayinka" },
  { email: "adeogun64@gmail.com", first_name: "Jumat", last_name: "Adeogun", full_name: "Jumat Adeogun" },
  { email: "adewaleseuntaiwo@gmail.com", first_name: "Adewale Oluwaseun", last_name: "Taiwo", full_name: "Adewale Oluwaseun Taiwo" },
  { email: "adenodiiseoluwa@gmail.com", first_name: "Adedamola", last_name: "Adenodi", full_name: "Adedamola Adenodi" },
  { email: "loyebamiji@yahoo.com", first_name: "Lekan", last_name: "Oyebamiji", full_name: "Lekan Oyebamiji" },
  { email: "olufemiamusan@gmail.com", first_name: "Sam", last_name: "Alias", full_name: "Sam Alias" },
  { email: "desmondbright27@gmail.com", first_name: "Desmond", last_name: "Bright", full_name: "Desmond Bright" },
  { email: "tumiseabidakun@gmail.com", first_name: "Oluwatunmise", last_name: "Ife-Abidakun", full_name: "Oluwatunmise Ife-Abidakun" },
  { email: "idowuolanrewaju156@gmail.com", first_name: "Olanrewaju", last_name: "Idowu", full_name: "Olanrewaju Idowu" },
  { email: "temitayomarvelous@gmail.com", first_name: "Temitayo", last_name: "Opoola", full_name: "Temitayo Opoola" },
  { email: "onitemitope04@gmail.com", first_name: "Temitope", last_name: "Oni", full_name: "Temitope  Oni" },
  { email: "eneabigail6000@gmail.com", first_name: "Abigail", last_name: "Callista", full_name: "Abigail Callista" },
  { email: "osasdestined@gmail.com", first_name: "Peace", last_name: "Osarumen", full_name: "Peace Osarumen" },
  { email: "valentinedotun@gmail.com", first_name: "Oladotun", last_name: "Awoyefa", full_name: "Oladotun  Awoyefa" },
  { email: "peetahpublicist@gmail.com", first_name: "Peter", last_name: "A.", full_name: "Peter A." },
  { email: "ronaldadimoha@gmail.com", first_name: "Ronald", last_name: "Adimoha", full_name: "Ronald Adimoha" },
  { email: "kekundayo@baobabgroup.com", first_name: "Kolawole", last_name: "Ekundayo", full_name: "Kolawole  Ekundayo" },
  { email: "toluwalekeabimbola@gmail.com", first_name: "Tolu", last_name: "Abimbola", full_name: "Tolu Abimbola" },
  { email: "lachenzy@gmail.com", first_name: "Chenemi", last_name: "Abraham", full_name: "Chenemi Abraham" },
  { email: "abe.tomilayo@yahoo.com", first_name: "Tomi", last_name: "Abe", full_name: "Tomi Abe" },
  { email: "rolahgesinde@gmail.com", first_name: "Mo'", last_name: "Adunniade", full_name: "Mo' Adunniade" },
  { email: "folydconsult@gmail.com", first_name: "Biodun", last_name: "Folaranmi", full_name: "Biodun Folaranmi" },
  { email: "harhykhemhydhey@gmail.com", first_name: "Ola", last_name: "Ife", full_name: "Ola Ife" },
  { email: "generalolamide09@gmail.com", first_name: "ASIYANBI", last_name: "GBOLAHAN", full_name: "ASIYANBI GBOLAHAN" },
  { email: "jmamaloukos@gmail.com", first_name: "Jean-Claude", last_name: "Mamaloukos", full_name: "Jean-Claude Mamaloukos" },
  { email: "oduwoleadeyinkamichael@gmail.com", first_name: "Adeyinka", last_name: "Oduwole", full_name: "Adeyinka Oduwole" },
  { email: "alabi.kunle@rocketmail.com", first_name: "Kunle", last_name: "Junior", full_name: "Kunle Junior" },
  { email: "ifeling3@gmail.com", first_name: "Ifedayo", last_name: "Odunoye", full_name: "Ifedayo Odunoye" },
  { email: "princess_lendu@yahoo.com", first_name: "Precious", last_name: "Momoh", full_name: "Precious  Momoh" },
  { email: "fabiyiabdulpeter@gmail.com", first_name: "Fabiyi", last_name: "Alaba Oluniyi", full_name: "Fabiyi Alaba Oluniyi" },
  { email: "haruna.abubakar017@gmail.com", first_name: "Haruna", last_name: "Abubakar", full_name: "Haruna Abubakar" },
  { email: "jackelien.culbertson@airdev.co", first_name: "Jacky", last_name: "Culbertson", full_name: "Jacky Culbertson" },
  { email: "omonijoabiodun@gmail.com", first_name: "Abiodun", last_name: "Omonijo", full_name: "Abiodun Omonijo" },
  { email: "baderojeremiah@gmail.com", first_name: "Jeremiah-Jésù", last_name: "Badero", full_name: "Jeremiah-Jésù Badero" },
  { email: "mariaegunjobi9@gmail.com", first_name: "maria", last_name: "Egunjobi", full_name: "maria Egunjobi" },
  { email: "sewodorkehinde@gmail.com", first_name: "Kehinde", last_name: "Sewodor", full_name: "Kehinde Sewodor" },
  { email: "ikpekhiaakhimien@gmail.com", first_name: "Christopher", last_name: "Akhimien", full_name: "Christopher Akhimien" },
  { email: "adelajaolajumoke@gmail.com", first_name: "Olabisi", last_name: "Adelaja", full_name: "Olabisi  Adelaja" },
  { email: "uzowulu.ify@gmail.com", first_name: "Ify", last_name: "Uzowulu", full_name: "Ify Uzowulu" },
  { email: "odunayoadeneye@gmail.com", first_name: "Ayo", last_name: "Adeneye", full_name: "Ayo Adeneye" },
  { email: "joseph.missions1@gmail.com", first_name: "Joseph", last_name: "Olusegun", full_name: "Joseph Olusegun" },
  { email: "neyoakins@gmail.com", first_name: "Akinade", last_name: "Oluwafunminiyi", full_name: "Akinade Oluwafunminiyi" },
  { email: "davidoluwasina1@gmail.com", first_name: "David", last_name: "Oluwasina", full_name: "David Oluwasina" },
  { email: "adedayo.bakare1@gmail.com", first_name: "Adedayo", last_name: "Bakare", full_name: "Adedayo Bakare" },
  { email: "o.ebosetale@gmail.com", first_name: "Ebose", last_name: "Osolase", full_name: "Ebose Osolase" },
  { email: "etinosaobaseki@gmail.com", first_name: "Etin", last_name: "Obaseki", full_name: "Etin Obaseki" },
  { email: "egwuatu.khardiy@gmail.com", first_name: "Onyedika", last_name: "Egwuatu", full_name: "Onyedika Egwuatu" },
  { email: "swipeandfunnels@gmail.com", first_name: "Ajibola", last_name: "Samuel", full_name: "Ajibola Samuel" },
  { email: "jhaebiy@gmail.com", first_name: "John", last_name: "Brown", full_name: "John Brown" },
  { email: "idowuolusholaa@gmail.com", first_name: "Olushola", last_name: "Idowu", full_name: "Olushola Idowu" },
  { email: "gbemilekeadeoti@gmail.com", first_name: "Gbemileke", last_name: "Adeoti", full_name: "Gbemileke Adeoti" },
  { email: "infobakearoo@gmail.com", first_name: "ozi", last_name: "Sadiq", full_name: "ozi Sadiq" },
  { email: "oluseyiakogun@gmail.com", first_name: "Oluseyi", last_name: "Akogun", full_name: "Oluseyi Akogun" },
  { email: "delkrapht@gmail.com", first_name: "Oladele", last_name: "Agboola", full_name: "Oladele Agboola" },
  { email: "ruqayahfakorede@gmail.com", first_name: "Ruqayah", last_name: "Olayemi", full_name: "Ruqayah Olayemi" },
  { email: "akintoyeoyelakun@gmail.com", first_name: "Akintoye", last_name: "Oyelakun", full_name: "Akintoye Oyelakun" },
  { email: "adeyemijeremiah97@gmail.com", first_name: "Adeyemi", last_name: "Jeremiah", full_name: "Adeyemi Jeremiah" },
  { email: "adedejirayo@yahoo.com", first_name: "Morayooluwa", last_name: "Adedeji", full_name: "Morayooluwa  Adedeji" },
  { email: "roheemania@gmail.com", first_name: "Abdul-Roheem", last_name: "O.", full_name: "Abdul-Roheem  O." },
  { email: "anaeleejike@gmail.com", first_name: "Christopher", last_name: "Anaele", full_name: "Christopher Anaele" },
  { email: "kofoworolaakins@gmail.com", first_name: "Kofoworola", last_name: "Akinniyan", full_name: "Kofoworola  Akinniyan" },
  { email: "princelee01@gmail.com", first_name: "Prince", last_name: "Neville", full_name: "Prince Neville" },
  { email: "eseenice@yahoo.com", first_name: "", last_name: "", full_name: "First Last" },
  { email: "freelance.shiku@gmail.com", first_name: "Shiku", last_name: "Works", full_name: "Shiku Works" },
  { email: "victoressien430@gmail.com", first_name: "Victor", last_name: "Essien", full_name: "Victor Essien" },
  { email: "jchidinma40@gmail.com", first_name: "Chidinma", last_name: "John", full_name: "Chidinma  John" },
  { email: "qnttada@yahoo.com", first_name: "", last_name: "", full_name: "Q O" },
  { email: "siyanbolafunto@gmail.com", first_name: "Funto", last_name: "Siyanbola", full_name: "Funto Siyanbola" },
  { email: "opeawo@gmail.com", first_name: "Opeyemi", last_name: "Awoyemi", full_name: "Opeyemi Awoyemi" },
  { email: "manojkumar1404.mk@gmail.com", first_name: "Manoj", last_name: "Kumar", full_name: "Manoj Kumar" },
  { email: "eziekwe.grace@gmail.com", first_name: "Grace", last_name: "Eziekwe", full_name: "Grace Eziekwe" },
  { email: "taiwo1994@gmail.com", first_name: "Ebun", last_name: "Ade-Taiwo", full_name: "Ebun Ade-Taiwo" },
  { email: "chardestar005@gmail.com", first_name: "Mariam", last_name: "Adamson", full_name: "Mariam Adamson" },
  { email: "gbemisolatobi4+1@gmail.com", first_name: "Tobi", last_name: "Gbemisola", full_name: "Tobi Gbemisola" },
  { email: "irawoomosefunmi@gmail.com", first_name: "Omotoye", last_name: "Omosefunmi", full_name: "Omotoye Omosefunmi" },
  { email: "adekunledeji.aa@gmail.com", first_name: "Adekunle", last_name: "Adedeji", full_name: "Adekunle Adedeji" },
  { email: "ezinerose55@gmail.com", first_name: "Rose", last_name: "Ezine", full_name: "Rose Ezine" },
  { email: "deoladedayo@gmail.com", first_name: "Deola", last_name: "Dedayo", full_name: "Deola Dedayo" },
  { email: "funmilayoakinsooto@gmail.com", first_name: "Funmilayo", last_name: "Akinsooto", full_name: "Funmilayo Akinsooto" },
  { email: "solomonoluwaseun933@gmail.com", first_name: "solomon", last_name: "oluwaseun", full_name: "solomon oluwaseun" },
  { email: "operations.sunnyebi@gmail.com", first_name: "Sunny", last_name: "Ebi", full_name: "Sunny Ebi" },
  { email: "kindnessnwagbara@gmail.com", first_name: "kindness", last_name: "nwagbara", full_name: "kindness nwagbara" },
  { email: "sesan88@gmail.com", first_name: "Folagbade", last_name: "sesan", full_name: "Folagbade sesan" },
  { email: "chydynmabn@gmail.com", first_name: "Chidinma", last_name: "Buchi-Njere", full_name: "Chidinma Buchi-Njere" },
  { email: "falutawale@gmail.com", first_name: "Akinbowale", last_name: "Faluta", full_name: "Akinbowale Faluta" },
  { email: "isiomaandrew@gmail.com", first_name: "", last_name: "", full_name: "I A" },
  { email: "olawunmiajibola19@gmail.com", first_name: "Olawunmi", last_name: "Ajibola", full_name: "Olawunmi Ajibola" },
  { email: "amarachiudeh8@gmail.com", first_name: "Amarachi", last_name: "Udeh", full_name: "Amarachi Udeh" },
  { email: "jw6049820@gmail.com", first_name: "Jones", last_name: "william", full_name: "Jones william" },
  { email: "imamherbeeb@yahoo.com", first_name: "Habeeb", last_name: "Immam", full_name: "Habeeb Immam" },
  { email: "michaelessienakang@gmail.com", first_name: "Michael", last_name: "Akang", full_name: "Michael Akang" },
  { email: "omotoyosihelen@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "reminomayo@gmail.com", first_name: "Remi", last_name: "Avan-Nomayo", full_name: "Remi Avan-Nomayo" },
  { email: "ilalokhoinoloruntoba@gmail.com", first_name: "Ilalokhoin", last_name: "Oloruntoba", full_name: "Ilalokhoin Oloruntoba" },
  { email: "josephineokpaka@gmail.com", first_name: "Josephine", last_name: "Okpaka", full_name: "Josephine Okpaka" },
  { email: "marekzegarek123wow@gmail.com", first_name: "Marek", last_name: "Zegarek", full_name: "Marek Zegarek" },
  { email: "m.shokin@gmail.com", first_name: "Mike", last_name: "Shokin, CFA", full_name: "Mike Shokin, CFA" },
  { email: "lloyd@cloudstaff.com", first_name: "Lloyd", last_name: "Ernst", full_name: "Lloyd Ernst" },
  { email: "logincookies@gmail.com", first_name: "login", last_name: "cookies", full_name: "login cookies" },
  { email: "meetamakah@gmail.com", first_name: "Amaka", last_name: "Okoli", full_name: "Amaka Okoli" },
  { email: "akinkunmioluwadamiloju@gmail.com", first_name: "Sarah", last_name: "Akinkunmi", full_name: "Sarah Akinkunmi" },
  { email: "braveheart_3010@yahoo.com", first_name: "Hakeem", last_name: "Aderibigbe", full_name: "Hakeem Aderibigbe" },
  { email: "omololaokusami@gmail.com", first_name: "Zem", last_name: "", full_name: "Zem S" },
  { email: "cdanielkatchy@gmail.com", first_name: "CDaniel", last_name: "Katchy", full_name: "CDaniel Katchy" },
  { email: "anubra266@gmail.com", first_name: "Anuoluwapo", last_name: "Abraham", full_name: "Anuoluwapo Abraham" },
  { email: "aolumayokun@gmail.com", first_name: "awe", last_name: "olumayokun", full_name: "awe olumayokun" },
  { email: "christiana.amoduu@gmail.com", first_name: "Christiana", last_name: "Amodu", full_name: "Christiana Amodu" },
  { email: "mcrugged@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "okaforc67@gmail.com", first_name: "Chukwudi", last_name: "Okafor", full_name: "Chukwudi Okafor" },
  { email: "emachiugwuja4@gmail.com", first_name: "Emachi", last_name: "Chisom", full_name: "Emachi Chisom" },
  { email: "metify12@gmail.com", first_name: "Stella-Maris", last_name: "Metu", full_name: "Stella-Maris Metu" },
  { email: "anuoluwapoadedipe@gmail.com", first_name: "Anuoluwapo", last_name: "Adedipe", full_name: "Anuoluwapo Adedipe" },
  { email: "omopariola.oluwafisayo@gmail.com", first_name: "oluwafisayo", last_name: "omopariola", full_name: "oluwafisayo omopariola" },
  { email: "olay.yemi@gmail.com", first_name: "olayinka", last_name: "akinyemi", full_name: "olayinka akinyemi" },
  { email: "tobyfatumo@gmail.com", first_name: "Oluwatobi", last_name: "Fatumo", full_name: "Oluwatobi Fatumo" },
  { email: "bassnificient1@gmail.com", first_name: "Oluwaseun", last_name: "Abayomi", full_name: "Oluwaseun Abayomi" },
  { email: "portableglow@gmail.com", first_name: "", last_name: "", full_name: "G J" },
  { email: "blaqndproud82@gmail.com", first_name: "Omobee", last_name: "Taiwo", full_name: "Omobee Taiwo" },
  { email: "chinnysexy549@gmail.com", first_name: "Ukwueze", last_name: "Leticia Chidiebere", full_name: "Ukwueze  Leticia Chidiebere" },
  { email: "oyeropelumi02@gmail.com", first_name: "Oyero", last_name: "pelumi02", full_name: "Oyero pelumi02" },
  { email: "babatundealiu84@gmail.com", first_name: "Babatunde Anthony", last_name: "Aliu", full_name: "Babatunde Anthony Aliu" },
  { email: "doyinsolaoyebade@gmail.com", first_name: "Oyebade", last_name: "Doyinsola", full_name: "Oyebade Doyinsola" },
  { email: "onyemachi4u@gmail.com", first_name: "Victor", last_name: "Ebegbuna", full_name: "Victor Ebegbuna" },
  { email: "vinneido@gmail.com", first_name: "Thomas", last_name: "Osayende", full_name: "Thomas  Osayende" },
  { email: "linusclementamiobang@gmail.com", first_name: "Linus", last_name: "Clement", full_name: "Linus Clement" },
  { email: "sunkanmiogungbaiye@gmail.com", first_name: "Ola", last_name: "Sunkanmi", full_name: "Ola Sunkanmi" },
  { email: "bukalao@yahoo.com", first_name: "Bukky", last_name: "Kay", full_name: "Bukky Kay" },
  { email: "david05christisking@gmail.com", first_name: "David", last_name: "Akande", full_name: "David Akande" },
  { email: "rasheedatolagbe254@gmail.com", first_name: "atolagbe rasheed", last_name: "mogaji", full_name: "atolagbe rasheed mogaji" },
  { email: "oduleadesina@gmail.com", first_name: "odule", last_name: "enoch", full_name: "odule enoch" },
  { email: "estheronwuka96@gmail.com", first_name: "esther", last_name: "onwuka", full_name: "esther onwuka" },
  { email: "iwalolaa@gmail.com", first_name: "Iwalola", last_name: "Sobowale", full_name: "Iwalola Sobowale" },
  { email: "minneade@gmail.com", first_name: "Siyanbade", last_name: "Adeoluwa", full_name: "Siyanbade Adeoluwa" },
  { email: "ayosubs@gmail.com", first_name: "", last_name: "", full_name: "A A" },
  { email: "ikhide.atakpu@gmail.com", first_name: "ATAKPU", last_name: "IKHIDE", full_name: "ATAKPU IKHIDE" },
  { email: "kaluottahemeka@gmail.com", first_name: "Emeka", last_name: "Kalu-Ottah", full_name: "Emeka Kalu-Ottah" },
  { email: "adegbulugbeisrael@gmail.com", first_name: "Israel", last_name: "Adegbulugbe", full_name: "Israel Adegbulugbe" },
  { email: "toheeboladehinde7@gmail.com", first_name: "Toheeb", last_name: "Oladehinde", full_name: "Toheeb Oladehinde" },
  { email: "babatunde_martins@yahoo.com", first_name: "babatunde", last_name: "martins", full_name: "babatunde martins" },
  { email: "mboyd@teemagroup.com", first_name: "Michelle", last_name: "Boyd", full_name: "Michelle Boyd" },
  { email: "debowaleking@gmail.com", first_name: "Taiwo", last_name: "Oluwole", full_name: "Taiwo Oluwole" },
  { email: "oyebamiji64@gmail.com", first_name: "Lekan", last_name: "Oyebamiji", full_name: "Lekan Oyebamiji" },
  { email: "reactngs@gmail.com", first_name: "React", last_name: "HQ", full_name: "React HQ" },
  { email: "rexbabs214@gmail.com", first_name: "Rex", last_name: "Babs", full_name: "Rex Babs" },
  { email: "ricemaum@gmail.com", first_name: "Maurice Marie", last_name: "Ndiaye", full_name: "Maurice Marie Ndiaye" },
  { email: "mesquitagamboa@gmail.com", first_name: "matheus", last_name: "mesquita", full_name: "matheus mesquita" },
  { email: "damolaoyin005@gmail.com", first_name: "oyin", last_name: "damola", full_name: "oyin damola" },
  { email: "marymate247@gmail.com", first_name: "Olaosebikan", last_name: "Mary", full_name: "Olaosebikan Mary" },
  { email: "schmintbella@gmail.com", first_name: "Bella", last_name: "Schmint", full_name: "Bella Schmint" },
  { email: "osegi9704@gmail.com", first_name: "Daniel", last_name: "Osegi", full_name: "Daniel Osegi" },
  { email: "ewaoluwavictoria18@gmail.com", first_name: "Ewaoluwa", last_name: "Adekunle", full_name: "Ewaoluwa  Adekunle" },
  { email: "cryptonebs@gmail.com", first_name: "Nenye", last_name: "Nebe", full_name: "Nenye Nebe" },
  { email: "temmyt146@gmail.com", first_name: "Temmy", last_name: "", full_name: "Temmy T" },
  { email: "oluwakanmisamuelo@gmail.com", first_name: "Samuel", last_name: "Oluwakanmi", full_name: "Samuel Oluwakanmi" },
  { email: "edetemmanuel2013@gmail.com", first_name: "Emmanuel", last_name: "Edet", full_name: "Emmanuel Edet" },
  { email: "tundehamed20@gmail.com", first_name: "Babatunde", last_name: "Olamilekan", full_name: "Babatunde Olamilekan" },
  { email: "matt@restacklabs.com", first_name: "Matt", last_name: "Krandel", full_name: "Matt Krandel" },
  { email: "olamilekanolaibi@gmail.com", first_name: "olaibi", last_name: "olamilekan", full_name: "olaibi olamilekan" },
  { email: "siefatahope12@gmail.com", first_name: "Siefata", last_name: "Hope", full_name: "Siefata Hope" },
  { email: "paulvictorbalogun@gmail.com", first_name: "Paul", last_name: "Balogun", full_name: "Paul Balogun" },
  { email: "marcosn2xw@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "opeokesola@yahoo.com", first_name: "Ope", last_name: "Okesola", full_name: "Ope Okesola" },
  { email: "jacek.pixblocks@gmail.com", first_name: "Jacek", last_name: "Bogdan", full_name: "Jacek Bogdan" },
  { email: "dan.boss.muster@gmail.com", first_name: "Dan", last_name: "Boss", full_name: "Dan Boss" },
  { email: "ubaniuchechi9960@gmail.com", first_name: "Precious", last_name: "Akandu", full_name: "Precious Akandu" },
  { email: "rebisenterprises@gmail.com", first_name: "Marv", last_name: "Oje", full_name: "Marv Oje" },
  { email: "elodanielshop@gmail.com", first_name: "daniel", last_name: "elo", full_name: "daniel elo" },
  { email: "lyndaada80@gmail.com", first_name: "Lynda", last_name: "Obitolo", full_name: "Lynda Obitolo" },
  { email: "figuringmy20s@gmail.com", first_name: "Figuring", last_name: "my20s", full_name: "Figuring my20s" },
  { email: "customercare@sd-6consortium.ml", first_name: "SD-6", last_name: "Consortium", full_name: "SD-6 Consortium" },
  { email: "dcitelly@gmail.com", first_name: "felipe", last_name: "chica", full_name: "felipe chica" },
  { email: "oluwatosint975@gmail.com", first_name: "Oluwatosin", last_name: "Taiwo", full_name: "Oluwatosin  Taiwo" },
  { email: "tsealy1@hotmail.com", first_name: "John", last_name: "Donning", full_name: "John Donning" },
  { email: "danieltaiwoogo@gmail.com", first_name: "Daniel", last_name: "Taiwo", full_name: "Daniel Taiwo" },
  { email: "charliejoy844@gmail.com", first_name: "JOY", last_name: "CHARLIE", full_name: "JOY CHARLIE" },
  { email: "agbojadavid@gmail.com", first_name: "agboja", last_name: "david", full_name: "agboja david" },
  { email: "compdaverdade@gmail.com", first_name: "Companheiros Da", last_name: "Verdade", full_name: "Companheiros Da Verdade" },
  { email: "act32.97@gmail.com", first_name: "Robert", last_name: "Bennett", full_name: "Robert Bennett" },
  { email: "emmanueladebayo2012@gmail.com", first_name: "Emmanuel", last_name: "Adebayo", full_name: "Emmanuel Adebayo" },
  { email: "chukwulobeichoku@gmail.com", first_name: "Chukwulobe", last_name: "Ichoku", full_name: "Chukwulobe Ichoku" },
  { email: "ovokeobaka11@gmail.com", first_name: "Obaka", last_name: "Ovokeroye", full_name: "Obaka Ovokeroye" },
  { email: "dadaajibola8@gmail.com", first_name: "Ajibola", last_name: "Dada", full_name: "Ajibola Dada" },
  { email: "gbolahanoduyemi1@gmail.com", first_name: "Gbolahan", last_name: "Oduyemi", full_name: "Gbolahan Oduyemi" },
  { email: "olenloapeculiar@gmail.com", first_name: "Peculiar", last_name: "Olenloa", full_name: "Peculiar Olenloa" },
  { email: "ifeoluwabusola234@gmail.com", first_name: "katibi", last_name: "ifeoluwa", full_name: "katibi ifeoluwa" },
  { email: "drewthevibe@gmail.com", first_name: "David", last_name: "George", full_name: "David George" },
  { email: "ogyblessed@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "malikchika86@gmail.com", first_name: "Blessing", last_name: "Malik", full_name: "Blessing Malik" },
  { email: "msmaudu@gmail.com", first_name: "Marnin", last_name: "Audu", full_name: "Marnin Audu" },
  { email: "briantuju@gmail.com", first_name: "Brian", last_name: "Tuju", full_name: "Brian  Tuju" },
  { email: "dammyaji4sure@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "r.adebola@estradaintl.com", first_name: "Rhoda", last_name: "Adebola", full_name: "Rhoda Adebola" },
  { email: "ifyonojaefe@gmail.com", first_name: "ifeanyi", last_name: "onojaefe", full_name: "ifeanyi onojaefe" },
  { email: "agolupayimo@gmail.com", first_name: "Olupayimo", last_name: "Adeola", full_name: "Olupayimo  Adeola" },
  { email: "ebooks4yomi@gmail.com", first_name: "Yomi", last_name: "Omotoso", full_name: "Yomi Omotoso" },
  { email: "fatukasivictor@gmail.com", first_name: "Oluwasanmi V.", last_name: "Fatukasi", full_name: "Oluwasanmi V. Fatukasi" },
  { email: "olubunmilasisi@gmail.com", first_name: "Bunmi", last_name: "Lasisi", full_name: "Bunmi Lasisi" },
  { email: "ikwuegbuenyi32@gmail.com", first_name: "Augustine Elochukwu", last_name: "Ikwuegbuenyi", full_name: "Augustine Elochukwu Ikwuegbuenyi" },
  { email: "josheeti@gmail.com", first_name: "Akinniyi", last_name: "joshua", full_name: "Akinniyi joshua" },
  { email: "adeoyefel@gmail.com", first_name: "Adeoye", last_name: "Felix", full_name: "Adeoye Felix" },
  { email: "oluwatobitobijames@gmail.com", first_name: "Tanimowo", last_name: "Oluwatobi", full_name: "Tanimowo Oluwatobi" },
  { email: "oduordalienst@gmail.com", first_name: "Dalienst", last_name: "Oduor", full_name: "Dalienst  Oduor" },
  { email: "ogunniranolamidavid03@gmail.com", first_name: "Ogunniran", last_name: "Olamidotun David", full_name: "Ogunniran Olamidotun David" },
  { email: "jobs@hr.doahenterprise.com", first_name: "David", last_name: "Anikwue", full_name: "David Anikwue" },
  { email: "baijnathkr1305@gmail.com", first_name: "Baijnath", last_name: "Kumar", full_name: "Baijnath Kumar" },
  { email: "ihediwaprosper1998@gmail.com", first_name: "Ihediwa", last_name: "Prosper", full_name: "Ihediwa Prosper" },
  { email: "oduyefemi25@gmail.com", first_name: "Femi", last_name: "Oduye", full_name: "Femi  Oduye" },
  { email: "prognosisng@gmail.com", first_name: "Digital", last_name: "Prognosis", full_name: "Digital Prognosis" },
  { email: "oladipoabdul@gmail.com", first_name: "Kehinde", last_name: "Oladipo", full_name: "Kehinde Oladipo" },
  { email: "oluwafemiadebola12@gmail.com", first_name: "Adebola", last_name: "Abdulsalam", full_name: "Adebola Abdulsalam" },
  { email: "alaya.kehinde18@gmail.com", first_name: "alaya", last_name: "kehinde simon", full_name: "alaya kehinde simon" },
  { email: "imsholz26@gmail.com", first_name: "Shola", last_name: "Bello", full_name: "Shola Bello" },
  { email: "qudusowoade@gmail.com", first_name: "Tobiloba", last_name: "Owoade", full_name: "Tobiloba Owoade" },
  { email: "lery.jicquel@gmail.com", first_name: "Léry", last_name: "Jicquel", full_name: "Léry Jicquel" },
  { email: "omonaiyedamilola09@gmail.com", first_name: "Omonaiye", last_name: "Damilola", full_name: "Omonaiye Damilola" },
  { email: "shekinahpeter7@gmail.com", first_name: "the_", last_name: "iheoma", full_name: "the_ iheoma" },
  { email: "oyedelesegun247@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "godspowerunuane@gmail.com", first_name: "Godspower", last_name: "unuane", full_name: "Godspower unuane" },
  { email: "hrjuliet@beryl.com.ng", first_name: "Mabel", last_name: "Jones", full_name: "Mabel  Jones" },
  { email: "diamond.ayinke@befti.com.ng", first_name: "Diamond", last_name: "Michael", full_name: "Diamond  Michael" },
  { email: "mayowaprincess1@gmail.com", first_name: "Princess", last_name: "Mayowa", full_name: "Princess Mayowa" },
  { email: "jobs@marvitech.com.ng", first_name: "Sarah", last_name: "Lawrence", full_name: "Sarah  Lawrence" },
  { email: "hrteam@braveachievers.com", first_name: "Dipo", last_name: "Brazil", full_name: "Dipo Brazil" },
  { email: "smithrejoice19@gmail.com", first_name: "smith", last_name: "Rejoice", full_name: "smith Rejoice" },
  { email: "elyterecruiter@gmail.com", first_name: "Elyte", last_name: "Recruiter", full_name: "Elyte Recruiter" },
  { email: "apply.elyterecruiter@gmail.com", first_name: "Elyte", last_name: "Recruiter", full_name: "Elyte Recruiter" },
  { email: "akindelea97@gmail.com", first_name: "Akindele", last_name: "Ayomide", full_name: "Akindele Ayomide" },
  { email: "olayinkaawoyeku@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "faturotiolayiwola@gmail.com", first_name: "Olayiwola", last_name: "Faturoti", full_name: "Olayiwola Faturoti" },
  { email: "igbasimonpetermary@gmail.com", first_name: "Simon", last_name: "igba", full_name: "Simon igba" },
  { email: "ewedairohabibllahi@gmail.com", first_name: "Habibllahi", last_name: "Ewedairo", full_name: "Habibllahi Ewedairo" },
  { email: "olu.mor2win@gmail.com", first_name: "Moyinwin", last_name: "Olumide", full_name: "Moyinwin Olumide" },
  { email: "osisenior1@gmail.com", first_name: "Osigbemhe", last_name: "Okasor", full_name: "Osigbemhe  Okasor" },
  { email: "ojieyanjoy@gmail.com", first_name: "Joy", last_name: "Ojieyan", full_name: "Joy Ojieyan" },
  { email: "ayodelegiftemi@gmail.com", first_name: "Gift", last_name: "Ayodele", full_name: "Gift  Ayodele" },
  { email: "paulandor6@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "razaqbello07@gmail.com", first_name: "Razaq", last_name: "Bello", full_name: "Razaq Bello" },
  { email: "tomisinadeyewa@gmail.com", first_name: "Jesutomisin", last_name: "Adeyewa", full_name: "Jesutomisin Adeyewa" },
  { email: "celestintobey95@gmail.com", first_name: "Tobechukwu", last_name: "Aniekwe", full_name: "Tobechukwu  Aniekwe" },
  { email: "adeshinagrace07@gmail.com", first_name: "Elizabeth", last_name: "Adeshina", full_name: "Elizabeth  Adeshina" },
  { email: "aishatsuraju@gmail.com", first_name: "Aishat", last_name: "Suraju", full_name: "Aishat Suraju" },
  { email: "tolulopeakande6@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "udohpaul75@gmail.com", first_name: "Paul", last_name: "Udoh", full_name: "Paul  Udoh" },
  { email: "ajokeadejumo0@gmail.com", first_name: "Esther", last_name: "Adejumo", full_name: "Esther Adejumo" },
  { email: "omegaplusconsult02@gmail.com", first_name: "Omega plus", last_name: "Consult", full_name: "Omega plus Consult" },
  { email: "danielallibalogun496@gmail.com", first_name: "Daniel", last_name: "Alli balogun", full_name: "Daniel Alli balogun" },
  { email: "olayemiolayinka007@gmail.com", first_name: "Olayemi", last_name: "Olagunju", full_name: "Olayemi Olagunju" },
  { email: "nathalityehije@gmail.com", first_name: "Nathaniel", last_name: "Aisagbonhi", full_name: "Nathaniel Aisagbonhi" },
  { email: "kaneshaisaac@gmail.com", first_name: "Kanesha", last_name: "Isaac", full_name: "Kanesha Isaac" },
  { email: "mosesibirongbe@gmail.com", first_name: "Ibirongbe", last_name: "Moses", full_name: "Ibirongbe Moses" },
  { email: "sm8boy@gmail.com", first_name: "Ishan", last_name: "Bhardwaj", full_name: "Ishan Bhardwaj" },
  { email: "careers@lampnets.com", first_name: "VIVIAN", last_name: "ETAFO", full_name: "VIVIAN ETAFO" },
  { email: "joesphyne@gmail.com", first_name: "Josephine", last_name: "Eniayewu", full_name: "Josephine Eniayewu" },
  { email: "dhonoureible@gmail.com", first_name: "Lawal", last_name: "Temitayo", full_name: "Lawal Temitayo" },
  { email: "ibrahimbadmus07@gmail.com", first_name: "Ibrahim", last_name: "Badmus", full_name: "Ibrahim Badmus" },
  { email: "okolijohnson69@gmail.com", first_name: "Johnson", last_name: "Okoli", full_name: "Johnson Okoli" },
  { email: "houseoftima@gmail.com", first_name: "Adeola", last_name: "Ogundimu", full_name: "Adeola Ogundimu" },
  { email: "idahosajoshua61@gmail.com", first_name: "Idahosa", last_name: "Joshua", full_name: "Idahosa Joshua" },
  { email: "joao.vmf.alves@gmail.com", first_name: "Joao", last_name: "Alves", full_name: "Joao Alves" },
  { email: "agoromotunrayo8@gmail.com", first_name: "Atinuke", last_name: "Atinuke", full_name: "Atinuke Atinuke" },
  { email: "ibrahimbabalola742@gmail.com", first_name: "Babs", last_name: "Bibi", full_name: "Babs Bibi" },
  { email: "rachelonojobi@gmail.com", first_name: "RACHEL", last_name: "ONOJOBI", full_name: "RACHEL ONOJOBI" },
  { email: "temiyetobite@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "emmanueltemiede@gmail.com", first_name: "Emmanuel", last_name: "Temiede", full_name: "Emmanuel Temiede" },
  { email: "grace@brainboxmarketing.com.ng", first_name: "Grace", last_name: "Bassey", full_name: "Grace Bassey" },
  { email: "talvinder27@gmail.com", first_name: "Talvinder", last_name: "Singh", full_name: "Talvinder Singh" },
  { email: "joaslima538@gmail.com", first_name: "JOÁS", last_name: "LIMA", full_name: "JOÁS LIMA" },
  { email: "oluwaseun.osineye@gmail.com", first_name: "Oluwaseun", last_name: "Osineye", full_name: "Oluwaseun Osineye" },
  { email: "newbanger.com@gmail.com", first_name: "Adewale", last_name: "Akintade", full_name: "Adewale Akintade" },
  { email: "samdprof@gmail.com", first_name: "Samuel", last_name: "Adebayo", full_name: "Samuel Adebayo" },
  { email: "victorymiracle98@gmail.com", first_name: "Abugu", last_name: "Victor", full_name: "Abugu Victor" },
  { email: "ojiehanita02@gmail.com", first_name: "Anita", last_name: "Ojieh", full_name: "Anita Ojieh" },
  { email: "bryangaurano@gmail.com", first_name: "Bryan", last_name: "Gaurano", full_name: "Bryan Gaurano" },
  { email: "bryangaurano+1@gmail.com", first_name: "Bryan", last_name: "Gaurano", full_name: "Bryan Gaurano" },
  { email: "ojojoseph1001@gmail.com", first_name: "ojo", last_name: "joseph", full_name: "ojo joseph" },
  { email: "greatgrace112@gmail.com", first_name: "Isaac", last_name: "Fatogun", full_name: "Isaac Fatogun" },
  { email: "dowuoye@gmail.com", first_name: "Adeboye", last_name: "Idowu", full_name: "Adeboye Idowu" },
  { email: "hamzatabdullah2000@gmail.com", first_name: "Abdullah", last_name: "", full_name: "Abdullah" },
  { email: "daramsontimmy@gmail.com", first_name: "Daramola", last_name: "oluwatimilehin", full_name: "Daramola oluwatimilehin" },
  { email: "sydneytw@gmail.com", first_name: "Sydney", last_name: "Wingender", full_name: "Sydney Wingender" },
  { email: "ejooremmanuel@gmail.com", first_name: "Ejoor", last_name: "Emmanuel", full_name: "Ejoor Emmanuel" },
  { email: "marek.szlagier@gmail.com", first_name: "Mark", last_name: "Szlagier", full_name: "Mark Szlagier" },
  { email: "narternearl@gmail.com", first_name: "Nathaniel", last_name: "SAAKA", full_name: "Nathaniel SAAKA" },
  { email: "adesamlaw03@gmail.com", first_name: "Sammy", last_name: "Lawal", full_name: "Sammy Lawal" },
  { email: "renzo@wearebondy.com", first_name: "Renzo", last_name: "Montuori", full_name: "Renzo Montuori" },
  { email: "hr_internal@cloudware.ng", first_name: "cloudware", last_name: "technologies recruit", full_name: "cloudware technologies recruit" },
  { email: "elamin26th@gmail.com", first_name: "El-amin Babatunde", last_name: "Adiatu", full_name: "El-amin Babatunde Adiatu" },
  { email: "thejoyosagie@gmail.com", first_name: "Joy", last_name: "Osagie", full_name: "Joy Osagie" },
  { email: "mail.vatelio@gmail.com", first_name: "vatel", last_name: "io", full_name: "vatel io" },
  { email: "warith.ad02@gmail.com", first_name: "Abdulwarith", last_name: "Lawal", full_name: "Abdulwarith Lawal" },
  { email: "zaj.commerce@gmail.com", first_name: "Zaj", last_name: "commerce", full_name: "Zaj commerce" },
  { email: "nimitkapoor07@gmail.com", first_name: "Nimit", last_name: "Kapoor", full_name: "Nimit Kapoor" },
  { email: "prabhu@apna.co", first_name: "Prabhu", last_name: "Raja", full_name: "Prabhu Raja" },
  { email: "aktienanalyse1@gmail.com", first_name: "Santo", last_name: "Freese", full_name: "Santo Freese" },
  { email: "tjoepayo@gmail.com", first_name: "Joseph", last_name: "Adeyemi", full_name: "Joseph Adeyemi" },
  { email: "fanimokunpelumi0@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "bujupajardit6@gmail.com", first_name: "ardit", last_name: "bujupaj", full_name: "ardit bujupaj" },
  { email: "fajo.fajomonie@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "deeone377@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "icodemc@gmail.com", first_name: "Fitness", last_name: "Empire", full_name: "Fitness Empire" },
  { email: "horlartormewa4@gmail.com", first_name: "Hannah", last_name: "Olatoye", full_name: "Hannah Olatoye" },
  { email: "kushwahamuskan2001@gmail.com", first_name: "Muskan", last_name: "Kushwaha", full_name: "Muskan Kushwaha" },
  { email: "mirabelluka3@gmail.com", first_name: "Mirabel", last_name: "Luka", full_name: "Mirabel  Luka" },
  { email: "olajidekehinde19@gmail.com", first_name: "Kehinde", last_name: "Olajide", full_name: "Kehinde Olajide" },
  { email: "uzochukamaka@gmail.com", first_name: "Esther", last_name: "Ezem", full_name: "Esther Ezem" },
  { email: "adelanaadejuwon@gmail.com", first_name: "Adejuwon", last_name: "Adelana", full_name: "Adejuwon Adelana" },
  { email: "c.binkhorst@binkfacilitair.nl", first_name: "Cedric", last_name: "Binkhorst", full_name: "Cedric Binkhorst" },
  { email: "c.binkhorst@binkfacilitairs.nl", first_name: "Cedric", last_name: "Binkhorst", full_name: "Cedric Binkhorst" },
  { email: "maryodior123@gmail.com", first_name: "Raine", last_name: "Mitch", full_name: "Raine Mitch" },
  { email: "vacancybincomglobal2@bincom.net", first_name: "Peculiar", last_name: "Favour", full_name: "Peculiar Favour" },
  { email: "ukwuegbupamela@gmail.com", first_name: "Oluchi Pamela", last_name: "Ukwuegbu", full_name: "Oluchi Pamela Ukwuegbu" },
  { email: "osodeoct02@gmail.com", first_name: "osode", last_name: "oct02", full_name: "osode oct02" },
  { email: "itsdatkaybeeh@gmail.com", first_name: "Kabir", last_name: "Babatunde", full_name: "Kabir Babatunde" },
  { email: "boychito01@gmail.com", first_name: "Tochukwu", last_name: "Onwuka", full_name: "Tochukwu  Onwuka" },
  { email: "onedigitaldude1@gmail.com", first_name: "Adedayo", last_name: "Ogundipe", full_name: "Adedayo Ogundipe" },
  { email: "miriamdan23@gmail.com", first_name: "Miriam", last_name: "Daniel", full_name: "Miriam Daniel" },
  { email: "chiamakaobia@yahoo.com", first_name: "Chimamaka", last_name: "Dare", full_name: "Chimamaka Dare" },
  { email: "tochukwusamuelonwuka@gmail.com", first_name: "TOCHUKWU SAMUEL", last_name: "ONWUKA", full_name: "TOCHUKWU SAMUEL ONWUKA" },
  { email: "awajoy15@gmail.com", first_name: "Joy", last_name: "Awa", full_name: "Joy Awa" },
  { email: "divyanshuroy489@gmail.com", first_name: "Divyanshu", last_name: "Kumar", full_name: "Divyanshu Kumar" },
  { email: "denyefajune@gmail.com", first_name: "Praise Denyefa", last_name: "June", full_name: "Praise Denyefa June" },
  { email: "twakama@lakeheadu.ca", first_name: "", last_name: "", full_name: "" },
  { email: "anastasia.m2001@yahoo.com", first_name: "Anastasia", last_name: "Marinescu", full_name: "Anastasia Marinescu" },
  { email: "miriamdavid1020@gmail.com", first_name: "Miriam", last_name: "David", full_name: "Miriam David" },
  { email: "harttumini9@gmail.com", first_name: "Tumini", last_name: "M Hart", full_name: "Tumini M Hart" },
  { email: "amusanoluwafunke@gmail.com", first_name: "Amusan", last_name: "Oluwafunke", full_name: "Amusan Oluwafunke" },
  { email: "yourdavidjohnson@gmail.com", first_name: "David", last_name: "Johnson", full_name: "David Johnson" },
  { email: "utkarsh.verma.0908@gmail.com", first_name: "Utkarsh", last_name: "", full_name: "Utkarsh" },
  { email: "oluolawills@gmail.com", first_name: "Olumide", last_name: "Williams", full_name: "Olumide Williams" },
  { email: "hmotunrayo081@gmail.com", first_name: "Motunrayo", last_name: "", full_name: "Motunrayo" },
  { email: "adejokemudashiru605@gmail.com", first_name: "Adejoke", last_name: "Mudashiru", full_name: "Adejoke Mudashiru" },
  { email: "olujareayodeji7@gmail.com", first_name: "Stephen A.", last_name: "Olujare", full_name: "Stephen A. Olujare" },
  { email: "ayoms1820@gmail.com", first_name: "Oladiran", last_name: "Ayomide", full_name: "Oladiran Ayomide" },
  { email: "ediaweconfidencepaul@gmail.com", first_name: "Ediawe", last_name: "Confidence paul", full_name: "Ediawe Confidence paul" },
  { email: "favouratokp@gmail.com", first_name: "Favour", last_name: "Atokpe", full_name: "Favour Atokpe" },
  { email: "adewale.akintade@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "lawalhamzah6@gmail.com", first_name: "", last_name: "", full_name: "" },
  { email: "official.joshcorp@gmail.com", first_name: "", last_name: "", full_name: "Test Test2" },
];
```

---

## Step-by-Step Instructions for Cursor

### Step 1: Check the existing schema
Before writing any insert logic, look at the Supabase `profiles` table definition. Check:
- `/supabase/migrations/` for the most recent migration that creates the profiles table
- Or run `supabase db pull` and inspect the schema

Note the exact column names (e.g., is it `full_name` or `name`? Is it `first_name` or just `name`?). Adjust the script accordingly.

### Step 2: Check/update the auth trigger
Find the Supabase trigger that fires when a new user signs up (likely in `/supabase/migrations/` or in the Supabase dashboard under Database > Functions). It probably looks like:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, ...)
  VALUES (NEW.id, NEW.email, ...);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Update this function so that **before inserting**, it checks if a profile row already exists with `NEW.email`. If it does (legacy Bubble user), it should `UPDATE` that row to set `user_id = NEW.id` instead of inserting a new row. If it doesn't exist, it should insert as normal.

### Step 3: Create the migration script
Create `scripts/migrate-bubble-users.ts` using the Supabase service role client (not the anon key). The script should:
1. Loop through `BUBBLE_USERS`
2. For each user, check if a `profiles` row with that email exists
3. If not, insert it with `imported_from_bubble: true`, `source: 'bubble'`, `user_id: null`
4. Log results: how many inserted, how many skipped

### Step 4: Run it
Run the script with:
```bash
npx ts-node scripts/migrate-bubble-users.ts
```
Or if the project uses `tsx`:
```bash
npx tsx scripts/migrate-bubble-users.ts
```

Make sure `SUPABASE_SERVICE_ROLE_KEY` is available in `.env.local` before running.

---

## Notes / Gotchas

- **Do not use the anon key** for this script — it will be blocked by RLS. Use the service role key.
- The `profiles` table may have a unique constraint on `email` — that's fine and actually helpful; if a duplicate insert is attempted it will fail gracefully. Use `upsert` with `onConflict: 'email'` and `ignoreDuplicates: true` if you want to be safe.
- Some users have no `first_name` or `last_name` — insert empty strings or null as appropriate for your schema.
- This is a **one-time script**, not a recurring one. Once it runs successfully, it can be archived.
