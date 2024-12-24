import { View } from "../view.js";

export const PreloaderView = function () {
  this.show = function () {
    View.prototype.show.call(this);
  }
}

PreloaderView.prototype = Object.assign(Object.create(View.prototype), {
  templateSelector: '#preloaderView',
  templatePath: 'modules/preloader/preloader.html',
});

PreloaderView.prototype.constructor = PreloaderView;