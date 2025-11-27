import {View} from "../view.js";

export const Dialog = function () {
  this.events = {
    'click .dialog__closeButton': 'close',
    'click .dialog__overlay' : 'closeByClickOuside'
  }

  this.closeByClickOuside = function (e) {
    if (!e.target.closest('.dialog')) {
      this.close();
    }
  }

  this.close = function (e) {
    this.remove()
  }

  this.render = function (content) {
    const contentContainer = this.element.querySelector('.dialog__content')
    if(content instanceof Element) {
      contentContainer.insertAdjacentElement('beforeend', content)
    } else {
      contentContainer.insertAdjacentHTML('beforeend', content)
    }
  }

  this.show = function (content) {
    View.prototype.show.call(this);
    //this.render(content);
  }  
}
Dialog.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templateSelector: '.js-dialog',
  templatePath: 'modules/dialog/dialog.html'
});

Dialog.prototype.constructor = Dialog;