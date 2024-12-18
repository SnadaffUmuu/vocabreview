import { Application } from "./app.js";
import { regex, stringToHash, shortestString } from "./utils.js";

export const DataFactory = {

  ENTRY_TAG: {
    counter : 'counter',
    geo : 'geo',
    grammar : 'grammar',
    name : 'name',
    onomatopoeia : 'onomatopoeia',
    pattern : 'pattern',
    term : 'term',
    yojijukugo : 'yojijukugo',
  },

  ENTRY_TYPE: {
    ALT_READING: 'ALT_READING',
    DEFAULT: 'DEFAULT',
    DEFAULT_EXAMPLES: 'DEFAULT_EXAMPLES',
    EXAMPLES_TRANSLATION: 'EXAMPLES_TRANSLATION',
    NON_STANDARD: 'NON_STANDARD',
    READING: 'READING',
    REMINDER: 'REMINDER',
    SIMPLE: 'SIMPLE',
  },

  LINE_TYPE: {
    HIRAGANA_ONLY: 'HIRAGANA_ONLY',
    KATAKANA_ONLY: 'KATAKANA_ONLY',
    KANA_ONLY: 'KANA_ONLY',
    WITH_KANJI: 'WITH_KANJI',
    JAPANESE_ONLY: 'JAPANESE_ONLY',
    MIXED: 'MIXED',
    NON_JAPANESE: 'NON_JAPANESE'
  },

  vocabFilesIndex: [
    'SR_Kona2',
    'SR_autumn',
    'goshogun0',
    'shirobanba',
    'kokugo-osarai',
    'SR_Nutshell',
    'SR-subway-attack',
    'hp1',
    'kana-enokura-kouson',
    'murakami-sheep-1',
    'SR_summer',
    'SR_Jam',
    'SR_spring',
    'SR_Obon_Society',
    'chat',
    'boxes_packs',
  ],

  kanaExcl: [
    '〜',
    '！',
    '、',
    ',',
    ' '
  ],

  toReplace: [
    '🎵',
    '✔',
    '♦',
    '▲',
    '*'
  ],

  nonEntrySymbols: [
    '==',
    '~~',
    '・・・'
  ],

  isNonJapaneseCharacter: (ch) => {
    regex.nonJapanese.test(ch)
  },

  /*
  isHiraganaCharacter: (ch) => {
    //return kanaExcl.includes(ch) || (ch >= "぀" && ch <= "ゟ")
    return DataFactory.kanaExcl.includes(ch) || regex.hiraganaRegex.test(ch)
  },
  
  isKatakanaCharacter: (ch) => {
    //return kanaExcl.includes(ch) || (ch >= "゠" && ch <= "・")
    return DataFactory.kanaExcl.includes(ch) || regex.katakanaRegex.test(ch)
  },
  
  isKanjiCharacter: (ch) => {
    return regex.kanjiRegex.test(ch)
  },

  /*
  isForReading: (str) => {
    return !Array.from(str.trim()).some(ch => !DataFactory.isHiraganaCharacter(ch)
      && !DataFactory.isKatakanaCharacter(ch)
      && !DataFactory.isKanjiCharacter(ch)
    )
  },
  */

  entryFilter: (entryStr) => {
    return !entryStr.startsWith('[')
      && !DataFactory.nonEntrySymbols.find(s => entryStr.indexOf(s) >= 0)
  },

  linesFilter: (l) => {
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
    const structure = [];
    let currentUpperSection = null;
    let currentSection = null;
    text.split('\n\n').forEach(entry => {
      if (entry.indexOf('~~') > -1) {
        const structureEntry = {
          name: entry.match(new RegExp(regex.upperSectionTitle))[1],
          index: structure.length,
        }
        structureEntry.id = stringToHash(JSON.stringify(structureEntry));
        structure.push(structureEntry)
        currentUpperSection = structureEntry.id;
      }
      if (entry.startsWith('[')) {
        const nameMatchGroups = entry.match(new RegExp(regex.pageLevelSection));
        const name = nameMatchGroups[1] + (nameMatchGroups.length > 1 && nameMatchGroups[2] != undefined ? nameMatchGroups[2] : '');
        let index = null;
        let parent = null;
        if (currentUpperSection) {
          parent = structure.find(o => o.id == currentUpperSection);
          index = parent.children ? parent.children.length : 0
        } else {
          index = structure.length
        }
        const structureEntry = {
          name: name,
          index: index
        }
        if (parent) {
          structureEntry.parentId = parent.id;
        }
        const hash = stringToHash(JSON.stringify(structureEntry));
        currentSection = hash;
        structureEntry.id = hash;
        if (parent) {
          if (parent.children) {
            parent.children.push(structureEntry)
          } else {
            parent.children = [structureEntry];
          }
        } else {
          structure.push(structureEntry)
        }
      }
      if (DataFactory.entryFilter(entry)) {
        const resEntry = {};
        let replaced = entry;
        DataFactory.toReplace.forEach(s => {
          replaced = replaced.replaceAll(s, '')
        });
        const originalLines = replaced.split('\n');
        const filteredLines = [];
        originalLines.forEach(l => {
          const lineText = l.trim()
          if (lineText.startsWith('::') && !lineText.startsWith('::diff')) {
            let tag = null;
            const parts = lineText.split('::');
            if ((parts.length) > 2) {
              tag = parts[1];
              resEntry.info = parts[2];
            } else {
              if (parts[1].startsWith('onomat')) {
                tag = 'onomatopoeia';
              } else {
                tag = parts[1];
              }
            }
            if (tag) {
              resEntry.tag = tag.trim();
            }
          } else {
            if (DataFactory.linesFilter(lineText)) {
              filteredLines.push(lineText.trim())
            } else if (lineText.replaceAll('\n', '').trim().length) {
              excludedLines.push(lineText)
            }
          }
        })
        //TODO: если kanaOnly КАТАКАНА, возможно, запись кандзи редкая и не является представительной
        //учесть порядок следования. индекс как фактор определения типа 
        if (filteredLines.length) {
          const entryType = DataFactory.guessEntryType(filteredLines, resEntry);
          const hiraganaOnly = DataFactory.getHiraganaOnly(filteredLines);
          const withKanji = DataFactory.getWithKanji(filteredLines);
          let pronounce = null;
          let pronounceTarget = null;
          if (entryType != DataFactory.ENTRY_TYPE.NON_STANDARD
            && hiraganaOnly.length == 1
            && withKanji.length > 0
            && !DataFactory.isHiraganaOnly(filteredLines[0])
            && !filteredLines[0].startsWith('〜')
          ) {
            pronounce = hiraganaOnly[0];
            pronounceTarget = shortestString(DataFactory.getWithKanji(filteredLines));
          };
          //const mataFilteredLines = pronounce && pronounceTarget ? filteredLines.filter(l => l != pronounce) : filteredLines;
          const mataFilteredLines = filteredLines;
          const resLines = mataFilteredLines.map((l, i) => {
            const isCompact = DataFactory.isNonJapanese(l) || DataFactory.isMixed(l);
            const lineTypes = DataFactory.getLineTypes(l, filteredLines);
            const lineObject = {
              text: l,
              originalIndex: i,
              speakable: DataFactory.isJapaneseOnly(l),
              isCompact: isCompact,
              linetypes : lineTypes,
            }
            if (pronounce && pronounceTarget) {

              if (lineObject.text == pronounceTarget) {
                lineObject.pronounce = pronounce;
              } else if (
                lineObject.text == pronounce
              ) {
                lineObject.isPronounce = true;
              }

            }
            return lineObject
          });
          resEntry.lines = resLines;
          if (entryType) {
            resEntry.entryType = entryType
          }
          /*
          const analyzedLines = DataFactory.getAnalyzedLines(filteredLines, resEntry);
          console.log('resEntry:');
          console.log(JSON.stringify(resEntry));
          console.log('analyzedLines');
          cosole.log(analyzedLines.map(o=> `[ ${o.text} ] : [ ${o.types.join('   ')} ]`).join('\n'));
          */
          if (currentSection) {
            resEntry.section = currentSection
          } else if (currentUpperSection) {
            resEntry.section = currentUpperSection
          }
          entries.push(resEntry)
        }
      } else {
        excludedEntries.push(entry)
      }
    })
    collection.allEntries = entries;
    console.log('tags', new Set(entries.filter(en => en.tag).map(en => en.tag)))
    if (excludedEntries.length) {
      collection.excludedEntries = excludedEntries;
    }
    if (excludedLines.length) {
      collection.excludedLines = excludedLines;
    }
    //console.log('structure', structure)
    collection.structure = structure;
    return collection;
  },

  getJapaneseOnly: (lines) => {
    return lines.filter(l => DataFactory.isJapaneseOnly(l))
  },

  getMixed: (lines) => {
    return lines.filter(l => DataFactory.isMixed(l))
  },

  getKanaOnly: (lines) => {
    return lines.filter(l => DataFactory.isKanaOnly(l))
  },

  getHiraganaOnly: (lines) => {
    return lines.filter(l => DataFactory.isHiraganaOnly(l))
  },

  getKatakanaOnly: (lines) => {
    return lines.filter(l => DataFactory.isKatakanaOnly(l))
  },

  getWithKanji: (lines) => {
    return lines.filter(l => DataFactory.isWithKanji(l))
  },

  getNonJapanese: (lines) => {
    return lines.filter(l => DataFactory.isNonJapanese(l))
  },

  isJapaneseOnly: (l) => {
    return regex.japaneseOnly.test(l)
  },

  isMixed: (l) => {
    return regex.mixed.test(l)
  },

  isKanaOnly: (l) => {
    return regex.kanaOnly.test(l)
  },

  isHiraganaOnly: (l) => {
    return regex.hiraganaOnly.test(l)
  },

  isKatakanaOnly: (l) => {
    return regex.katakanaOnly.test(l)
  },

  isWithKanji: (l) => {
    return regex.hasKanji.test(l)
  },

  isNonJapanese: (l) => {
    return regex.nonJapanese.test(l)
  },

  getAnalyzedLines(lines, entry) {
    const lType = DataFactory.LINE_TYPE
    return lines.map(l => {
      let types = [];
      if (DataFactory.isMixed(l)) types.push(lType.MIXED);
      if (DataFactory.isNonJapanese(l)) types.push(lType.NON_JAPANESE);
      if (DataFactory.isJapaneseOnly(l)) types.push(lType.JAPANESE_ONLY);
      if (DataFactory.isWithKanji(l)) types.push(lType.WITH_KANJI);
      if (DataFactory.isKanaOnly(l)) types.push(lType.KANA_ONLY);
      if (DataFactory.isKatakanaOnly(l)) types.push(lType.KATAKANA_ONLY);
      if (DataFactory.isHiraganaOnly(l)) types.push(lType.HIRAGANA_ONLY);
      return {
        text: l,
        types: types
      }
    })
  },

  getLineTypes(l) {
    const lType = DataFactory.LINE_TYPE;
    let types = [];
    if (DataFactory.isMixed(l)) types.push(lType.MIXED);
    if (DataFactory.isNonJapanese(l)) types.push(lType.NON_JAPANESE);
    if (DataFactory.isJapaneseOnly(l)) types.push(lType.JAPANESE_ONLY);
    if (DataFactory.isWithKanji(l)) types.push(lType.WITH_KANJI);
    if (DataFactory.isKanaOnly(l)) types.push(lType.KANA_ONLY);
    if (DataFactory.isKatakanaOnly(l)) types.push(lType.KATAKANA_ONLY);
    if (DataFactory.isHiraganaOnly(l)) types.push(lType.HIRAGANA_ONLY); 
    return types;
  },

  guessEntryType (lines, entry) {
    const types = DataFactory.ENTRY_TYPE;
    const tag = DataFactory.ENTRY_TAG;
    const lTypes = DataFactory.LINE_TYPE;
    const length = lines.length;
    
    let res = types.NON_STANDARD;

    const typedLines = lines.map((l,i) => {
      return {
        index: l.i,
        text: l,
        types : DataFactory.getLineTypes(l)
      }
    });

    const japaneseOnly = DataFactory.getJapaneseOnly(lines);
    const mixed = DataFactory.getMixed(lines);
    const nonJapanese = DataFactory.getNonJapanese(lines);
    const kanaOnly = DataFactory.getKanaOnly(lines);
    const withKanji = DataFactory.getWithKanji(lines);

    if (
      length == 1
    ) {
      res = types.REMINDER
    } else if (
      length == 2
      && withKanji.length == 1
      && mixed.length == 0
      && nonJapanese.length == 0
      && kanaOnly.length == 1
    ) {
      res = types.READING
    } else if (
      length == 2
      &&
      (
        kanaOnly.length == 0
        && withKanji.length == 1
        && nonJapanese.length == 1
        ||
        kanaOnly.length == 1
        && 
        (
          nonJapanese.length == 1
          || mixed.length == 1
        )
      )
    ) {
      res = types.SIMPLE
    } else if (
      length == 3
      && kanaOnly.length == 1
      &&
      (
        japaneseOnly.length == 2
        && withKanji.length == 1
        && nonJapanese.length == 1
        ||
        japaneseOnly == 2
        && mixed == 1
      )
    ) {
      res = types.DEFAULT
    } else if (
      length > 3
      && kanaOnly.length == 1
      && nonJapanese.length == 1
      && withKanji.length > 1
      && mixed.length == 0
    ) {
      res = types.DEFAULT_EXAMPLES
    } else if (
      length > 3
      && kanaOnly.length == 1
      && japaneseOnly.length > 2
      && withKanji.length > 1
      && nonJapanese.length > 1
    ) {
      res = types.EXAMPLES_TRANSLATION
    } else {
      res = types.NON_STANDARD
    }
    return res;
  },

  filter: (entries) => {
    return Application.data.allEntries.filter(entry => entries.includes(entry.section))
  }
}

/*
line 0 non japanese:
console.log(App.data.allEntries.filter(en => DF.isNonJapanese(en.lines[0].text)).map(en => en.lines.map(l => l.text).join(' - ')).join('\n'))

line 0 starts with tilda
console.log(App.data.allEntries.filter(en => DF.isJapaneseOnly(en.lines[0].text) && en.lines[0].text.startsWith('〜')).map(en => en.lines.map(l => l.text).join(' - ')).join('\n'))
*/
