import { View } from "../view.js";
import { shuffleArray, speak } from "../utils.js";
import { Application } from "../app.js";
import { Slide } from "../slide/slide.js";

export const Slider = function () {
  this.slider = null;
  this.slideViews = [];

  this.events = {};

  this.entriesToSlideViews = async () => {
    const results = await Promise.all(
      shuffleArray(Application.data.entries).map(async (entry) => {
        return View.create(Slide, entry)
      })
    );
    return results;
  };

  this.renderSlider = async () => {
    this.element.innerHTML = '';
    this.slideViews = await this.entriesToSlideViews();
    console.log(this.slideViews)
    this.slideViews.forEach(o => o.show())
  }

  this.initSlider = () => {
    const slider = new KeenSlider(
      "#my-keen-slider",
      {
        loop: true,
        created: function (slider) {
          console.log('slider created')
          const current = slider.slides[0].querySelector('.current[data-reading]')
          if (current) {
            speak(current)
          }
        },
        slideChanged: function (slider) {
          console.log('slider changed')
          const current = slider.slides[slider.track.details.rel].querySelector('.current[data-reading]');
          if (current) {
            speak(current)
          }
        }
      },
    );
    this.slider = slider;
  };

  this.show = async function () {
    View.prototype.show.call(this);
    await this.renderSlider();
    this.initSlider();
  }
};
Slider.prototype = Object.assign(Object.create(View.prototype), {
  templateSelector : '#my-keen-slider',
  templatePath : 'modules/slider/slider.html',
})
Slider.prototype.constructor = Slider;