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
  
  nonEntrySymbols : [
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
    return regex.kanjiRegex.test(ch)
    /*
    return (ch >= "一" && ch <= "龯") ||
      (ch >= "㐀" && ch <= "䶿");
    */
  },

  isForReading : (str) => {
    return !Array.from(str.trim()).some(ch => !DataFactory.isHiraganaCharacter(ch) 
      && !DataFactory.isKatakanaCharacter(ch)
      && !DataFactory.isKanjiCharacter(ch)
    )
    //return !Array.from(str.trim()).some(ch => !DataFactory.isHiraganaCharacter(ch) && !DataFactory.isKatakanaCharacter(ch))
  },

  entriesFilter : (entryStr) => {
    return !entryStr.startsWith('[')
      && !DataFactory.nonEntrySymbols.find(s => entryStr.indexOf(s) >= 0)
  },

  linesFilter : (l) => {
    return (
      !l.startsWith('?')
      && !l.startsWith('？')
      && !l.startsWith('::')
      && l.trim().replaceAll('\n', '').length
    )
  },

  parse: (text) => {
    const collection = {};
    let excludedEntries = [];
    let excludedLines = [];
    let entries = [];
    text.split('\n\n').forEach(entry => {
      if (DataFactory.entriesFilter(entry)) {
        const resEntry = {};
        let replaced = entry;
        DataFactory.toReplace.forEach(s => {
          replaced = replaced.replaceAll(s, '')
        });
        const originalLines = replaced.split('\n');
        const filteredLines = [];
        originalLines.forEach(l => {
          const lineText = l.trim()
          if (lineText.startsWith('::')) {
            let type = null;
            const parts = lineText.split('::');
            if ((parts.length) > 2) {
              type = parts[1];
              resEntry.info = parts[2];
            } else {
              if (parts[1].startsWith('onomat')) {
                type = 'onomatopoeia';
              } else {
                type = parts[1];
              }
            }
            if (type) {
              resEntry.type = type;
            }
          } else {
            if (DataFactory.linesFilter(lineText)) {
              filteredLines.push(lineText)
            } else if (lineText.replaceAll('\n', '').trim().length) {
              excludedLines.push(lineText)
            }
          }
        })
        if (filteredLines.length) {
          const resLines = filteredLines.map((l, i) => {
            const lineObject = {
              text : l,
              originalIndex : i,
              speakable : DataFactory.isForReading(l),
              isTranslation : regex.nonJapaneseRegex.test(l)
            }

            return lineObject
          })
          resEntry.lines = resLines
          entries.push(resEntry)
        }
      } else {
        excludedEntries.push(entry)
      }
    })
    collection.entries = entries;
    /*
    console.log('types', new Set(entries.filter(en => en.type).map(en => en.type)))
    */
   if (excludedEntries.length) {
      collection.excludedEntries = excludedEntries;
    }
    if (excludedLines.length) {
      collection.excludedLines = excludedLines;
    }
    return collection;
  }
}