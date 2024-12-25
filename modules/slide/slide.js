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
    const pronounceLine = entry.lines.find(l => l.isPronounce);
    let lines;
    if (pronounceLine) {
      this.pronounceLine = pronounceLine;
      lines = entry.lines.filter(l => l != pronounceLine);
    } else {
      lines = entry.lines
    }
    this.setSlideProps(entry, element);
    const sidesContainer = element.querySelector('.js-slide-inner');
    const sides = lines.map(line => 
      Application.protoElements.ProtoSlideSideElement.render(line)
    );
    shuffleArray(sides)[0].classList.add('current');
    shuffleArray(sides).forEach(o => sidesContainer.appendChild(o));
    if (pronounceLine) {
      element.insertAdjacentHTML('afterBegin', `
        <div class="slidePronounce">
          ${pronounceLine.text}
        </div>`);
    }
    return element;    
  }
});
Slide.prototype.constructor = Slide;
