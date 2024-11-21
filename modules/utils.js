const regex = {
  japaneseRegex: /[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}]/u,
  hiraganaRegex: /[\p{Script_Extensions=Hiragana}]/u,
  katakanaRegex: /[\p{Script_Extensions=Katakana}]/u,
  kanjiRegex: /[\p{Script_Extensions=Han}]/u,
  nonJapaneseRegex: /[\p{Script=Cyrillic}\p{Script=Latin}]/u
}