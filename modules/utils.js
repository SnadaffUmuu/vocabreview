export const regex = {
  //japaneseRegex: /[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}]/u,
  //hiraganaRegex: /[\p{Script_Extensions=Hiragana}]/u,
  //katakanaRegex: /[\p{Script_Extensions=Katakana}]/u,
  //kanjiRegex: /^[\p{Script=Han}]$/u,
  //nonJapaneseRegex: /[\p{Script=Cyrillic}\p{Script=Latin}]/u,
  hasKanji: /[\p{Script=Han}]/u,
  kanaOnly: /^[\p{Script=Hiragana}\p{Script=Katakana}\p{N}\p{P}\s\p{S}\p{Z}ー]+$/u,
  hiraganaOnly: /^[\p{Script=Hiragana}\p{N}\p{P}\s\p{S}\p{Z}ー]+$/u,
  katakanaOnly: /^[\p{Script=Katakana}\p{N}\p{P}\s\p{S}\p{Z}ー]+$/u,
  nonJapanese: /^[\p{Script=Cyrillic}\p{Script=Latin}\p{N}\p{P}\s\p{S}\p{Z}ー]+$/u,
  japaneseOnly: /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{N}\p{P}\s\p{S}\p{Z}ー]+$/u,
  mixed: /^(?=.*[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}])(?=.*[\p{Script=Latin}\p{Script=Cyrillic}])[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Latin}\p{Script=Cyrillic}\p{N}\p{P}\s\p{S}\p{Z}ー]+$/u,
  upperSectionTitle: /~~\n(.*)\n~~/u,
  pageLevelSection: /\[(.*)\]((.*))?/u,
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

export function shortestString(arr) {
  let minLength = Math.min(...arr.map(str => str.length));
  return arr.find(str => str.length === minLength);
}

export function setSelectOption(select, value) {
  const options = Array.from(select.querySelectorAll('option'));
  const matched = options.find(o => o.value == value);
  options.forEach(o => o.removeAttribute('selected'));
  if (matched) {
    matched.setAttribute('selected', true);
  }
}
