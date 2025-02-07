import { DataFactory } from "./data";

const getEntryShortInfoString2 = (entry, forHtml) => {
  const lineBreak = forHtml ? '<br>' : '\n';
  let entryInfo = (entry.tag ? 'entryTag: ' + entry.tag + lineBreak : '');
  entryInfo += entry.lines.map(line => {
    let templ = `${line.text}`;
    if (line.role && line.role == DataFactory.LINE_ROLE.reading) {
      templ = `<span style="text-decoration:underline">${line.text}</span>`
    }
    return templ + lineBreak
  }).join('') + lineBreak;
  //+ entry.entryType + lineBreak;
  return entryInfo;
}

//entries with line starting with equals
const startWithEquialSign = (lines) => {
  const equals = ['=','＝']
  return lines.some(l => equals.some(s => l.text.startsWith(s)))
}

//two non japanese lines in a row
const twoNonJapaneseInaRow = (lines) => {
  return lines.some((l, i) => DF.isNotJapaneseOnly(l.text) && lines[i+1] && DF.isNotJapaneseOnly(lines[i+1].text))
}
//return Math.max(...entries.map(e => e.lines.length))

//num of line equals...
const numOfLinesEq = (lines, num) => {
  return lines.length == num
}

const numOfLinesMore = (lines, num) => {
  return lines.length > num
}

const numOfLinesLess = (lines, num) => {
  return lines.length < num
}

return entries.filter(en => 
  numOfLinesEq(en.lines, 3)
).map(en => 
  getEntryShortInfoString2(en, true)
).join('<br>')