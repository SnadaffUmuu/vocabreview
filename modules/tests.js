const a = {
  type : SIMPLE,
  lines : [
    {
      index: 0,
      text: 'いくら…ても',
      types : [hiraganaOnly, japaneseOnly],
      canBeFront : true,
      role: expression,
    },
    {
      index: 1,
      text : 'даже если, сколько бы не',
      types : [nonJapanese, notJapaneseOnly],
      canBeFront : true,
      role : meaning
    },
  ],
  info : [
    "(отрицание, контраст, близко к たとえ…ても)"
  ],
  isReversed : false,
}

App.data.allEntries.forEach(entry => {
  const types = DF.ENTRY_TYPE;
  const roles = DF.LINE_ROLE;
  const lines = entry.lines;
  //reversed entry
  if (DF.isNonJapanese(lines[0].text)) {
    entry.isReversed = true;
    lines[0].role = roles.meaning;
    lines[0].canBeFront = true;
    if (lines.length == 2) {
      entry.TYPE = types.SIMPLE;
      lines[1].role = roles.expression;
      lines[1].canBeFront = true;
    } else if (lines.legnth == 3) {
      const rest = lines.filter((l, i) => i > 0);
      if (rest.length == 2 
        && rest.every(l=>DF.isJspaneseOnly(l.text))) {
          const reading = rest.find(l=>DF.isHiraganaOnly(l.text));
          const expression = rest.find(l=>DF.isJapaneseOnly(l.text) && l != reading)
          if (reading && expression) {
            entry.type = types.DEFAULT;
            const rLine = lines.find(l=>l == reading);
            rLine.isPronounce = true;
            rLine.role = meaning;
            rLine.canBeFront = false;
            const eLine = lines.find(l=>l==expression);
            eLine.pronounce = reading.text;
            eLine.role = roles.expression;
            eLine.canBeFront = true;
          }
      }
    } else {
      console.log('!NON standard')
    }
    console.log(entry)
  }
})

