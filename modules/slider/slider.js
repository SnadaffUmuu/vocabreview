import { View } from "../view.js";
import { shuffleArray } from "../utils.js";
import { Application } from "../app.js";
import { Slide } from "../slide/slide.js";

export const Slider = function () {
  this.slider = null;
  this.slideViews = [];
  this.keensliderContainer = null;
  this.currentSlideIndexEl = null;

  this.showCurrentIndex = function (index) {
    this.currentSlideIndexEl.innerHTML = index;
  }

  this.entriesToSlideViews = async () => {
    const entries = this.data.entries;
    const results = await Promise.all(
      shuffleArray(entries).map(async (entry) => {
        return View.create(Slide, entry)
      })
    );
    return results;
  };

  this.renderSlider = async () => {
    this.slideViews = await this.entriesToSlideViews();
    await Promise.all(
      this.slideViews.map(async o => o.show())
    );
  }

  this.initSlider = () => {
    const showIndex = (index) => {
      this.showCurrentIndex(index)
    }
    const slider = new KeenSlider(
      "#my-keen-slider",
      {
        loop: true,
        created: (slider) => {
          showIndex(slider.track.details.rel)
        },
        slideChanged: (slider) => {
          showIndex(slider.track.details.rel)
        }
      },
    );
    this.slider = slider;
  };

  this.reset = function () {
    this.data = {};
    if (this.slider) {
      this.slider.destroy();
    }
    this.keensliderContainer.innerHTML = '';
  };

  this.render = async function () {
    this.reset();
    if (!Application.data.currentEntries?.length) {
      return
    }
    this.data.entries = Application.data.currentEntries
    await this.renderSlider();
    this.initSlider();
    setTimeout(() => {
      if (Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
    }, 0)
  }

  this.show = async function () {
    View.prototype.show.call(this);
    this.currentSlideIndexEl = this.element.querySelector('#currentSlideIndex');
    this.keensliderContainer = this.element.querySelector('#my-keen-slider');
    this.speakEl = this.element.querySelector('#speak');
    this.render();
  }
};

Slider.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templateSelector: '#sliderView',
  templatePath: 'modules/slider/slider.html',
});

Slider.prototype.constructor = Slider;