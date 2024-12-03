import { View } from "../view.js";
import { shuffleArray, speak } from "../utils.js";
import { Application } from "../app.js";
import { Slide } from "../slide/slide.js";

export const Slider = function () {
  this.slider = null;
  this.slideViews = [];
  this.keensliderContainer = null;

  this.entriesToSlideViews = async () => {
    const results = await Promise.all(
      shuffleArray(Application.data.collection.entries).map(async (entry) => {
        return View.create(Slide, entry)
      })
    );
    return results;
  };

  this.renderSlider = async () => {
    this.keensliderContainer.innerHTML = '';
    this.slideViews = await this.entriesToSlideViews();
    console.log(this.slideViews)
    await Promise.all(
      this.slideViews.map(async o => o.show())
    );
  }

  this.initSlider = () => {
    const slider = new KeenSlider(
      "#my-keen-slider",
      {
        loop: true,
        /*
        created: function (slider) {
          this.updateSpeakerState('reading' in slider.slides[0].querySelector('.current').dataset)
        }.bind(this),
        slideChanged: function (slider) {
          this.updateSpeakerState('reading' in slider.slides[slider.track.details.rel].querySelector('.current').dataset)
        }.bind(this)
        */
      },
    );
    console.log('slider length ', slider.slides.length)
    this.slider = slider;
  };
  /*
  this.updateSpeakerState = function(visible) {
    this.speakEl.style.display = visible ? '' : 'none';
  };
  */
  this.show = async function () {
    View.prototype.show.call(this);
    if (!Application.data.collection?.entries?.length) return;
    this.keensliderContainer = this.element.querySelector('#my-keen-slider');
    this.speakEl = this.element.querySelector('#speak');
    if (this.slider) {
      this.slider.destroy();
    }
    await this.renderSlider();
    this.initSlider();
    this.element.addEventListener('slideRotated', (e) => {
      //this.updateSpeakerState('reading' in e.detail.currentSide.dataset)
    })
  }
};
Slider.prototype = Object.assign(Object.create(View.prototype), {
  templateSelector : '#sliderView',
  templatePath : 'modules/slider/slider.html',
})
Slider.prototype.constructor = Slider;