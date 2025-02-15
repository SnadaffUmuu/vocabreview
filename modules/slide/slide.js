import { DataFactory } from "../data.js";
import { shuffleArray } from "../utils.js";
import { Element } from "../element.js";
import { Application } from "../app.js";

export const Slide = function () {};

Slide.prototype = Object.assign(Object.create(Element.prototype), {
  templateSelector: '.js-slide',
  templatePath: 'modules/slide/slide.html',

  setSlideProps: function (entry, element) {
    element.dataset.section = entry.section;
    element.dataset.originalIndex = entry.originalIndex;
    if (entry.tag) {
      element.dataset.tag = entry.tag;
    }
    const info = entry.info || entry.lines.find(l => l.role == DataFactory.LINE_ROLE.info)?.text
    if (info) {
      const infoEl = element.querySelector('.entry-info');
      infoEl.insertAdjacentHTML('beforeend', info);
      infoEl.style.display = '';
    }
    if (entry.reviewLevel) {
      element.dataset.reviewLevel = entry.reviewLevel
    }
  },

  render: function (entry, mode, currentSideIndex) {
    const lRoles = DataFactory.LINE_ROLE;
    const element = this.getElement();
    const readingLine = entry.lines.find(l => l.role == DataFactory.LINE_ROLE.reading);
    let lines = entry.lines.filter(l => l.role !== DataFactory.LINE_ROLE.info);
    if (readingLine) {
      lines = entry.lines.filter(l => l.role != DataFactory.LINE_ROLE.reading);
    } 
    this.setSlideProps(entry, element);
    const sidesContainer = element.querySelector('.js-slide-inner');
    const sides = lines.map(line => 
      Application.protoElements.ProtoSlideSideElement.render(line)
    );
    let upperSide = currentSideIndex ? sides.find(s => s.dataset.index == currentSideIndex) : null;
    if (!upperSide) {
      switch (mode) {
        case 'expression':
          upperSide = sides.find(side => side.dataset.role == lRoles.expression)
          break;
        case 'meaning':
          upperSide = sides.find(side => side.dataset.role == lRoles.meaning)
          break;
        case 'examples':
          const examples = sides.filter(side => side.dataset.role == lRoles.example);
          upperSide = examples.length ? shuffleArray(examples)[0] : null;
          //TODO: make examples go in a row
          break;
        case 'random':
          upperSide = shuffleArray(sides)[0];
        case 'original':
        default:
          upperSide = sides[0];
      }
    }
    if (!upperSide) {
      upperSide = sides[0];
    }
    upperSide.classList.add('current');
    shuffleArray(sides).forEach(o => sidesContainer.appendChild(o));
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
