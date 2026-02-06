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

    for (let sourceName in Application.state.views) {
      let letters = []
      const stateViews = Application.state.views[sourceName]
      Object.keys(stateViews).forEach(viewName => {
        const view = Application.views[viewName]
        const stateView = stateViews[viewName]
        if (view && view.isInProgress && view.isInProgress(stateView)) {
          letters.push(view.shortName)
        }
      })
      if (letters.length) {
        res.push(`<td data-change-source="${sourceName}">${sourceName}</td><td>${letters.map(l => `<div class="tag" data-app-type="${l}">${l}</div>`).join('')}</td>`)
      }
    }
    // Object.keys(Application.state.views).forEach(viewName => {
    //   const stateVeiw = Application.state.views[viewName];
    //   for (let viewName : views) {
    //     const view = Applicationl.views[viewName]
    //   }
    //   const B = views.BoardView;
    //   const P = views.PanelView;
    //   const S = views.Slider;
    //   const T = views.TableView;
      
    //   if (B && B.isInProgress()) {
    //     letters.push(['board'])
    //   }
    //   if (P && P.isInProgress()) {
    //     letters.push('panel')
    //   }
    //   if (S && S.isInProgress()) {
    //     letters.push('slider')
    //   }
    //   if (T && T.isInProgress()) {
    //     letters.push('table')
    //   }
    //   if (letters.length) {
    //     res.push(`<td data-change-source="${k}">${k}</td><td>${letters.map(l => `<div class="tag" data-app-type="${l}">${l}</div>`).join('')}</td>`)
    //   }
    // })

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