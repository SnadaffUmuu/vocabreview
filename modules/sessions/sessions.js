import {Application} from "../app.js";
import {View} from "../view.js";
import {objNotEmpty} from "../utils.js"

export const SessionsView = function (dialog) {

  this.dialog = dialog;

  this.map = {
    'board' : Application.state.views.BoardView,
    'panel' : Application.state.views.PanelView,
    'table' : Application.state.views.TableView,
    'slider' : Application.state.views.SliderView
  }

  this.renderedEvents = {
    click: {
      '[data-change-source]' : 'changeSource',
      '[data-app-type]' : 'changeSourceWithView',
    },
  }

  this.changeSource = function (e) {
    e.stopPropagation();
    const theSource = e.target.dataset.changeSource;
    Application.views.MenuView.sourcesList.setValue(theSource);
    Application.views.MenuView.changeSource(theSource);
    Application.views.Dialog.close();
  }

  this.changeSourceWithView = async function (e) {
    e.stopPropagation();
    const theSource = e.target.closest('tr').querySelector('[data-change-source]').dataset.changeSource;
    Application.views.MenuView.sourcesList.setValue(theSource);
    await Application.views.MenuView.changeSource(theSource);
    Application.views.MenuView.switchView(e.target);
    Application.views.Dialog.close();
  }

  this.render = function() {
    let res = []
    Object.keys(Application.state.views).forEach(k => {
      const views = Application.state.views[k];
      const B = views.BoardView;
      const P = views.PanelView;
      const S = views.Slider;
      const T = views.TableView;
      let letters = [];
      if (B && (objNotEmpty(B.removedItems) || objNotEmpty(B.lapses) || objNotEmpty(B.itemsInCols))) {
        letters.push(['board'])
      }
      if (P && (objNotEmpty(P.removedItems) || objNotEmpty(P.itemsInBoxes))) {
        letters.push('panel')
      }
      if (S && S.currentIndex) {
        letters.push('slider')
      }
      if (T && T.order && T.order.length) {
        letters.push('table')
      }
      if (letters.length) {
        res.push(`<td data-change-source="${k}">${k}</td><td>${letters.map(l => `<div class="tag" data-app-type="${l}">${l}</div>`).join('')}</td>`)
      }
    })

    this.element.insertAdjacentHTML('beforeend', `<table id="sessions-list" class="sessions__data"><tr>${res.join('</tr><tr>')}</tr></table>`)
    this.setRenderedEvents(this.element.querySelector('#sessions-list'));
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.render();
  }
}

SessionsView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '.dialog__content',
  templateSelector: '#SessionsView',
  templatePath: 'modules/sessions/sessions.html',
})

SessionsView.prototype.constructor = SessionsView;