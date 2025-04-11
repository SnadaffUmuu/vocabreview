import {
  regex,
  stringToHash,
  countCharOccurrencesInString
} from "./utils.js";

export const DataFactory = {

  globalPool : 'global',

  vocabFilesIndex: [
    'test',
    'SR_Kona2',
    'SR_autumn',
    'SR_yuyu',
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
    'global',
  ],  

  ENTRY_TAG: {
    grammar: 'grammar',
    onomatopoeia: 'onomatopoeia',
    geo: 'geo',
    name: 'name',
    term: 'term',
    yojijukugo: 'yojijukugo',
    pattern: 'pattern',
    counter: 'counter',
    suffix: 'suffix',
    dialect: 'dialect',
  },

  buildLegendHtml() {
    const tagsHtml = Object.values(DataFactory.ENTRY_TAG).reduce((res, currentTag, i) => {
      res += `<div data-tag="${currentTag}"><span>${currentTag}</span></div>`;
      return res;
    }, '');
    return `<div class="tagsLegend">${tagsHtml}</div>`;
  },

  LINE_ROLE: {
    expression: 'expression',
    reading: 'reading',
    meaning: 'meaning',
    alt_reading: 'alt_reading',
    example: 'example',
    example_translation: 'example_translation',
    unknown: 'unknown',
  },

  lineOrders: {
    'expression' : [
      'expression',
      'alt_reading',
      'example',
      'meaning',
      'example_translation',
      'reading',
      'unknown',
    ],
    'meaning' : [
      'meaning',
      'expression',
      'alt_reading',
      'example_translation',
      'example',
      'reading',
      'unknown',
    ],
    'example' : [
      'example',
      'expression',
      'alt_reading',
      'meaning',
      'example_translation',
      'reading',
      'unknown',
    ],
    'example_translation' : [
      'example_translation',
      'example',
      'meaning',
      'expression',
      'alt_reading',
      'reading',
      'unknown',
    ],
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
    text.split('\n\n').forEach(entryObj => {
      //building structure
      const entry = entryObj.trim();
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

        if (filteredLines.length) {
          //const entryType = DataFactory.guessEntryType(filteredLines, resEntry);
          //resEntry.entryType = entryType;
          const resLines = filteredLines.map((l, i) => {
            const isCompact = DataFactory.isNotJapaneseOnly(l);
            const isSpeakable = DataFactory.isJapaneseOnly(l) 
              || DataFactory.isJapaneseWithEigaChars(l);
            //const lineTypes = DataFactory.getLineTypes(l, filteredLines);
            return {
              text: l,
              originalIndex: i,
              speakable: isSpeakable,
              isCompact: isCompact,
              // linetypes: lineTypes,
            }
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
    //if (jaChars.length && nonJaChars.length && nonJaChars.length <= 5 && nonJaChars.length > 3) debugger;
    //return jaChars.length > nonJaChars.length
    //return nonJaChars.length/l.length*100
    return jaChars.length && nonJaChars.length <= 3
  },

  setLineRoles(entry) {
    const lRoles = DataFactory.LINE_ROLE;
    const lines = entry.lines;
    const inBracketsRegexp = new RegExp(/^\(.*\)$/);

    const meanings = []

    const firstNotJpOnly = lines.find(l => 
      DataFactory.isNotJapaneseOnly(l.text));
    
    //строка начинается на "=" это всегда meaning
    const lineThatStartsWithEqual = lines.find(l =>
      Array.from('=＝').some(ch => l.text.startsWith(ch)));

    if (lineThatStartsWithEqual) {
      lineThatStartsWithEqual.role = lRoles.meaning;
      lineThatStartsWithEqual.theSameAs = true;
      meanings.push(lineThatStartsWithEqual);

      const altMeaning = [
        lines[lineThatStartsWithEqual.originalIndex + 1],
        lines[lineThatStartsWithEqual.originalIndex - 1]
      ].find(l =>
        l && DataFactory.isNotJapaneseOnly(l.text)
        && !inBracketsRegexp.test(l.text));

      if (altMeaning) {
        altMeaning.role = lRoles.meaning;
        meanings.push(altMeaning);
      }
    } 
    //первая неяпонская - это meaning, если не было кейса с началом на =
    if (!meanings.length && firstNotJpOnly
      && !inBracketsRegexp.test(firstNotJpOnly.text)) {
      firstNotJpOnly.role = lRoles.meaning;
      meanings.push(firstNotJpOnly);
    } 

    //если первая неяпонская, то это инверсия и это всегда meaning
    //тогда следующая за ней - это всегда выражение
    if (DataFactory.isNotJapaneseOnly(lines[0].text)) {
      lines[0].role = lRoles.meaning;
      lines[1].role = lRoles.expression;
      entry.reversed = true;
      meanings.push(lines[0]);
    } else {
      //а так вообще первая строка - это всегда выражение
      lines[0].role = lRoles.expression;
      /*
      if (firstNotJpOnly
        && !inBracketsRegexp.test(firstNotJpOnly.text)) {
        firstNotJpOnly.role = lRoles.meaning;
      }
      */
    }

    let lReading = null;
    const firstHiraganaOnlyLine = lines.find(l => 
      DataFactory.isHiraganaOnly(l.text));
    const linesWithKanji = lines.filter(l => DataFactory.isWithKanji(l.text));

    if (firstHiraganaOnlyLine
      && linesWithKanji.length > 0
    ) {
      if (
        //линия "только хирагана" не первая, а первая не начинается с 〜
        firstHiraganaOnlyLine.originalIndex > 0
        && !lines[0].text.startsWith('〜')
      ) {
        lReading = firstHiraganaOnlyLine;
        //lReadingTarget = lines.find(l => l.text == shortestString(linesWithKanji));
      } else if (
        //первая начинается с 〜 и она с кандзи, 
        lines[0].text.startsWith('〜')
        && DataFactory.isWithKanji(lines[0].text)
        && firstHiraganaOnlyLine.originalIndex == 1
      ) {
        lReading = firstHiraganaOnlyLine;
        //lReadingTarget = lines[0];
      }
    };
    
    //if (lReading && lReadingTarget) {
    if (lReading) {
      lReading.role = lRoles.reading
      //lReadingTarget.reading = lReading.text;
    }

    /*
    if (meanings.length) {
      const lineStartingWithEquals = lines.find(l => Array.from('=＝').some(ch => l.text.startsWith(ch)));
      if (lineStartingWithEquals) {
        lineStartingWithEquals.role = lRoles.meaning;
        lineStartingWithEquals.theSameAs = true;
      }
    }
    */
    let remainingLines = lines.filter(l => !l.role);
    let infoRoleLine = null;

    remainingLines.forEach(l => {
      const prevLine = lines[l.originalIndex - 1];
      if (!entry.reversed && prevLine 
        && prevLine.role && prevLine.role !== lRoles.example
        && DataFactory.isNotJapaneseOnly(l.text)) {
        //предыдущая строка имеет роль, а данная - следующая и не японская, т.е. разъяснение
        // l.role = lRoles.info;
        if (entry.info) {
          entry.info = entry.info + '\n' + l.text;
        } else {
          entry.info = l.text;
          infoRoleLine = l;
        }
      } else if ((DataFactory.isJapaneseOnly(l.text)
        || DataFactory.isJapaneseWithEigaChars(l.text)
        ) && !Array.from('(=＝').some(ch => l.text.startsWith(ch))) {
          l.role = lRoles.example;
      } else if (prevLine && prevLine.role && prevLine.role == lRoles.example
        && DataFactory.isNotJapaneseOnly(l.text)) {
          l.role = lRoles.example_translation;
          prevLine.translationLineIndex = l.originalIndex;
      }
    });

    if (infoRoleLine) {
      lines.splice(lines.indexOf(infoRoleLine), 1);
      remainingLines.splice(remainingLines.indexOf(infoRoleLine), 1);
    }

    remainingLines = lines.filter(l => !l.role).forEach(l => {
      if (DataFactory.isJapaneseOnly(l.text) 
        && inBracketsRegexp.test(l.text)) {
        l.role = lRoles.alt_reading
      }
    });

    //if (lines.find(l => !l.role)) debugger;
      
    remainingLines = lines.filter(l => !l.role).forEach(l =>
      l.role = lRoles.unknown);
  },
}
