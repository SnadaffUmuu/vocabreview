import { Application } from "./app.js";
import {
  regex,
  stringToHash,
  shortestString,
  countCharOccurrencesInString
} from "./utils.js";

export const DataFactory = {

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

  ENTRY_TAG: {
    counter: 'counter',
    geo: 'geo',
    grammar: 'grammar',
    name: 'name',
    onomatopoeia: 'onomatopoeia',
    pattern: 'pattern',
    term: 'term',
    yojijukugo: 'yojijukugo',
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
    SIMPLE_EXAMPLES: 'SIMPLE_EXAMPLES',
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

  LINE_ROLE: {
    expression: 'expression',
    reading: 'reading',
    meaning: 'meaning',
    alt_reading: 'alt_reading',
    example: 'example',
    example_translation: 'example_translation',
    info: 'info',
  },

  kanaExcl: [
    '〜',
    '！',
    '、',
    ',',
    ' '
  ],

  toReplace: [
    '🎵',
    '    ♪',
    '✔',
    '♦',
  ],

  reviewLevelMarks: [
    '▲',
    '*',
  ],

  nonEntrySymbols: [
    '==',
    '~~',
    '・・・'
  ],

  isNonJapaneseCharacter: (ch) => {
    regex.nonJapanese.test(ch)
  },

  getEntryInfoString: (entry, forHtml) => {
    const lineBreak = forHtml ? '<br>' : '\n';
    
    let entryInfo = (entry.tag ? 'entryTag: ' + entry.tag + lineBreak : '')
      + (entry.reviewLevel !== undefined ? 'reviewLevel: ' + entry.reviewLevel + lineBreak : '')
      + entry.entryType + lineBreak
      + (entry.reversed ? 'REVERSED' + lineBreak : '')
      + (entry.info !== undefined ? 'info: ' + entry.info + lineBreak : '')
      + 'lines: ' + entry.lines.length;

    entryInfo += entry.lines.map(line => {
      return lineBreak + line.originalIndex + lineBreak
        + line.text + lineBreak
        + (line.role ? 'role: ' + line.role + lineBreak : '')
        + 'speakable:' + line.speakable + ';' + (line.role && line.role == DataFactory.LINE_ROLE.reading ? ' isReading' : '')
        + (line.reading ? ' reading:' + line.reading : '') + lineBreak
        + (line.translationLineIndex ? ' translationLineIndex: ' + line.translationLineIndex + lineBreak : '')
        + line.linetypes.join(', ')
    }).join('');

    return entryInfo;
  },

  getEntryShortInfoString: (entry, forHtml) => {
    const lineBreak = forHtml ? '<br>' : '\n';
    let entryInfo = (entry.tag ? 'entryTag: ' + entry.tag + lineBreak : '')
    entryInfo += entry.lines.map(line => line.text + lineBreak).join('') + lineBreak;
    return entryInfo;
  },

  getEntryShortInfoString2: (entry, forHtml, insertLastBreak) => {
    const lineBreak = forHtml ? '<br>' : '\n';
    
    let entryInfo = (entry.tag ? 'entryTag: ' + entry.tag + lineBreak : '')
    + (entry.info !== undefined ? 'info: ' + entry.info + lineBreak : '');

    entryInfo += entry.lines.map(line => 
      line.text + lineBreak
      + (line.role ? 'role: ' + line.role + lineBreak : '')
      ).join('')
    + entry.entryType + lineBreak + (insertLastBreak ? lineBreak : '');
    
    return entryInfo;
  },

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
    //breaking for entries
    let entriesCounter = 0;
    text.split('\n\n').forEach(entry => {
      //building structure
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
      //handling true entries
      if (DataFactory.entryFilter(entry)) {
        const resEntry = {
          originalIndex : entriesCounter++
        };
        if (currentSection) {
          resEntry.section = currentSection
        } else if (currentUpperSection) {
          resEntry.section = currentUpperSection
        }
        let replaced = entry;
        DataFactory.toReplace.forEach(s => {
          replaced = replaced.replaceAll(s, '')
        });
        const originalLines = replaced.split('\n');
        const filteredLines = [];
        //meta lines: tags and review marks
        originalLines.forEach(l => {
          let lineText = l.trim();
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
              if (DataFactory.reviewLevelMarks.some(m => lineText.endsWith(m))) {
                const triangle = DataFactory.reviewLevelMarks[0];
                const asterisk = DataFactory.reviewLevelMarks[1];
                if (lineText.endsWith(triangle)) {
                  const triangleCount = countCharOccurrencesInString(lineText, triangle);
                  resEntry.reviewLevel = triangleCount + '00';
                } else if (lineText.endsWith(asterisk)) {
                  const asteriskCount = countCharOccurrencesInString(lineText, asterisk);
                  resEntry.reviewLevel = asteriskCount;
                }
                lineText = DataFactory.reviewLevelMarks.reduce(
                  (lineText, m) => lineText.replaceAll(m, '').trim(),
                  lineText
                );
              }
              filteredLines.push(lineText)
            } else if (lineText.replaceAll('\n', '').trim().length) {
              excludedLines.push(lineText)
            }
          }
        })

        //TODO: если kanaOnly КАТАКАНА, возможно, запись кандзи редкая и не является представительной
        //учесть порядок следования. индекс как фактор определения типа 
        if (filteredLines.length) {
          const entryType = DataFactory.guessEntryType(filteredLines, resEntry);
          resEntry.entryType = entryType;
          const resLines = filteredLines.map((l, i) => {
            const isCompact = DataFactory.isNotJapaneseOnly(l);
            const isSpeakable = DataFactory.isJapaneseOnly(l) 
              || DataFactory.isJapaneseWithEigaChars(l);
            const lineTypes = DataFactory.getLineTypes(l, filteredLines);
            const lineObject = {
              text: l,
              originalIndex: i,
              speakable: isSpeakable,
              isCompact: isCompact,
              linetypes: lineTypes,
            }
            return lineObject
          });
          resEntry.lines = resLines;
          DataFactory.setLineRoles(resEntry);
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

  getNotJapaneseOnly: (lines) => {
    return lines.filter(l => DataFactory.isNonJapanese(l) || DataFactory.isMixed(l))
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
    return (regex.japaneseOnly.test(l) 
      || regex.mixed.test(l) 
        && DataFactory.isJapaneseWithEigaChars(l))
      && Array.from(l).some(ch => 
        regex.hasKanji.test(l));
  },

  isNonJapanese: (l) => {
    return regex.nonJapanese.test(l)
  },

  isNotJapaneseOnly: (l) => {
    return (regex.nonJapanese.test(l)
      || regex.mixed.test(l) && !DataFactory.isJapaneseWithEigaChars(l))
  },

  isJapaneseWithEigaChars: (l) => {
    const jaChars = Array.from(l).filter(ch => 
      DataFactory.isJapaneseOnly(ch)
        && !regex.nonChars.test(ch)
    );
    const nonJaChars = Array.from(l).filter(ch => 
      DataFactory.isNonJapanese(ch)
        && !regex.nonChars.test(ch)
    );
    return jaChars.length > nonJaChars.length
  },

  setLineRoles(entry) {
    const lRoles = DataFactory.LINE_ROLE;
    const lines = entry.lines;

    let lMeaning = null;
    let lExpression = null;

    const firstNotJpOnly = lines.find(l => 
      DataFactory.isNotJapaneseOnly(l.text));

    if (firstNotJpOnly) {
      firstNotJpOnly.role = lRoles.meaning;
      lMeaning = firstNotJpOnly;
    } else if (lines[1]) {
      lines[1].role = lRoles.meaning;
      lMeaning = lines[1];
    }
    if (DataFactory.isNotJapaneseOnly(lines[0].text)) {
      lines[1].role = lRoles.expression;
      lExpression = lines[1];
      entry.reversed = true;
      lines[0].role = lRoles.meaning;
      lMeaning = lines[0];
    } else {
      lines[0].role = lRoles.expression
      lExpression = lines[0];
    }
    
    let lReading = null;
    let lReadingTarget = null;
    const firstHiraganaOnlyLine = lines.find(l => 
      DataFactory.isHiraganaOnly(l.text));
      
    const linesWithKanji = DataFactory.getWithKanji(lines.map(l => l.text));

    if (firstHiraganaOnlyLine
      && linesWithKanji.length > 0
    ) {
      if (
        //линия "только хирагана" не первая, а первая не начинается с 〜
        firstHiraganaOnlyLine.originalIndex > 0
        && !lines[0].text.startsWith('〜')
      ) {
        lReading = firstHiraganaOnlyLine;
        lReadingTarget = lines.find(l => l.text == shortestString(linesWithKanji));
      } else if (
        //первая начинается с 〜 и она с кандзи, 
        lines[0].text.startsWith('〜')
        && DataFactory.isWithKanji(lines[0].text)
        && firstHiraganaOnlyLine.originalIndex == 1
      ) {
        lReading = firstHiraganaOnlyLine;
        lReadingTarget = lines[0];
      }
    };
    
    if (lReading && lReadingTarget) {
      lReading.role = lRoles.reading
      lReadingTarget.reading = lReading.text;
    }

    const remainingLines = lines.filter(l => !l.role);

    remainingLines.forEach(l => {
      const prevLine = lines[l.originalIndex - 1];
      if (!entry.reversed && prevLine 
        && prevLine.role && prevLine.role !== lRoles.example
        && DataFactory.isNotJapaneseOnly(l.text)) {
        //предыдущая строка имеет роль, а данная - следующая и не японская, т.е. разъяснение
        l.role = lRoles.info;
      } else if ((DataFactory.isJapaneseOnly(l.text)
        || DataFactory.isJapaneseWithEigaChars(l.text)
        )) {
          l.role = lRoles.example;
      } else if (prevLine && prevLine.role && prevLine.role == lRoles.example
        && DataFactory.isNotJapaneseOnly(l.text)) {
          l.role = lRoles.example_translation;
          prevLine.translationLineIndex = l.originalIndex;
      }
    });
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

  guessEntryType(lines, entry) {
    const types = DataFactory.ENTRY_TYPE;
    const tag = DataFactory.ENTRY_TAG;
    const lTypes = DataFactory.LINE_TYPE;
    const length = lines.length;

    let res = types.NON_STANDARD;

    const typedLines = lines.map((l, i) => {
      return {
        index: i,
        text: l,
        types: DataFactory.getLineTypes(l)
      }
    });

    const japaneseOnly = DataFactory.getJapaneseOnly(lines);
    const mixed = DataFactory.getMixed(lines);
    const nonJapanese = DataFactory.getNonJapanese(lines);
    const kanaOnly = DataFactory.getKanaOnly(lines);
    const hiraganaOnly = DataFactory.getHiraganaOnly(lines);
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
      && japaneseOnly.length == 1
      &&
      (
        nonJapanese.length == 1
        || mixed.length == 1
      )
    ) {
      res = types.SIMPLE
    } else if (
      length > 2
      &&
      japaneseOnly.length > 1
      &&
      (
        kanaOnly.length == 0
        || typedLines[0].types.includes(lTypes.KANA_ONLY)
      )
      &&
      (
        nonJapanese.length == 1
        && mixed.length == 1
      )
    ) {
      res = types.SIMPLE_EXAMPLES
    } else if (
      length == 2
      && japaneseOnly.length == 2
      && kanaOnly.length == 0
    ) {
      res = types.ALT_READING
    } else if (
      length == 3
      && hiraganaOnly.length == 1
      && japaneseOnly.length == 2
      &&
      (
        nonJapanese.length == 1
        || mixed.length == 1
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