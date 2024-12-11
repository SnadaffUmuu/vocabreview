const regex = {
  hasKanji: /[\p{Script=Han}]/u,
  kanaOnly: /^[\p{Script=Hiragana}\p{Script=Katakana}\p{N}\p{P}\s\p{S}\p{Z}]+$/u,
  hiraganaOnly: /^[\p{Script=Hiragana}\p{N}\p{P}\s\p{S}\p{Z}]+$/u,
  katakanaOnly: /^[\p{Script=Katakana}\p{N}\p{P}\s\p{S}\p{Z}]+$/u,
  nonJapanese: /^[\p{Script=Cyrillic}\p{Script=Latin}\p{N}\p{P}\s\p{S}\p{Z}]+$/u,
  japaneseOnly: /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{N}\p{P}\s\p{S}\p{Z}]+$/u,
  mixed: /^(?=.*[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}])(?=.*[\p{Script=Latin}\p{Script=Cyrillic}])[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Latin}\p{Script=Cyrillic}\p{N}\p{P}\s\p{S}\p{Z}]+$/u,
}

const lines = [
  '＝急がせる',
  'こんにちは、世界？',
  'コーヒーが好き？',
  'Hello? 世界！',
  'Hello ＝ こんにちは',
  '＝のでは　＝のではないか',
  '＝I guess',
]

for (expression in regex) {
  console.log(expression)
}