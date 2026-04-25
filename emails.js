// Branch / Department -> email mapping. Source: mailids.xlsx
// Lookup is case- and punctuation-insensitive (alphanumeric only).
(function () {
  const RAW = {
    // Branches
    "Akkialur": "nvssnbrakkialur@gmail.com",
    "Anavatti": "nvssnbranavatti@gmail.com",
    "Banavasi": "nvssnbrbnvsi@gmail.com",
    "Bankapur": "nvssnbrbnkpr@gmail.com",
    "Belagalpeth": "nvssnbrbelagalapeth@gmail.com",
    "Bommanahalli": "nvssnbrbommanahalli@gmail.com",
    "Byadagi": "nvssnbrbyd@gmail.com",
    "Chikkerur": "nvssnbrckr@gmail.com",
    "Dharawad": "nvssnbrdharwad@gmail.com",
    "Gadag": "nvssnbrgadag@gmail.com",
    "Gajendragad": "nvssnbrgajendragad@gmail.com",
    "Guttal": "nvssnbrgtl@gmail.com",
    "Hagaribommanahalli": "nvssnbrhbhalli@gmail.com",
    "Halavagalu": "nvssnbrhalavagalu@gmail.com",
    "Hangal": "nvssnbrhnl@gmail.com",
    "Hattimattur": "nvssnbrhattimattur@gmail.com",
    "Hausabhavi": "nvssnbrhsbv@gmail.com",
    "Haveri": "nvssnbrhvr@gmail.com",
    "Hebbal": "nvssnbrhebbal@gmail.com",
    "Hirekerur": "nvssnbrhkr@gmail.com",
    "Holalu": "nvssnbrholalu@gmail.com",
    "Hosaritti": "nvssnbrhosaritti@gmail.com",
    "Hulagur": "nvssnbrhulagur@gmail.com",
    "Huvinahadagali": "nvssnbrhadagali@gmail.com",
    "Kukanoor": "nvssnbrkukanoor@gmail.com",
    "Kumarpattanam": "nvssn12brkp@gmail.com",
    "Kundagol": "nvssnbrkundagol@gmail.com",
    "Kusanur": "nvssnkusanur@gmail.com",
    "Lakkundi": "nvssnbrlakkundi@gmail.com",
    "Laxmeshwar": "nvssnbrlxm@gmail.com",
    "Maadi": "nvssnbrmagadi@gmail.com",
    "Masur": "nvssnbrmasur@gmail.com",
    "Mishrikoti": "nvssnbrmishrikoti@gmail.com",
    "Mundagod": "nvssnbrmundagod@gmail.com",
    "Ranebennur": "nvssnbrrnr@gmail.com",
    "Rattihalli": "nvssnbrrattihalli@gmail.com",
    "Savanur": "nvssnbrsvnr@gmail.com",
    "Shiggoan": "nvssnbrshg@gmail.com",
    "Shikaripura": "nvssnbrskp@gmail.com",
    "Shiralkoppa": "shiralakoppan@gmail.com",
    "Tadas": "nvssnbrtadas@gmail.com",
    "Telagi": "nvssnbrtelagi@gmail.com",
    "Tilavalli": "nvssnbrtilv@gmail.com",
    "Tumminakatti": "nvssnbrtmt@gmail.com",
    "B.Nagar": "nvssnbrhvr2@gmail.com",
    // Head office variants
    "Head office": "nvssnhohvr@gmail.com",
    "H.O reports": "nvssndailyreports@gmail.com",
    "H.O admin": "nvssnhoa995@gmail.com",
    "H.O credit": "nvssnhocredit@gmail.com",
    "H.O accounts": "nvssnhoacounts@gmail.com",
    "H.O IT": "nvssnhoit@gmail.com",
    "H.R": "hr@navachetanasouhardha.com",
    "NVSSN HR": "nvssnhr1@gmail.com",
    "AUDITOR HO SHWETA": "nvssnhoauditor@gmail.com",
    "Intarnal auditor": "nvssnbria@gmail.com",
    "CEO": "csmanegar@gmail.com",
    "CAO (Niranjan)": "kambaliniranjan@gmail.com",
    "Credit Manager(Sachin)": "nvssncrmanager@gmail.com",
    "Shivanand CAO": "shivanand.v23@gmail.com",
  };

  const norm = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Build normalized map
  const map = {};
  for (const [k, v] of Object.entries(RAW)) map[norm(k)] = v;

  // Aliases (DB value normalized → mailids key normalized)
  const aliases = {
    "BASAVESHWARNAGAR": "BNAGAR",
    "HAGARIBOMMANALLI": "HAGARIBOMMANAHALLI",
    "HAUNSBHAVI": "HAUSABHAVI",
    "KUKNOOR": "KUKANOOR",
    "KUMARAPATTANA": "KUMARPATTANAM",
    "KUNDGOL": "KUNDAGOL",
    "MAGADI": "MAADI",
    "MISHRIKOTE": "MISHRIKOTI",
    "MUNDGOD": "MUNDAGOD",
    "SHIKARIPUR": "SHIKARIPURA",
    "SHIRALAKOPPA": "SHIRALKOPPA",
    "HEADOFFICE": "HEADOFFICE",
  };

  const FALLBACK = "nvssnhohvr@gmail.com"; // Head Office default

  window.lookupBranchEmail = function (location, department) {
    const locKey = norm(location);
    const aliasKey = aliases[locKey] || locKey;
    if (map[aliasKey]) return map[aliasKey];

    // HO department-specific
    if (/HEAD\s*OFFICE/i.test(location || "")) {
      const dep = norm(department);
      if (dep === "ACCOUNTS") return map[norm("H.O accounts")] || FALLBACK;
      if (dep === "CREDIT") return map[norm("H.O credit")] || FALLBACK;
      if (dep === "AUDIT") return map[norm("Intarnal auditor")] || FALLBACK;
      if (dep === "IT") return map[norm("H.O IT")] || FALLBACK;
      if (dep === "HR") return map[norm("NVSSN HR")] || FALLBACK;
    }
    return FALLBACK;
  };
})();
