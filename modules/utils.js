export const regex = {
  japaneseRegex: /[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}]/u,
  hiraganaRegex: /[\p{Script_Extensions=Hiragana}]/u,
  katakanaRegex: /[\p{Script_Extensions=Katakana}]/u,
  kanjiRegex: /[\p{Script_Extensions=Han}]/u,
  nonJapaneseRegex: /[\p{Script=Cyrillic}\p{Script=Latin}]/u,
  upperSectionTitle : /~~\n(.*)\n~~/u,
  pageLevelSection : /\[(.*)\]((.*))?/u,
}

export function speak(text) {
  console.log('speak', text)
  const utterThis = new SpeechSynthesisUtterance(text);
  utterThis.lang = isAndroid() ? "ja_JP" : "ja-JP";
  setTimeout(() => {
    window.speechSynthesis.speak(utterThis);
  }, 0)
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function isAndroid() {
  return navigator.userAgent.toLowerCase().indexOf("android") > -1
}

export function stringToHash(string) {
  var hash = 0;
  if (string.length == 0) return hash;

  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return hash;
}