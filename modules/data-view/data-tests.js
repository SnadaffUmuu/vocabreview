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
    getEntryShortInfoString2 : function (entry, searchQuery) {
      let entryInfo = '';
      entryInfo += (entry.tag ? '<div class="tag">' + entry.tag + '</div>' : '');
      entryInfo += '<ul style="margin:0;padding-left:0;list-style:none;">' + entry.lines.map((line, i) => {
        let templ = line.text;
        if (searchQuery && line.text.indexOf(searchQuery) >= 0) {
          const parts = line.text.split(searchQuery);
          templ = parts[0] + '<strong>' + searchQuery + '</strong>' + (parts[1] ? parts[1] : '')
        }
        if (i == 0 
          && entry.reviewLevel) {
          const rl = entry.reviewLevel;
          const color = 'color:' + (parseInt(rl) > 100 ? 'var(--revLevelTextColor)' : 'var(--revLevelMinorTextColor)') + ';';
          const border = 'border-bottom:' + (parseInt(rl < 100 ? rl : rl.substring(0, 1))-1) + 'px solid var(--revLevelTextColor);'
          let style = color + border; 
          templ = `<span class="revLevel" style="${style}">${line.text}</span>`;
        }
        if (line.role) {
          templ += '<span class="lineRole"> ......' + line.role + '</span>';
        }
        const compact = line.isCompact ? 'font-size:15px;' : '';
        return '<li' 
        + (line.role ? ' data-role="' + line.role + '"' : '') 
        + (compact ? ' class="compact"' : '')
        + '>' 
        + templ 
        + '</li>';
      }).join('') + '</ul>';

      if(entry.info) {
        entryInfo += '<div class="entryInfo">ⓘ&nbsp;' + entry.info + '</div>';
      }
      if (searchQuery) {
        entryInfo += `<div class="section">
          ${entry.source}: ${entry.breadcrumbs}
        </div>`
      }
      return `<article class="dataEntry">${entryInfo}</article>`;
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
        DataTests.entryFormatters.getEntryShortInfoString2(en)
          ).join('')
    },

    reversed : function(entries) {
      return entries.filter(en => en.reversed == true).map(en => 
        DataTests.entryFormatters.getEntryShortInfoString2(en)
      ).join('')
    },
    
    threeLines : function(entries) {
      return entries.filter(en => 
        DataTests.filters.numOfLinesEq(en.lines, 3)
      ).map(en => 
        DataTests.entryFormatters.getEntryShortInfoString2(en)
      ).join('')
    },
    
    firstLineHiragana : function(entries) {
        return entries.filter(en =>
          DataTests.filters.firstLineHiragana(en)
          ).map(en => 
            DataTests.entryFormatters.getEntryShortInfoString2(en)
          ).join('')
    },
    
    hasExamples : function (entries) {
      return entries.filter(en => 
        en.lines.some(l => l.role && l.role == DataFactory.LINE_ROLE.example)
      ).map(en => 
        DataTests.entryFormatters.getEntryShortInfoString2(en)
      ).join('')
    },
    
    hasLineStartingWithEqual : function (entries) {
      return entries.filter(en => DataTests.filters.hasLineStartingWith(en.lines, '=')
        || DataTests.filters.hasLineStartingWith(en.lines, '＝')
      ).map(en => 
        DataTests.entryFormatters.getEntryShortInfoString2(en)
      ).join('')
    },

    hasInfo : function (entries) {
      return entries.filter(en =>
        en.info).map(en => 
          DataTests.entryFormatters.getEntryShortInfoString2(en)
        ).join('');
    },
  }
  
}
