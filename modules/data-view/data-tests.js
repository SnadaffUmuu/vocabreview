import { DataFactory } from "../data.js"

export const DataTests = {
  
  revLevels : {
    100 : 'white',
    200 : 'cyan',
    300 : 'yellow',
  },

  entryFormatters : {
    getEntryShortInfoString2 : function (entry, forHtml) {
      const lineBreak = forHtml ? '<br>' : '\n';
      let entryInfo = (entry.tag ? 'entryTag: ' + entry.tag + lineBreak : '');
      entryInfo += entry.lines.map((line, i) => {
        let templ = `${line.text}`;
        if (line.isPronounce) {
          templ = `<span style="border-bottom:1px dotted">${line.text}</span>`
        } else if (i == 0 
        && entry.reviewLevel) {
          const rl = entry.reviewLevel;
          let style = parseInt(rl) < 100 ?
          'border: '+ rl +'px solid'
          : 'font-size:22px;font-weight:bold; color:' + DataTests.revLevels[rl];
          templ = `<span style="${style}">${line.text}</span>`
        }
        return templ + lineBreak
      }).join('')
      + entry.entryType + lineBreak;
      return entryInfo;
    }
  },

  filters : {
    startWithEquialSign : function (lines) {
      const equals = ['=','＝']
      return lines.some(l => equals.some(s => l.text.startsWith(s)))
    },
    
    nonJapLinesAfter3 : function(lines) {
      return lines.some(l => DF.isNotJapaneseOnly(l) && l.originalIndex > 2) && lines.filter(l => DF.isNotJapaneseOnly(l)).length > 1
    },

    //two non japanese lines in a row
    twoNonJapaneseInaRow : function (lines) {
      return lines.some((l, i) => DF.isNotJapaneseOnly(l.text) && lines[i+1] && DF.isNotJapaneseOnly(lines[i+1].text))
    },

    //num of line equals...
    numOfLinesEq : function (lines, num) {
      return lines.length == num
    },

    umOfLinesMore : function (lines, num) {
      return lines.length > num
    },

    numOfLinesLess : function (lines, num) {
      return lines.length < num
    },
    
    nonDefaultOrSimpleAndFirstLineHiragana : function (en) {
      return en.entryType != DataFactory.ENTRY_TYPE.DEFAULT 
            && en.entryType != DataFactory.ENTRY_TYPE.SIMPLE 
            && DataFactory.isHiraganaOnly(en.lines[0].text)
    }
  },
  
  //return Math.max(...entries.map(e => e.lines.length))

  tests : {
    all : function(entries) {
      return entries.map(en =>
        DataTests.entryFormatters.getEntryShortInfoString2(en, true)
          ).join('<br>')
    },
    
    threeLines : function(entries) {
      return entries.filter(en => 
        DataTests.filters.numOfLinesEq(en.lines, 3)
      ).map(en => 
        DataTests.entryFormatters.getEntryShortInfoString2(en, true)
      ).join('<br>')
    },
    
    firstLHiraNotDef : function(entries) {
        return entries.filter(en =>
          DataTests.filters.nonDefaultOrSimpleAndFirstLineHiragana(en)
          ).map(en => 
            DataTests.entryFormatters.getEntryShortInfoString2(en, true)
          ).join('<br>')
    },
    
    examplesAreNearTheEnd : function (entries) {
      return entries.filter(en => 
        DataTests.filters.nonJapLinesAfter3(en.lines)
      ).map(en => 
        DataTests.entryFormatters.getEntryShortInfoString2(en, true)
      ).join('<br>')
    },
    
    reversed : function (entries) {
     return entries.filter(en =>
        DataFactory.isNotJapaneseOnly(en.lines[0].text)
      ).map(en =>
        DataTests.entryFormatters.getEntryShortInfoString2(en, true)
      ).join('<br>')
    },
  }
  
}
