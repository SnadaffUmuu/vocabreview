import { View } from "../view.js";
import { shuffleArray } from "../utils.js";
import { Application } from "../app.js";
import { Slide } from "../slide/slide.js";

export const Slider = function () {
  this.templateSelector = '#my-keen-slider';
  this.templatePath = 'modules/slider/slider.html';
  this.slider = null;
  this.slideViews = [];

  this.events = {

  };

  this.entriesToSlideViews = async (entries) => {
    const results = await Promise.all(
      entries.map(async (entry) => {
        return Slide.create(entry)
      })
    );
    return results;
  };

  this.renderSlider = async () => {
    this.element.innerHTML = '';
    this.slideViews = await this.entriesToSlideViews(shuffleArray(Application.data.entries));
    console.log(this.slideViews);
    this.slideViews.forEach(o => o.show())
    /*
    shuffleArray(Application.data.entries).forEach((entry, i) => {
      const lines = shuffleArray(entry.lines).map(s => {
        let classes = [];
        if (regex.nonJapaneseRegex.test(s)) {
          classes.push('transcription')
        }
        return `<div class="card-inner ${classes.join(' ')}"${DataFactory.isForReading(s) ? ' data-reading="' + s + '"' : ''}>${s}</div>`
      }).join(``);
      this.element.insertAdjacentHTML('beforeend', `
          <div class="keen-slider__slide ${entry.type ? entry.type : ''}">
            <div class="slide-inner" data-entry="${i}">
              ${lines}
            </div>
          </div>
          `);
      const entryEl = this.element.querySelector(`[data-entry="${i}"] .card-inner`);
      if (entryEl) {
        entryEl.classList.add('current');
      }
    })
    */
    /*
        Array.from(this.element.querySelectorAll('.slide-inner')).forEach(el => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            //rotate(e.target);
          })
        })
    */
  }

  this.initSlider = () => {
    this.slider = new KeenSlider(
      "#my-keen-slider",
      {
        loop: true,
        created: (slider) => {
          console.log('slider created')
          /*
          const current = slider.slides[0].querySelector('.current[data-reading]')
          if (current) {
            //speak(current)
          }
          */
        },
        slideChanged: (slider) => {
          console.log('slider changed')
          /*
          const current = slider.slides[slider.track.details.rel].querySelector('.current[data-reading]');
          if (current) {
            //speak(current)
          }
          */
        }
      },
    );
  };

  this.show = async function () {
    View.prototype.show.call(this);
    await this.renderSlider();
    this.initSlider();
  }
};
Slider.prototype = Object.create(View.prototype);
Slider.prototype.constructor = Slider;
Slider.create = View.create;