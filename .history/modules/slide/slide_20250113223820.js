import { DataFactory } from "../data.js";
import { shuffleArray } from "../utils.js";
import { Element } from "../element.js";
import { Application } from "../app.js";

export const Slide = function () {};

Slide.prototype = Object.assign(Object.create(Element.prototype), {
  templateSelector: '.js-slide',
  templatePath: 'modules/slide/slide.html',

  setSlideProps: function (entry, element) {
    element.dataset.section = entry.section
    if (entry.tag) {
      element.classList.add(entry.tag)
    }
    element.querySelector('.slide-info').value = DataFactory.getEntryInfoString(entry);
  },

  render: function (entry) {
    const element = this.getElement();
    const readingLine = entry.lines.find(l => l.role == DataFactory.LINE_ROLE.reading);
    let lines;
    if (readingLine) {
      lines = entry.lines.filter(l => l.role != DataFactory.LINE_ROLE.reading);
    } else {
      lines = entry.lines
    }
    this.setSlideProps(entry, element);
    const sidesContainer = element.querySelector('.js-slide-inner');
    const sides = lines.map(line => 
      Application.protoElements.ProtoSlideSideElement.render(line)
    );
    const upperSide = shuffleArray(sides)[0];
    upperSide.classList.add('current');
    shuffleArray(sides).forEach(o => sidesContainer.appendChild(o));
    if (readingLine) {
      element.insertAdjacentHTML('afterBegin', `
        <div class="slideReading">
          ${readingLine.text}
        </div>`);
    }
    element.querySelector('#sides-count').innerHTML = sides.length;
    element.querySelector('#current-side').innerHTML = upperSide.dataset.index;
    return element;
  }
});
Slide.prototype.constructor = Slide;
