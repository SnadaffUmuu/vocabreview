import { DataFactory } from "../data.js";
import { shuffleArray } from "../utils.js";
import { Element } from "../element.js";
import { Application } from "../app.js";

export const Slide = function () { };

Slide.prototype = Object.assign(Object.create(Element.prototype), {
  templateSelector: '.js-slide',
  templatePath: 'modules/slide/slide.html',

  setSlideProps: function (entry, element) {
    element.dataset.section = entry.section;
    element.dataset.originalIndex = entry.originalIndex;
    if (entry.tag) {
      element.dataset.tag = entry.tag;
    }
    if (entry.info) {
      const infoEl = element.querySelector('.entry-info');
      infoEl.insertAdjacentHTML('beforeend', entry.info);
      infoEl.style.display = '';
    }
    if (entry.reviewLevel) {
      element.dataset.reviewLevel = entry.reviewLevel
    }
  },

  render: function (entry, mode, currentSideIndex) {
    const element = this.getElement();
    const readingLine = entry.lines.find(l => l.role == DataFactory.LINE_ROLE.reading);
    let lines = entry.lines;
    if (readingLine) {
      lines = entry.lines.filter(l => l.role != DataFactory.LINE_ROLE.reading);
    }
    this.setSlideProps(entry, element);
    const sidesContainer = element.querySelector('.js-slide-inner');
    const sides = lines.map(line =>
      Application.protoElements.ProtoSlideSideElement.render(line)
    );
    let upperSide = currentSideIndex ? sides.find(s => s.dataset.index == currentSideIndex) : null;
    let reoderedSides = null;
    if (!upperSide) {
      let theOrder = null;
      const transArr = [];
      switch (mode) {
        case 'expression':
        case 'meaning':
        case 'example':
          theOrder = DataFactory.lineOrders[mode];
          reoderedSides = theOrder.flatMap(role => {
            const subArr = sides.filter(side => side.dataset.role == role);
            if (!subArr.length) return [null];
            if (['example', 'example_translation'].includes(role)) {
              return shuffleArray(subArr)
            } else {
              return subArr
            }
          }).filter(o => o != null);
          break;
          case 'example_translation':
            theOrder = DataFactory.lineOrders[mode];
            reoderedSides = theOrder.flatMap(role => {
              const subArr = sides.filter(side => side.dataset.role == role);
              if (!subArr.length) return [null];
              
              if ('example_translation' == role) {
                shuffleArray(subArr).forEach(side => {
                  transArr.push(side);
                  const orig = sides.find(ss => ss.dataset.translationLineIndex 
                    == side.dataset.index);
                  if (orig) {
                    transArr.push(orig);
                  }
                });
                return transArr;
              } else if ('example' == role) {
                const untranslatedExamples = subArr.filter(side => !transArr.includes(side));
                return shuffleArray(untranslatedExamples);
              } else {
                return subArr;
              }
            }).filter(o => o != null);
          break;
        case 'random':
          reoderedSides = shuffleArray(sides);
          break;
        case 'original':
        default:
          reoderedSides = sides;
      }
    }
    const finalSides = reoderedSides || sides;
    if (!upperSide) {
      upperSide = finalSides[0];
    }
    upperSide.classList.add('current');
    finalSides.forEach(o => sidesContainer.appendChild(o));
    if (readingLine) {
      element.insertAdjacentHTML('beforeend', `
        <div class="slideReading">
          ${readingLine.text}
        </div>`);
    }
    element.querySelector('.sides-count').innerHTML = sides.length;
    element.querySelector('.current-side').innerHTML = upperSide.dataset.index;
    return element;
  }
});
Slide.prototype.constructor = Slide;
