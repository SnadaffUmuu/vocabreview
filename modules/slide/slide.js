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
      switch (mode) {
        case 'expression':
        case 'meaning':
        case 'example':
        case 'example_translation':
          const theOrder = DataFactory.lineOrders[mode];
          //upperSide = sides.find(side => side.dataset.role == lRoles.expression)
          reoderedSides = theOrder.flatMap(role => {
            const subArr = sides.filter(side => side.dataset.role == role);
            if (!subArr.length) return [null];
            if (['example', 'example_translation'].includes(role)) {
              return shuffleArray(subArr)
            } else {
              return subArr
            }
          }).filter(o => o != null);
          upperSide = reoderedSides[0];
          break;
          /*
        case 'meaning':
          reoderedSides = theOrder.map(role => sides.find(side => side.dataset.role == role) || null);
          //upperSide = sides.find(side => side.dataset.role == lRoles.meaning)
          upperSide = reoderedSides[0];
          break;
        case 'examples':
          reoderedSides = theOrder.map(role => sides.find(side => side.dataset.role == role) || null);
          const examples = sides.filter(side => side.dataset.role == lRoles.example);
          if (examples.length) {
            upperSide = examples[0];
          } else {

            upperSide = null;
          }
          break;
        case 'example_translations':
          //TODO
          break;
          */
        case 'random':
          reoderedSides = shuffleArray(sides);
          upperSide = reoderedSides[0];
          break;
        case 'original':
        default:
          reoderedSides = sides;
          upperSide = reoderedSides[0];
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
