export const DataTests = {

  entryFormatters : {
    getEntryShortInfoString2 : function (entry, forHtml) {
      const lineBreak = forHtml ? '<br>' : '\n';
      let entryInfo = (entry.tag ? 'entryTag: ' + entry.tag + lineBreak : '');
      entryInfo += entry.lines.map(line => {
        let templ = `${line.text}`;
        if (line.isPronounce) {
          templ = `<span style="text-decoration:underline">${line.text}</span>`
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
  },
  
  //return Math.max(...entries.map(e => e.lines.length))

  tests : {
    testA : function(entries) {
      return entries.filter(en => 
        DataTests.filters.numOfLinesEq(en.lines, 3)
      ).map(en => 
        DataTests.entryFormatters.getEntryShortInfoString2(en, true)
      ).join('<br>')
    }
  }
  
}