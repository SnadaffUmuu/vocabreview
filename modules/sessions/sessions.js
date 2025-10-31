import {Application} from "../app.js";
import {View} from "../view.js";

export const SessionsView = function () {

  this.render = function() {
    let res = []
    Object.keys(Application.state.views).forEach(k => {
      const views = Application.state.views[k];
      const B = views.BoardView;
      const P = views.PanelView;
      const S = views.SliderView;
      const T = views.TableView;
      let letters = [];
      if (B && B.itemsInCols && Object.keys(B.itemsInCols).length) {
        letters.push('B')
      }
      if (P && P.itemsInBoxes && Object.keys(P.itemsInBoxes).length) {
        letters.push('P')
      }
      if (S && S.currentIndex && S.currentIndex) {
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

  this.show = function (content) {
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