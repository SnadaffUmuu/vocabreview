import { View } from "../view.js";

export const PreloaderView = function () {
  this.show = function () {
    View.prototype.show.call(this);
  }

  this.hidePreloader = function () {
    setTimeout(() => {
      if (this.isShown()) {
        this.hide();
      }
    }, 0)
  },

    this.showPreloaderAndRun = function (callback) {
      if (!this.isShown()) {
        this.show();
      }
      setTimeout(() => {
        callback();
      }, 0)
    }
}

PreloaderView.prototype = Object.assign(Object.create(View.prototype), {
  templateSelector: '#preloaderView',
  templatePath: 'modules/preloader/preloader.html',
});

PreloaderView.prototype.constructor = PreloaderView;