import {Application} from "../app.js";
import {View} from "../view.js";
import {objNotEmpty} from "../utils.js"

export const SessionsView = function () {

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
        letters.push('B')
      }
      if (P && (objNotEmpty(P.removedItems) || objNotEmpty(P.itemsInBoxes))) {
        letters.push('P')
      }
      if (S && S.currentIndex) {
        letters.push('S')
      }
      if (T && T.order && T.order.length) {
        letters.push('T')
      }
      if (letters.length) {
        res.push(`<td>${k}</td><td>${letters.join(', ')}</td>`)
      }
    })

    this.element.insertAdjacentHTML('beforeend', `<table class="sessions__data"><tr>${res.join('</tr><tr>')}</tr></table>`)
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