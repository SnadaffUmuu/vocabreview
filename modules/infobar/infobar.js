import { View } from "../view.js";
import { Application } from "../app.js"

export const InfobarView = function () {
  this.currentSourceEl = null;
  this.entriesCountEl = null;
  this.events = {
    'click #nightMode': 'toggleNightMode',
  };

  this.toggleNightMode = function () {
    document.body.classList.toggle('night');
    console.log(Application.state);
    Application.state.nightMode = document.body.classList.contains('night');
    console.log(localStorage.getItem('review-state'));
  }  

  this.render = function () {
    if (Application.state?.source) {
      this.setSource(Application.state.source)
    }
    this.setCount(Application.data.currentEntries.length)
  }
  
  this.setCount = function(count) {
    this.entriesCountEl.innerHTML = count;
  }

  this.setSource = function(source) {
    this.currentSourceEl.innerHTML = source;
  }

  this.show = function () {
    View.prototype.show.call(this);
    if (!Application.data.currentEntries?.length) {
      return
    }
    this.currentSourceEl = this.element.querySelector('#currentSource');
    this.entriesCountEl = this.element.querySelector('#currentEntriesCount');
    this.nightModeEl = document.getElementById('nightMode');
    if (Application.state.nightMode) {
      document.body.classList.add('night');
    }    
    this.render();
  }
};
InfobarView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#menuContainer',
  templatePath: 'modules/infobar/infobar.html',
  templateSelector: '#infobar'
})
InfobarView.prototype.constructor = InfobarView;