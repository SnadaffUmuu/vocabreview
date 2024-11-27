export const regex = {
  japaneseRegex: /[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}]/u,
  hiraganaRegex: /[\p{Script_Extensions=Hiragana}]/u,
  katakanaRegex: /[\p{Script_Extensions=Katakana}]/u,
  kanjiRegex: /[\p{Script_Extensions=Han}]/u,
  nonJapaneseRegex: /[\p{Script=Cyrillic}\p{Script=Latin}]/u
}

export function speak(el, datasetParam) {
  const param = datasetParam ? datasetParam : 'reading';
  if (el.dataset && el.dataset[param]) {
    console.log('speak', el.dataset[param])

    const utterThis = new SpeechSynthesisUtterance(el.dataset[param]);
    utterThis.lang = isAndroid() ? "ja_JP" : "ja-JP";
    setTimeout(() => {
      window.speechSynthesis.speak(utterThis);
    }, 0)
  }
}

export function shuffleArray (array) {
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