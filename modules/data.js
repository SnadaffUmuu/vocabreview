import { regex } from "./utils.js";

export const DataFactory = {

  vocabFilesIndex : [
    'chat',
    'hp1',
    'kana-enokura-kouson',
    'murakami-sheep-1',
    'SR_autumn',
    'SR_Kona2',
    'SR_Obon_Society',
    'SR_summer',
    'boxes_packs',
    'goshogun0',
    'kokugo-osarai',
    'shirobanba',
    'SR_Jam',
    'SR_Nutshell',
    'SR_spring'
  ],

  isHiraganaCharacter : (ch) => {
    return kanaExcl.includes(ch) || hiraganaRegex.test(ch)
  },
  
  isKatakanaCharacter : (ch) => {
    return kanaExcl.includes(ch) || katakanaRegex.test(ch)
  },
  
  isKanjiCharacter : (ch) => {
    return kanjiRegex.test(ch)
  },

  kanaExcl : [
    '〜',
    '！',
    '、',
    ',',
    ' '
  ],
  
  toReplace : [
    '🎵',
    '✔',
    '♦'
  ],
  
  exclude : [
    '==',
    '~~',
    '・・・'
  ],

  isHiraganaCharacter : (ch) => {
    //return kanaExcl.includes(ch) || (ch >= "぀" && ch <= "ゟ")
    return DataFactory.kanaExcl.includes(ch) || regex.hiraganaRegex.test(ch)
  },

  isKatakanaCharacter : (ch) => {
    //return kanaExcl.includes(ch) || (ch >= "゠" && ch <= "・")
    return DataFactory.kanaExcl.includes(ch) || regex.katakanaRegex.test(ch)
  },

  isKanjiCharacter : (ch) => {
    return kanjiRegex.test(ch)
    /*
    return (ch >= "一" && ch <= "龯") ||
      (ch >= "㐀" && ch <= "䶿");
    */
  },

  isForReading : (str) => {
    return !Array.from(str.trim()).some(ch => !DataFactory.isHiraganaCharacter(ch) && !DataFactory.isKatakanaCharacter(ch))
  },

  entriesFilter : (entryStr) => {
    return !entryStr.startsWith('[')
      && !DataFactory.exclude.find(s => entryStr.indexOf(s) >= 0)
  },

  linesFilter : (l) => {
    return (
      !l.startsWith('?')
      && !l.startsWith('？')
      && !l.startsWith('::')
      && l.trim().replaceAll('\n', '').length
    )
  },

  parse: (test) => {
    let excludedEntries = [];
    let excludedLines = [];
    let entries = [];
    test.split('\n\n').forEach(entry => {
      if (DataFactory.entriesFilter(entry)) {
        const resEntry = {};
        let replaced = entry;
        DataFactory.toReplace.forEach(s => {
          replaced = replaced.replaceAll(s, '')
        });
        const originalLines = replaced.split('\n');
        const filteredLines = [];
        originalLines.forEach(l => {
          if (l.startsWith('::')) {
            resEntry.type = l.trim().split(' ')[0].split('::')[1];
          }
          if (DataFactory.linesFilter(l)) {
            filteredLines.push(l)
          } else if (l.replaceAll('\n', '').trim().length) {
            excludedLines.push(l)
          }
        })
        if (filteredLines.length) {
          resEntry.lines = filteredLines
          entries.push(resEntry)
        }
      } else {
        excludedEntries.push(entry)
      }
    })
    /*
    console.log('total', entries.length)
    console.log('entries', entries.map(en => en.lines));
    console.log('types', new Set(entries.filter(en => en.type).map(en => en.type)))
    if (excludedEntries.length) {
      console.log('excluded entries', excludedEntries);
    }
    if (excludedLines.length) {
      console.log('excluded lines', excludedLines);
    }
    */
    return entries;
  }
}