import { DataFactory } from "../data.js"

export const DataTests = {
  
  /*
  entry data model
  {
    originalIndex : 0,
    section : 9949949494,
    info : 'info',
    tag : 'tag',
    reviewLevel : '100',
    //reversed : true,
    lines: [
      {
        originalIndex : 1,
        text : 'line text',
        role : 'meaning',
        //theSameAs : true,
        //translationLineIndex : 2,
        //speakable : true,
        //isCompact : false,
      }
    ],
  }
  */

  entryFormatters : {
    getEntryShortInfoString2 : function (entry, forHtml) {
      //const lineBreak = forHtml ? '<br>' : '\n';
      let entryInfo = (entry.tag ? '<div class="tag">' + entry.tag + '</div>' : '');
      
      entryInfo += '<ul style="margin:0;padding-left:0;list-style:none;">' + entry.lines.map((line, i) => {
        const compact = line.isCompact ? 'font-size:15px;' : '';
        let templ = compact ? `<span style="${compact}">${line.text}</span>` : line.text;
        if (line.role && line.role == DataFactory.LINE_ROLE.reading) {
          templ = `<span style="color:var(--table-text-color-reading);font-size:15px;">${line.text}</span>`
        } 
        if (i == 0 
          && entry.reviewLevel) {
          const rl = entry.reviewLevel;
          const commonRules = 'font-size:25px; border-radius:5px; display:inline-block; padding-bottom:3px;';
          const color = 'color:' + (parseInt(rl) > 100 ? 'var(--revLevelTextColor)' : 'var(--revLevelMinorTextColor)') + ';';
          const border = 'border-bottom:' + (parseInt(rl < 100 ? rl : rl.substring(0, 1))-1) + 'px solid var(--revLevelTextColor);'
          let style = commonRules + color + border + compact; 
          templ = `<span style="${style}">${line.text}</span>`;
        }
        if (line.role) {
          templ += '<span style="opacity:0.5;font-size:13px;"> ......' + line.role + '</span>';
        }
        //return templ + lineBreak
        return '<li' + (line.role ? ' data-role="' + line.role + '"' : '') + '>' + templ + '</li>';
      }).join('') + '</ul>';

      //+ `<span style="color:#ccc">${entry.entryType}</span>` + lineBreak;
      //+ lineBreak;
      if(entry.info) {
        entryInfo += '<div style="font-size:13px;padding:2px 5px 5px;border:1px dotted var(--paleBorder);border-radius:5px;width:fit-content;margin-top:5px;">ⓘ&nbsp;' + entry.info + '</div>';
      }
      return entryInfo;
    }
  },

  filters : {
    startWithEquialSign : function (lines) {
      const equals = ['=','＝']
      return lines.some(l => equals.some(s => l.text.startsWith(s)))
    },
    
    nonJapLinesAfter3 : function(lines) {
      return lines.some(l => 
        DF.isNotJapaneseOnly(l) && l.originalIndex > 2) 
          && lines.filter(l => DF.isNotJapaneseOnly(l)).length > 1
    },

    //two non japanese lines in a row
    twoNonJapaneseInaRow : function (lines) {
      return lines.some((l, i) => 
        DF.isNotJapaneseOnly(l.text) 
          && lines[i+1] 
          && DF.isNotJapaneseOnly(lines[i+1].text))
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
    
    firstLineHiragana : function (en) {
      return DataFactory.isHiraganaOnly(en.lines[0].text)
    },
    
    hasLineStartingWith : function (lines, symbol) {
      return lines.some(l => l.text.startsWith(symbol));
    }
  },
  
  tests : {
    all : function(entries) {
      return entries.map(en =>
        DataTests.entryFormatters.getEntryShortInfoString2(en, true)
          ).join('<br>')
    },

    reversed : function(entries) {
      return entries.filter(en => en.reversed == true).map(en => 
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
    
    firstLineHiragana : function(entries) {
        return entries.filter(en =>
          DataTests.filters.firstLineHiragana(en)
          ).map(en => 
            DataTests.entryFormatters.getEntryShortInfoString2(en, true)
          ).join('<br>')
    },
    
    hasExamples : function (entries) {
      return entries.filter(en => 
        en.lines.some(l => l.role && l.role == DataFactory.LINE_ROLE.example)
      ).map(en => 
        DataTests.entryFormatters.getEntryShortInfoString2(en, true)
      ).join('<br>')
    },
    
    hasLineStartingWithEqual : function (entries) {
      return entries.filter(en => DataTests.filters.hasLineStartingWith(en.lines, '=')
        || DataTests.filters.hasLineStartingWith(en.lines, '＝')
      ).map(en => 
        DataTests.entryFormatters.getEntryShortInfoString2(en, true)
      ).join('<br>')
    },

    hasInfo : function (entries) {
      return entries.filter(en =>
        en.info).map(en => 
          DataTests.entryFormatters.getEntryShortInfoString2(en, true)
        ).join('<br>');
    },
  }
  
}
