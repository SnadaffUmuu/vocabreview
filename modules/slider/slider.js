import { View } from "../view.js";
import { shuffleArray } from "../utils.js";
import { Application } from "../app.js";
import { Slide } from "../slide/slide.js";

export const Slider = function () {
  this.slider = null;
  this.slideViews = [];
  this.keensliderContainer = null;

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
      },
    );
    console.log('slider length ', slider.slides.length)
    this.slider = slider;
  };
  this.show = async function () {
    View.prototype.show.call(this);
    console.log(Application.filteredData.entries);
    console.log(Application.filteredData.entries !== null && Application.filteredData.entries.length > 0);
    if (Application.filteredData.entries !== null && Application.filteredData.entries.length > 0) {
      this.data.entries = Application.filteredData.entries
    } else {
      if (!Application.data.collection?.entries?.length) return;
      this.data.entries = Application.data.collection.entries
    }
    this.keensliderContainer = this.element.querySelector('#my-keen-slider');
    this.speakEl = this.element.querySelector('#speak');
    if (this.slider) {
      this.slider.destroy();
    }
    await this.renderSlider();
    this.initSlider();
  }
};
Slider.prototype = Object.assign(Object.create(View.prototype), {
  templateSelector : '#sliderView',
  templatePath : 'modules/slider/slider.html',
})
Slider.prototype.constructor = Slider;